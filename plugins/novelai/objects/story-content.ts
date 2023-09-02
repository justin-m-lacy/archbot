import { unpackDocument, packDocument } from './msgpackr';
import { EncryptedObject } from './encrypted-object';
import { IStoryContent, ContentOrigin, IStoryContentData, Lorebook, LOREBOOK_VERSION, STORY_VERSION, IDocument } from './../novelai-types';
import { Keystore } from '../keystore';


export class StoryContent extends EncryptedObject<IStoryContent, IStoryContentData> {

    public get isDecrypted() { return this.data.isDecrypted() }

    constructor(content: IStoryContent, keystore: Keystore, data?: IStoryContentData) {
        super(content, keystore, data,
            {

                decrypt: async (encrypted: string) => {
                    const [decoded, compressed] = await keystore.decrypt<IStoryContentData>(
                        this.meta, encrypted
                    );
                    this.compressed = compressed;
                    return decoded;
                },
                encrypt: async (data) => {

                    const doc = data.document;
                    if (doc && typeof doc !== 'string') {
                        data.document = packDocument(doc);
                    }

                    const encrypted = await keystore.encrypt(this.meta, data, this.compressed);
                    data.document = doc;

                    return encrypted;
                }

            }
        );
    }

    /**
     * Add text to current story content.
     * @throws Exception if StoryContent not decrypted.
     * @param data 
     * @param origin 
     */
    public addContentText(data: string, origin: ContentOrigin = "user") {

        const document = this.getDocument();
        if (document) {

            this.addDocumentSection(document, data);

        } else {
            this.addDataBlock(data, origin);
        }
        this.getObject().lastUpdatedAt = Date.now();

    }

    /**
     * Add document section.
     */
    private addDocumentSection(document: IDocument, text: string) {

        const sectionKey = Math.floor(Math.random() * (10 ** 16));
        console.log(`adding doc section: ${sectionKey}`)
        document.sections.set(sectionKey, {

            type: 1,
            text: text,
            meta: this.meta,
            source: 0

        });
        document.order.push(sectionKey);

    }



    /**
     * Decrypts story content data if it is encrypted.
     * @param keystore 
     */
    async decrypt() {

        const data = await this.data.decrypt();

        /// fix document?
        if (typeof data?.document === 'string') {

            console.log(`unpacking document...`);
            try {

                const result = unpackDocument<IDocument>(data.document);
                data.document = result;

            } catch (err) {
                console.error(err);
            }

        }

        return data;

    }

    /**
 * Get the result of encrypting the content.
 * This does not change the state of the internal content:
 * internal unencrypted content remains unencrypted.
 * @param keystore 
 * @returns 
 */
    async encrypt() {

        /// do something with data.document?
        const curData = this.data.getData();

        this.container.data = await this.data.encrypt();


        return this.container;
    }

    getDocument() {

        const data = this.data.getData();
        const doc = data.document;
        if (typeof doc === 'string') {
            data.document = unpackDocument<IDocument>(doc);
            return data.document;
        } else {
            return doc;
        }

    }

    getStoryBlocks() {
        return this.data.getData()!.story ??= StoryContent.createStoryBlocks();
    }

    public removePreviousBlock() {

        const storySection = this.getStoryBlocks();
        const blocks = storySection.datablocks;
        if (blocks.length === 0) {
            return;
        }
        const prevBlock = blocks[blocks.length - 1];
        const fragments = storySection.fragments;

        blocks.push({

            nextBlock: [],
            prevBlock: blocks.length - 1,
            fragmentIndex: fragments.length - 1,
            removedFragments: [fragments[prevBlock.fragmentIndex]],
            origin: "user"

        });

    }

    private addDataBlock(text: string, origin: ContentOrigin = "user") {

        console.log(`adding data block...`);
        const fragmentIndex = this.addFragment(text, origin);

        const storySection = this.getStoryBlocks();
        const blocks = storySection.datablocks;
        if (blocks.length <= 0) {

            blocks.push({

                nextBlock: [],
                prevBlock: -1,
                origin: origin,
                fragmentIndex: fragmentIndex
            });

        } else {

            blocks.push({

                nextBlock: [],
                prevBlock: blocks.length - 1,
                origin: origin,
                fragmentIndex: fragmentIndex
            });

            const prevBlock = blocks[blocks.length - 1];
            prevBlock.nextBlock.push(blocks.length - 1);

        }

    }

    /**
     * Adds new fragment and returns fragment index.
     * @param text 
     * @param origin 
     */
    private addFragment(text: string, origin: ContentOrigin = "user") {

        const storyBlocks = this.getStoryBlocks();
        const len = storyBlocks.fragments.push(
            {
                data: text,
                origin: origin
            }
        );

        return len - 1;

    }

    addLorebookEntry(keys: string[], text: string, displayName?: string) {

        const data = this.data.getData()!;

        data.lorebook ??= this.createLorebook();
        data.lorebook.entries.push({

            /// id?
            ///id:undefined,
            text: text,
            keys: keys,
            displayName: displayName ?? keys[0],
            enabled: true,

        });

    }

    createLorebook(): Lorebook {

        return {
            lorebookVersion: LOREBOOK_VERSION,
            entries: [],
            settings: {
            },
            categories: []
        }

    }

    static createStoryBlocks(): NonNullable<IStoryContentData["story"]> {

        return {
            version: STORY_VERSION,
            step: 1,
            datablocks: [],
            currentBlock: 0,
            fragments: []

        }

    }
}