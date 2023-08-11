import { EncryptedStory, IStory, isEncrypted, IStoryData } from './../novelai-types';

export class Story {


    private story: IStory | null = null;
    private encrypted: EncryptedStory | null = null;

    public get decrypted() { return this.story !== null }

    private data: IStoryData | null = null;

    constructor(story: IStory | EncryptedStory) {

        if (isEncrypted(story)) {
            this.encrypted = story;
        } else {
            this.story = story;
            this.data = story.data;
        }

    }

    setData(data: IStoryData) {

        this.data = data;
        if (this.story) this.story.data = data;

    }


}