import { Keystore } from './../keystore';
import { EncryptedStory, IStory, isEncrypted, IStoryData } from './../novelai-types';

export class Story {

    public readonly id: string;
    public readonly meta: string;

    private story: IStory | null = null;
    private encrypted: EncryptedStory | null = null;

    public get isDecrypted() { return this.story !== null }

    private data: IStoryData | null = null;

    constructor(story: IStory | EncryptedStory) {

        this.id = story.id;
        this.meta = story.meta;

        if (isEncrypted(story)) {
            this.encrypted = story;
        } else {
            this.story = story;
            this.data = story.data;
        }

    }

    async encrypt(keystore: Keystore) {

        this.encrypted = Object.assign(this.encrypted ?? {},
            this.story!,
            { data: await keystore.encrypt(this.meta, this.story!.data) });

        return this.encrypted;

    }

    setData(data: IStoryData) {

        this.data = data;
        if (this.story) this.story.data = data;

    }

    getStory() { return this.story }
    getEncrypted() { return this.encrypted! }

}