import { Keystore } from './../keystore';
import { EncryptedStory, IStory, isEncrypted, IStoryData } from './../novelai-types';

export class Story {

    public readonly id: string;
    public readonly meta: string;

    private story: IStory | EncryptedStory;

    public get isDecrypted() { return this.story !== null }

    constructor(story: IStory | EncryptedStory) {

        this.id = story.id;
        this.meta = story.meta;

        this.story = story;

    }

    /**
     * Decrypts story content data if it is encrypted.
     * @param keystore 
     */
    async decrypt(keystore: Keystore) {

        if (isEncrypted(this.story)) {
            console.log(`Decrypting Story: id:${this.story.id} meta: ${this.story.meta}`);
            this.story.data = (await keystore.decrypt(this.story))!;
        }

    }

    async encrypt(keystore: Keystore) {

        return Object.assign({},
            this.story!,
            { data: await keystore.encrypt(this.meta, this.story!.data) });


    }

    /**
     * Set the current story data.
     * This will mark the story as decrypted.
     * @param data - new story data.
     */
    setData(data: IStoryData) {

        this.story.data = data;

    }

    getStory() { return this.story }

}