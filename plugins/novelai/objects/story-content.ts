import { Keystore } from './../keystore';
import { IStoryContent, IStoryContentData, EncryptedStoryContent, isEncrypted } from './../novelai-types';

export class StoryContent {

    public readonly id: string;
    public readonly meta: string;

    private content: IStoryContent | EncryptedStoryContent;

    public get isDecrypted() { return this.content !== null }

    private data: IStoryContentData | null = null;

    constructor(content: IStoryContent | EncryptedStoryContent) {

        this.id = content.id;
        this.meta = content.meta;

        this.content = content;
    }

    /**
     * Decrypts story content data if it is encrypted.
     * @param keystore 
     */
    async decrypt(keystore: Keystore) {

        if (isEncrypted(this.content)) {

            this.content.data = (await keystore.decrypt(this.content))!;
        }

    }

    /**
     * Get the result of encrypting the content.
     * This does not change the state of the internal content:
     * internal unencrypted content remains unencrypted.
     * @param keystore 
     * @returns 
     */
    async encrypt(keystore: Keystore) {

        if (isEncrypted(this.content)) return this.content;

        return Object.assign({},
            this.content!,
            { data: await keystore.encrypt(this.meta, this.content!.data) });

    }


    getContent() { return this.content }

}