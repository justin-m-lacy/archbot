import { MaybeEncrypted } from './maybe-encrypted';
import { IStoryContent, ContentOrigin, NotDecryptedError, IStoryContentData, Lorebook, LOREBOOK_VERSION, STORY_VERSION } from './../novelai-types';
import { Keystore } from '../keystore';

export class StoryContent {

    public readonly id: string;
    public readonly meta: string;

    private content: IStoryContent;

    private data: MaybeEncrypted<IStoryContentData>;

    public get isDecrypted() { return this.data.isDecrypted() }

    constructor(content: IStoryContent, keystore: Keystore) {

        this.id = content.id;
        this.meta = content.meta;

        this.content = content;
        this.data = new MaybeEncrypted(content.data, {

            decrypt: async (encrypted: string) => {

                const res = await keystore.decrypt<IStoryContentData>(this.meta, encrypted);
                if (res?.document) {
                    console.log(`has document..: ${res.document}`);

                    //const doc = await keystore.decrypt(this.meta, res.document, true)

                    // console.log(`decrypted document: ${doc}`);
                    //console.dir(doc);

                }

                return res;
            },
            encrypt: (data) => {
                return keystore.encrypt(this.meta, data);
            }

        });

    }

    changed() {
        this.content.changeIndex++;
    }

    public addContentText(data: string, origin: ContentOrigin = "user") {

        this.addDataBlock(data, origin);

    }

    public removePreviousBlock() {

        if (!this.content) throw new NotDecryptedError();

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

    private addDataBlock(data: string, origin: ContentOrigin = "user") {

        if (!this.content) throw new NotDecryptedError();

        const fragmentIndex = this.addFragment(data, origin);

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
     * @param data 
     * @param origin 
     */
    private addFragment(data: string, origin: ContentOrigin = "user") {

        if (!this.content) throw new NotDecryptedError();

        const storyBlocks = this.getStoryBlocks();
        const len = storyBlocks.fragments.push(
            {
                data: data,
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

        const decrypted = (this.content.data = await this.data.decrypt());


        return this.content!;

    }

    setData(data: IStoryContentData) {
        this.data.setData(data);
    }

    /**
     * Get the result of encrypting the content.
     * This does not change the state of the internal content:
     * internal unencrypted content remains unencrypted.
     * @param keystore 
     * @returns 
     */
    async encrypt() {

        const storyContent = Object.assign({}, this.content!, { data: await this.data.encrypt() });

        return storyContent;

    }

    getStoryBlocks() {
        return this.data.getData()!.story ??= StoryContent.createStoryBlocks();
    }

    getContent() { return this.content }

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