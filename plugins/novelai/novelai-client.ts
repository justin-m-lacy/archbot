import { StoryContent } from './objects/story-content';
import { Story } from './objects/story';
import { StoryBuilder } from './builders/story-builder';
import { IdStore } from './id-store';
import { archPost } from '@src/utils/fetch';
import { getAccessKey, getEncryptionKey } from './novelai-crypt';
import { AiMode, ObjectType, IStoryContent, IStory, AiModel, NovelAIConfig, RepetitionPenalty, GenerateParams, IStoryData, IStoryContentData, AI_MODELS } from './novelai-types';
import { Keystore } from './keystore';
import { getNovelApi } from 'plugins/novelai/novelai-api';
export { AiMode, ObjectType, IStoryContent, IStory as IStory, AiModel, NovelAIConfig };
import SavedStore from "keystore.json";

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


    const idStore = new IdStore();
    const keystore: Keystore = new Keystore(encryptionKey);
    let storyBuilder: StoryBuilder | null = null;

    const getStoryBuilder = () => {
        return storyBuilder ?? (storyBuilder = new StoryBuilder(idStore, keystore));
    }

    let chatModel: string = AI_MODELS[modelIndex];
    let storyModel = 'kayra-v1';

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

            keystore.restore(SavedStore, [], 19);
            const encoded = await keystore.encryptStore();

            console.log(`NEW ENCODED STORE: ${encoded?.keystore.length}`);
            console.dir(encoded);

            const saveRes = await novelApi.putKeystore(encoded!);
            console.log(`PUT KEYSTORE RESULT:`);
            console.dir(saveRes);

            //console.log(`LOADING CURRENT KEYSTORE....`);
            //const result = await novelApi.getKeystore();

            //await keystore.decryptStore(encoded!)

            //void loadStories();

        } catch (e) {
            console.log(`${e}`);
        }
    }

    const loadStories = async () => {

        try {

            const storyObjects = await novelApi.getStories();

            for (const story of storyObjects!) {

                console.log(`decrypt STORY with meta: ${story.meta}`);

                const storyData = await keystore.decrypt<IStoryData>(story);
                if (storyData) {
                    console.log(`story id: ${story.id}\n meta: ${story.meta}\n remoteId: ${storyData.remoteId} remoteStoryId: ${storyData.remoteStoryId}`);

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

            console.log(`create story with channelId as META: ${meta}`);

            const builder = getStoryBuilder();

            return;


            const [story, content] = builder.createStory(props ?? {
                title: "New Title"
            }, meta);

            const storyResult = await novelApi.putStory(await story.encrypt(keystore));

            console.log(`story created: ${storyResult.id}`);

            const result = await novelApi.putStoryContent(await content.encrypt(keystore));
            console.log(`story content created...`);


            /// put updated keystore
            void sendKeystore();

            return result;

        } catch (e) {
            console.log(`Create story error: ${e}`);
        }
    };

    const sendKeystore = async () => {

        try {
            const encodedKeystore = (await keystore.encryptStore())!;

            console.log(`SENDING... encoded keystore: ${encodedKeystore.keystore.length}`);

            await novelApi.putKeystore(encodedKeystore);
            console.log(`keystore was encoded`)
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
            _content.set(id, new StoryContent(storyContent));
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