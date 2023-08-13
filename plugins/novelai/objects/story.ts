import { Keystore } from './../keystore';
import { EncryptedStory, IStory, isEncrypted, IStoryData } from './../novelai-types';

export class Story {

    public readonly id: string;
    public readonly meta: string;

    private story?: IStory;
    private encrypted?: EncryptedStory;

    private baseProps: Omit<IStory, 'data'>;

    public get isDecrypted() { return this.story !== undefined }

    constructor(story: IStory | EncryptedStory) {

        this.id = story.id;
        this.meta = story.meta;

        this.baseProps = Object.assign({}, story, { data: undefined });

        if (isEncrypted(story)) {
            this.encrypted = story;
        } else {
            this.story = story;
        }

    }

    changed() {
        this.baseProps.changeIndex++;
    }

    /**
     * Decrypts story content data if it is encrypted.
     * @param keystore 
     */
    async decrypt(keystore: Keystore) {

        if (this.story) {
            return this.story;
        } else if (this.encrypted) {

            const newData = (await keystore.decrypt<IStoryData>(this.encrypted.meta, this.encrypted.data))!;

            this.setData(newData);

            return this.story;
        }

    }

    async encrypt(keystore: Keystore) {

        return Object.assign({},
            this.story!,
            { data: await keystore.encrypt(this.meta, this.story!.data) });


    }

    /**
     */
    setData(data: IStoryData) {

        if (this.story) {
            this.story.data = data;
        } else if (this.encrypted) {
            this.story = Object.assign({}, this.encrypted, { data: data });
        }

    }

    getStory() { return this.story }

}