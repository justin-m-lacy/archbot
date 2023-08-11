import { StoryContent } from './objects/story-content';
import { Story } from './objects/story';
import { StoryBuilder } from './builders/story-builder';
import { IdStore } from './id-store';
import { archPost } from '@src/utils/fetch';
import { getAccessKey, getEncryptionKey } from './novelai-crypt';
import { AiMode, ObjectType, IStoryContent, IStory, AiModel, NovelAIConfig, RepetitionPenalty, GenerateParams, IStoryData, IStoryContentData, STORY_METADATA_VERSION } from './novelai-types';
import { Keystore } from './keystore';
import { getNovelApi } from 'plugins/novelai/novelai-api';
export { AiMode, ObjectType, IStoryContent, IStory as IStory, AiModel, NovelAIConfig };

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
        prefix: "euterpe-v2:74123c83e0c4cee8a655206014dd7bcc5adf2aee040efa66db4dbdc1e54833d0:e91fa243411b234a66bfe352d654819cd6e799887e481921107a75514b89c1e0",
        use_string: true,
        generate_until_sentence: true,
        temperature: 0.65,
        min_length: 2,
        max_length: 34,
        repetition_penalty: 2.975,
        phrase_rep_pen: RepetitionPenalty.Aggressive
    },
    [AiMode.Story]: {
        prefix: undefined,
        use_string: true,
        generate_until_sentence: true,
        temperature: 0.65,
        min_length: 12,
        max_length: 48,
        repetition_penalty: 2.975,
        phrase_rep_pen: RepetitionPenalty.Aggressive
    }
}

export const getNovelAiClient = (accessToken: string, encryptionKey: Uint8Array) => {

    const novelApi = getNovelApi(accessToken);

    const modelIndex = 0;
    const models = ['euterpe-v2', 'clio-v1', '6B-v4'];

    const idStore = new IdStore();
    const keystore: Keystore = new Keystore();
    let storyBuilder: StoryBuilder | null = null;

    const getStoryBuilder = () => {
        return storyBuilder ?? (storyBuilder = new StoryBuilder(idStore, keystore));
    }

    let chatModel: string = models[modelIndex];
    let storyModel = 'euterpe-v2';

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

            const result = await novelApi.getKeystore();

            await keystore.descryptStore(result!, encryptionKey)

            void loadStories();

        } catch (e) {
            console.log(`${e}`);
        }
    }

    const loadStories = async () => {

        try {

            const storyObjects = await novelApi.getStories();

            for (const story of storyObjects!) {

                const storyData = await keystore.decrypt<IStoryData>(story);
                if (storyData) {
                    console.log(`story id: ${storyData.id}\n remoteId: ${storyData.remoteId}\n remoteStoryId: ${storyData.remoteStoryId}`);

                    void loadStoryContent(storyData.remoteStoryId);
                }

            }

        } catch (e) {
            console.log(`error loading stories: ${e}`);
        }
    };

    const loadStory = async (id: string) => {

        const story = await novelApi.getStory(id);

        const storyData = await keystore.decrypt<IStoryData>(story);
        if (storyData) {
            console.log(`storyData id: ${storyData.id}`);

        } else {
            return undefined;
        }

    };

    const createStory = async (meta: string, props?: Partial<IStoryContentData>) => {
        try {

            const builder = getStoryBuilder();
            const [story, content] = builder.createStory(props ?? {
                title: "New Title"
            }, meta);

            const result = await novelApi.putStoryContent(await content.encrypt(keystore));
            console.dir(result);

            const storyResult = await novelApi.putStory(await story.encrypt(keystore));
            console.dir(storyResult);

        } catch (e) {
            console.log(`Create story error: ${e}`);
        }
    };

    const sendKeystore = async () => {

        const encodedKeystore = await keystore.encryptStore();

    };

    const loadStoryContent = async (id: string) => {

        try {

            const storyContent = await novelApi.getStoryContent(id);

            //const storyContentData = await keystore.decrypt<IStoryContentData>(storyContent);

            console.log(`content id: ${storyContent.id}`);
            console.dir(storyContent);

            _content.set(id, new StoryContent(storyContent));

        } catch (e) {
            console.log(`Load Content Error: ${e}`);
        }
    };

    // Add content to story
    const addContent = async (id: string, content: string) => {

        try {

            const curContent = _content.get(id);

            const result = await novelApi.patchStoryContent(id, content);

            if (curContent) {
            }

            console.dir(result);

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