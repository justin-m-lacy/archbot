import { StoryContent } from './objects/story-content';
import { Story } from './objects/story';
import { StoryBuilder } from './builders/story-builder';
import { IdStore } from './id-store';
import { getAccessKey, getEncryptionKey } from './novelai-crypt';
import { AiMode, ObjectType, IStoryContent, IStory, NovelAIConfig, RepetitionPenalty, GenerateParams, IStoryContentData, AiModel, AiModels } from './novelai-types';
import { Keystore } from './keystore';
import { getNovelApi, login } from 'plugins/novelai/novelai-api';
export { AiMode, ObjectType, IStoryContent, IStory as IStory, AiModel, NovelAIConfig };

export type NovelAiClient = ReturnType<typeof getNovelAiClient>;

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

    //console.log(`access: ${accessToken}`);

    const idStore = new IdStore();
    const keystore: Keystore = new Keystore(encryptionKey);
    let storyBuilder: StoryBuilder | null = null;

    const getStoryBuilder = () => {
        return storyBuilder ?? (storyBuilder = new StoryBuilder(idStore, keystore));
    }

    let chatModel: AiModels = AiModels.Kayra;
    let storyModel = AiModels.Kayra;

    const _content = new Map<string, StoryContent>();

    const histories: { [key: number]: string[] } = {

        [AiMode.Chat]: [],
        [AiMode.Story]: []
    };

    const chatRegex = /(\[\[\w+\]\]\:?)\s?/ig;

    const getUserData = async () => {
        return novelApi.getUserData();
    }

    /**
     * Loads and decrypts user's keystore.
     */
    const loadKeystore = async () => {

        try {


            await keystore.decryptStore(
                await novelApi.getKeystore()!
            );

        } catch (e) {
            console.log(`${e}`);
        }
    }

    /**
     * @param loadContent - Whether to load the associated content of stories.
     */
    const loadStories = async (loadContent: boolean = false) => {

        try {

            const storyObjects = await novelApi.getStories();
            const stories: Story[] = [];
            const contents: (StoryContent | undefined)[] = [];

            for (const story of storyObjects!) {

                const s = new Story(story, keystore);
                stories.push(s);

                try {

                    const sdata = await s.decrypt();
                    if (sdata) {

                        if (loadContent) {
                            const content = await loadStoryContent(sdata.remoteStoryId);
                            if (content) contents.push(content);
                            else contents.push(undefined);
                        }

                    } else {
                        console.log(`loadStories(): Story Data undefined: ${story.id}`);
                    }

                } catch (err) {
                    console.dir(story);
                    console.log(`decrypt story FAILED: ${story.id}`);
                }
            }

            return { stories: stories, contents: contents };

        } catch (e) {
            console.log(`error loading stories: ${e}`);
        }
    };

    const deleteStory = async (id: string) => {
        return await novelApi.deleteStory(id);
    }

    const loadStory = async (id: string) => {

        const story = await novelApi.getStory(id);
        //const [storyData] = await keystore.decrypt<IStoryData>(story.meta, story?.data ?? '');

        const s = new Story(story, keystore);
        await s.decrypt();

        return s;

    };

    const createStory = async (meta: string, title: string = 'New Story', props?: Partial<IStoryContentData>) => {
        try {

            console.log(`create story with channelId as META: ${meta}`);

            const builder = getStoryBuilder();

            const created = builder.createStory(
                title, props ?? {},
                meta);

            /// put updated keystore
            await sendKeystore();

            const storyResult = await novelApi.putStory(await created.story.encrypt());

            console.log(`story created: ${storyResult.id}`);
            console.dir(storyResult);

            const result = await novelApi.putStoryContent(await created.content.encrypt());
            console.log(`story content created..: ${result.id}`);

            return created;

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

                //console.dir(data, { depth: 3 });
            }

            return content;

        } catch (e) {
            console.log(`Load Content Error: ${e}`);
        }
        return undefined;

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
        deleteStory,
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

export const loginNovelAi = async ({ apiToken, username, password }: NovelAIConfig) => {

    try {

        if (!apiToken) {
            const json = await login({ key: await getAccessKey(username, password) });
            apiToken = json.accessToken as string;
        }

        return {
            accessToken: apiToken,
            encryptionKey: await getEncryptionKey(username, password)
        }

    } catch (err) {
        console.log(`err: ${err}`);
    }

}