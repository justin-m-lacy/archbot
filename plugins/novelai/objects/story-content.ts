import { IStoryContent, IStoryContentData, EncryptedStoryContent, isEncrypted } from './../novelai-types';

export class StoryContent {

    private content: IStoryContent | null = null;
    private encrypted: EncryptedStoryContent | null = null;

    public get decrypted() { return this.content !== null }

    private data: IStoryContentData | null = null;

    constructor(content: IStoryContent | EncryptedStoryContent) {

        if (isEncrypted(content)) {

            this.encrypted = content;

        } else {

            this.content = content;
            this.data = content.data;

        }

    }

}