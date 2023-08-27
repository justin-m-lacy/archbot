import { Lorebook, LOREBOOK_VERSION } from './../novelai-types';
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

    createStory(title: string, storyProps: Partial<IStoryContentData>, meta?: string) {

        meta = meta ?? v4();
        this.keystore.addKey(meta);

        const storyId = this.ids.newId();

        const createTime = getTimestamp();
        const shortTime = toShortTime(createTime);

        const storyContent = this.createStoryContent(storyProps, meta)


        const storyData = {

            storyMetadataVersion: STORY_METADATA_VERSION,

            title: title,
            id: meta,
            remoteId: storyId,
            remoteStoryId: storyContent.id,
            createdAt: createTime,
            lastUpdatedAt: createTime,

        }

        return {
            story: new Story({

                id: storyId,
                meta: meta,
                type: ObjectType.Stories,
                data: '',
                lastUpdatedAt: shortTime,
                changeIndex: 0

            },
                this.keystore,
                storyData),
            content: storyContent
        };


    }

    /**
     * Create new story content object.
     */
    createStoryContent(props: IStoryContentData, meta: string) {

        const storyContentId = this.ids.newId();
        const createTime = getTimestamp();
        const shortTime = toShortTime(createTime);

        const contentData: IStoryContentData = {
            story: StoryContent.createStoryBlocks()
        };

        return new StoryContent(
            {
                id: storyContentId,
                type: ObjectType.StoryContent,
                meta: meta,
                data: '',
                changeIndex: 0,
                lastUpdatedAt: shortTime
            },
            this.keystore,
            contentData
        )

    }


    createLorebook(): Lorebook {

        return {
            lorebookVersion: LOREBOOK_VERSION,
            entries: [],
            settings: {
            },
            categories: []
        }

    }

}