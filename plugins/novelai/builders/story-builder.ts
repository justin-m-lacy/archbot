import { IdStore } from '../id-store';
import { Keystore } from '../keystore';
import { v4 } from 'uuid';

const getTimestamp = () => {
    return Date.now();
}

/**
 * Time rounded to seconds.
 */
const getShortTime = () => {
    return Math.round(Date.now() / 1000);
}

const toShortTime = (time: number) => {
    return Math.round(time / 1000);
}

class StoryBuilder {

    private keystore: Keystore;
    private ids: IdStore;

    constructor(idStore: IdStore, keystore: Keystore) {

        this.keystore = keystore;
        this.ids = idStore;

    }

    createStory(storyProps: { title?: string, }, meta?: string) {

        meta = meta ?? v4();
        this.keystore.addKey(meta);

        const createTime = Date.now();
        const shortTime = toShortTime(createTime);

        const storyId = this.ids.newId();

    }

    /**
     * Create new story content object.
     */
    async createStoryContent(storyData: { title?: string }, meta: string) {

        const data = await this.keystore.encrypt(meta, storyData);

        return await this.keystore.encrypt(meta, {
            meta: meta,
            data: data,
            changeIndex: 0
        });

    }

}