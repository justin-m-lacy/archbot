import { StoryContent } from './objects/story-content';
import { Story } from './objects/story';
import { StoryBuilder } from './builders/story-builder';
import { IdStore } from './id-store';
import { archPost } from '@src/utils/fetch';
import { getAccessKey, getEncryptionKey } from './novelai-crypt';
import { AiMode, ObjectType, IStoryContent, IStory, NovelAIConfig, RepetitionPenalty, GenerateParams, IStoryData, IStoryContentData, AiModel, AiModels } from './novelai-types';
import { Keystore } from './keystore';
import { getNovelApi } from 'plugins/novelai/novelai-api';
export { AiMode, ObjectType, IStoryContent, IStory as IStory, AiModel, NovelAIConfig };

export type NovelAiClient = ReturnType<typeof getNovelAiClient>;

const API_URL = 'https://api.novelai.net';
const MAX_HISTORY = 50;

const leadingPeriod = /(?:^[\.\,])/i;
const cleanOutput = (s: string) => {
    return s.replace(leadingPeriod, '').trim();
}

/// Generate parameters to send for each AI type.
const GenParams: {
    [Property in AiMode]: GenerateParams
} = {
    [AiMode.Chat]: {
        prefix: undefined,
        use_string: true,
        generate_until_sentence: true,
        temperature: 0.65,
        min_length: 2,
        max_length: 30,
        repetition_penalty: 2.975,
        phrase_rep_pen: RepetitionPenalty.Aggressive
    },
    [AiMode.Story]: {
        prefix: undefined,
        use_string: true,
        generate_until_sentence: true,
        temperature: 0.65,
        min_length: 12,
        max_length: 30,
        repetition_penalty: 2.975,
        phrase_rep_pen: RepetitionPenalty.Aggressive
    }
}


export const getNovelAiClient = (accessToken: string, encryptionKey: Uint8Array) => {

    const novelApi = getNovelApi(accessToken);

    const idStore = new IdStore();
    const keystore: Keystore = new Keystore(encryptionKey);
    let storyBuilder: StoryBuilder | null = null;

    const getStoryBuilder = () => {
        return storyBuilder ?? (storyBuilder = new StoryBuilder(idStore, keystore));
    }

    let chatModel: AiModels = AiModels.Kayra;
    let storyModel = AiModels.Kayra;

    const _stories = new Map<string, Story>();
    const _content = new Map<string, StoryContent>();

    const histories: { [key: number]: string[] } = {

        [AiMode.Chat]: [],
        [AiMode.Story]: []
    };

    const chatRegex = /(\[\[\w+\]\]\:?)\s?/ig;

    const getUserData = async () => {
        return novelApi.getUserData();
    }

    const loadKeystore = async () => {

        try {

            await keystore.decryptStore(
                await novelApi.getKeystore()!
            );

            loadStories();
        } catch (e) {
            console.log(`${e}`);
        }
    }

    const loadStories = async () => {

        try {

            const storyObjects = await novelApi.getStories();

            for (const story of storyObjects!) {

                try {
                    const s = new Story(story, keystore);
                    _stories.set(story.id, s);

                    const sdata = await s.decrypt();
                    if (!sdata) {
                        console.log(`loadStories(): Decrypted story undefined: ${story.id}`);
                    } else if (!sdata) {
                        console.log(`STORY no story data: ${story.id}`)
                    } else if (sdata?.title === "Test Story") {
                        loadStoryContent(sdata.remoteStoryId).then(success => {
                            if (!success) {
                                /// story has no content.
                                void novelApi.deleteStory(story.id).then(ok => console.log(`story deleted.`));
                                _stories.delete(story.id);
                            }
                        });
                    }

                } catch (err) {
                    console.log(`decrypt story failed: ${story.id}`);
                    console.log(err);
                }
            }

        } catch (e) {
            console.log(`error loading stories: ${e}`);
        }
    };

    const loadStory = async (id: string) => {

        const story = await novelApi.getStory(id);

        const storyData = await keystore.decrypt<IStoryData>(story.meta, story?.data ?? '');
        if (storyData) {
            console.log(`storyData id: ${storyData.id}`);

        } else {
            return undefined;
        }

    };

    const createStory = async (meta: string, props?: Partial<IStoryContentData>) => {
        try {

            console.log(`create story with channelId as META: ${meta}`);

            const builder = getStoryBuilder();

            const [story, content] = builder.createStory(props ?? {
                title: "New Title"
            }, meta);

            /// put updated keystore
            await sendKeystore();

            const storyResult = await novelApi.putStory(await story.encrypt());

            console.log(`story created: ${storyResult.id}`);

            const result = await novelApi.putStoryContent(await content.encrypt());
            console.log(`story content created...`);

            return result;

        } catch (e) {
            console.log(`Create story error: ${e}`);
        }
        return undefined;

    };

    const sendKeystore = async () => {

        try {
            const encodedKeystore = (await keystore.encryptStore())!;

            const result = await novelApi.putKeystore(encodedKeystore);
            console.log(`keystore put RESULT: ${result}`)

        } catch (err) {
            console.warn(`error updating keystore: ${err}`);
            console.dir(err);
        }

    };

    /**
     * returns true if content successfully loaded.
     */
    const loadStoryContent = async (id: string) => {

        try {

            const storyContent = await novelApi.getStoryContent(id);
            const content = new StoryContent(storyContent, keystore);

            _content.set(id, content);

            const data = await content.decrypt();
            if (!data) {
                console.log(`${id}: Missing StoryContent data.`);
            } else {

                console.dir(data, { depth: 3 });
            }

            return true;

        } catch (e) {
            console.log(`Load Content Error: ${e}`);
        }
        return false;

    };

    // Add content to story
    const addContent = async (id: string, content: string) => {

        try {

            const curContent = _content.get(id);

            /// add new fragment.
            if (curContent) {

                const encrypted = await curContent.encrypt();
                const result = await novelApi.patchStoryContent(encrypted!);

                console.log(`Patch content complete.`);
                console.dir(result);
            }

        } catch (e) {
            console.log(`Add Content Error: ${e}`);
        }

    };

    const generate = async (prompt: string, mode: AiMode = AiMode.Chat) => {

        const history = histories[mode];

        if (history.length > MAX_HISTORY) {
            history.splice(0, 10);
        }

        history.push(prompt);

        try {
            const output = await novelApi.generate(history.join('\n'),
                mode === AiMode.Story ? storyModel : chatModel, GenParams[mode]);

            if (output) {

                if (mode === AiMode.Chat) {
                    const parts = cleanOutput(output).split('\n');

                    history.push(parts[0]);
                    return parts[0].replace(chatRegex, '');

                } else {

                    history.push(output);
                    return cleanOutput(output);
                }
            }

        } catch (e) {
            console.log(`generate error: ${e}`);
        }
    }

    return {

        getApi() { return novelApi },
        loadKeystore,
        loadStories,
        loadStory,
        createStory,
        loadStoryContent,
        addContent,
        generate,

        clearStory() {
            histories[AiMode.Story] = [];
        },
        clearChat() {
            histories[AiMode.Chat] = [];
        },

    }

}

export const loginNovelAi = async (username: string, password: string) => {

    try {

        const json = await archPost<{ accessToken: string }>(API_URL + '/user/login',
            { key: await getAccessKey(username, password) },
            {
                "content-type": "application/json",
                "accept": "application/json"
            }
        );

        return {
            accessToken: json.accessToken,
            encryptionKey: await getEncryptionKey(username, password)
        }

    } catch (err) {
        console.log(`err: ${err}`);
    }

}