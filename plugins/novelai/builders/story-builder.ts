import { ObjectType, STORY_METADATA_VERSION } from 'plugins/novelai/novelai-types';
import { IdStore } from '../id-store';
import { Keystore } from '../keystore';
import { v4 } from 'uuid';
import { IStoryContentData } from '../novelai-types';
import { Story } from '../objects/story';
import { StoryContent } from '../objects/story-content';

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

export class StoryBuilder {

    private keystore: Keystore;
    private ids: IdStore;

    constructor(idStore: IdStore, keystore: Keystore) {

        this.keystore = keystore;
        this.ids = idStore;

    }

    createStory(storyProps: Partial<IStoryContentData>, meta?: string): [Story, StoryContent] {

        meta = meta ?? v4();
        this.keystore.addKey(meta);

        const storyId = this.ids.newId();

        const createTime = Date.now();
        const shortTime = toShortTime(createTime);

        const storyContentId = this.ids.newId();

        const storyData = {

            storyMetadataVersion: STORY_METADATA_VERSION,

            title: storyProps.title ?? "",
            id: meta,
            remoteId: storyId,
            remoteStoryId: storyContentId,
            createdAt: createTime,
            lastUpdatedAt: createTime,

        }

        return [
            new Story({

                id: storyId,
                meta: meta,
                type: ObjectType.Stories,
                data: storyData,
                lastUpdatedAt: shortTime,
                changeIndex: 0

            }),
            new StoryContent(
                {
                    id: storyContentId,
                    type: ObjectType.StoryContent,
                    meta: meta,
                    data: {
                        title: storyProps.title ?? "",
                    },
                    changeIndex: 0,
                    lastUpdatedAt: shortTime
                }
            )
        ];


    }

    /**
     * Create new story content object.
     */
    async createStoryContent(storyData: { title?: string }, meta: string) {

        const data = await this.keystore.encrypt(meta, storyData);

        return {
            meta: meta,
            data: data,
            changeIndex: 0
        };

    }

}