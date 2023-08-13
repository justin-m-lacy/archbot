import { Keystore } from './../keystore';
import { IStoryContent, EncryptedStoryContent, isEncrypted, ContentOrigin, NotDecryptedError, IStoryContentData, Lorebook, LOREBOOK_VERSION, STORY_VERSION } from './../novelai-types';

export class StoryContent {

    public readonly id: string;
    public readonly meta: string;

    private content: IStoryContent | null = null;
    private encryted: EncryptedStoryContent | null = null;

    public get isDecrypted() { return this.content != null }

    constructor(content: IStoryContent | EncryptedStoryContent) {

        this.id = content.id;
        this.meta = content.meta;

        if (isEncrypted(content)) {
            this.encryted = content;
        } else {
            this.content = content;
        }
    }

    changed() {
        if (this.content) {
            this.content.changeIndex++;
        } else if (this.encryted) {
            this.encryted.changeIndex++;
        }
    }

    public addContentText(data: string, origin: ContentOrigin = "user") {

        this.addDataBlock(data, origin);

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

        if (!this.content) throw new NotDecryptedError();

        this.content.data.lorebook ??= this.createLorebook();

        this.content.data.lorebook.entries.push({

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
    async decrypt(keystore: Keystore) {

        if (this.encryted) {
            console.log(`Decrypting StoryContent: id:${this.encryted.id} meta: ${this.encryted.meta}`);
            const contentData = (await keystore.decrypt<IStoryContentData>(this.encryted.meta, this.encryted.data))!;

            this.setData(contentData!);

        }

        return this.content!;

    }

    setData(data: IStoryContentData) {

        if (this.content) {
            this.content.data = data;
        } else if (this.encryted) {
            this.content = Object.assign({}, this.encryted, { data: data });
        }
        this.encryted = null;
    }

    /**
     * Get the result of encrypting the content.
     * This does not change the state of the internal content:
     * internal unencrypted content remains unencrypted.
     * @param keystore 
     * @returns 
     */
    async encrypt(keystore: Keystore) {

        if (this.encryted) return this.encryted;

        this.encryted = Object.assign({},
            this.content!,
            { data: await keystore.encrypt(this.meta, this.content!.data) });

        return this.encryted;

    }

    getStoryBlocks() {
        return this.content!.data.story ??= StoryContent.createStoryBlocks();
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