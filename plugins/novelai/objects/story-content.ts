import { Keystore } from './../keystore';
import { IStoryContent, IStoryContentData, EncryptedStoryContent, isEncrypted } from './../novelai-types';

export class StoryContent {

    public readonly id: string;
    public readonly meta: string;

    private content: IStoryContent | null = null;
    private encrypted: EncryptedStoryContent | null = null;

    public get isDecrypted() { return this.content !== null }

    private data: IStoryContentData | null = null;

    constructor(content: IStoryContent | EncryptedStoryContent) {

        this.id = content.id;
        this.meta = content.meta;

        if (isEncrypted(content)) {

            this.encrypted = content;

        } else {

            this.content = content;
            this.data = content.data;

        }

    }

    async encrypt(keystore: Keystore) {

        this.encrypted = Object.assign(this.encrypted ?? {},
            this.content!,
            { data: await keystore.encrypt(this.meta, this.content!.data) });

        return this.encrypted;

    }


    getContent() { return this.content }
    getEncrypted() { return this.encrypted! }

}