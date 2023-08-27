import { unpackDocument } from './msgpackr';
import { EncryptedObject } from './encrypted-object';
import { IStoryContent, ContentOrigin, IStoryContentData, Lorebook, LOREBOOK_VERSION, STORY_VERSION, IDocument } from './../novelai-types';
import { Keystore } from '../keystore';


export class StoryContent extends EncryptedObject<IStoryContent, IStoryContentData> {

    public get isDecrypted() { return this.data.isDecrypted() }

    constructor(content: IStoryContent, keystore: Keystore, data?: IStoryContentData) {
        super(content, keystore, data);
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


        } else {
            this.addDataBlock(data, origin);
        }

    }

    /**
     * Add document section.
     */
    private addSection(document: IDocument, text: string) {

        document.sections.set(1, {

            type: 1,
            text: text,
            meta: this.meta,
            source: 0

        });
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

    /**
     * Decrypts story content data if it is encrypted.
     * @param keystore 
     */
    async decrypt() {

        const data = await this.data.decrypt();

        /// fix document?
        if (typeof data?.document === 'string') {

            try {
                const result = unpackDocument<IDocument>(data.document);
                data.document = result;

                /*console.dir(data.document, {
                    depth: 7
                });*/

            } catch (err) {
                console.error(err);
            }

        }

        return data;

    }

    getDocument() {

        const data = this.data.getData();
        const doc = data.document;
        if (typeof doc === 'string') {
            data.document = unpackDocument<IDocument>(doc);
            return data.document;
        }
        return doc;

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

        this.container.data = await this.data.encrypt();


        return this.container;
    }

    getStoryBlocks() {
        return this.data.getData()!.story ??= StoryContent.createStoryBlocks();
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