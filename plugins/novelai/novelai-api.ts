import { archGet, archPost, archPatch, makeRequest } from '@src/utils/fetch';
import { type GenerateParams, type EncryptedStory, type EncryptedStoryContent, ObjectType } from './novelai-types';

const API_URL = 'https://api.novelai.net';

export const getNovelApi = (accessToken: string) => {

    const headers = {
        Authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
        "accept": "application/json"
    };


    const get = async <T extends object>(path: string) => {
        return archGet<T>(API_URL + path, headers);
    }

    const send = async <T extends object>(path: string, data?: { [key: string]: unknown }) => {
        return archPost<T>(API_URL + path, data, headers);
    }

    const patch = async <T extends object>(path: string, data?: { [key: string]: unknown }) => {
        return archPatch<T>(API_URL + path, data, headers);
    }
    const put = async <T extends object | undefined>(path: String, data?: { [key: string]: unknown }) => {
        return makeRequest(API_URL + path, 'PUT', data, headers) as Promise<T>;
    }
    const del = async <T extends object>(path: String, data?: { [key: string]: unknown }) => {
        return makeRequest<T>(API_URL + path, 'DELETE', data, headers);
    }

    return {
        getUserData: async () => {

            try {
                return await get<any>('/user/data');
            } catch (e) {
                console.log(`error: ${e}`);
            }
        },

        /**
         * @returns base64 encoding of keystore object:
         * {keystore:`{
         *      version:number,
         *      nonce:number[],
         *      sdata:number[]
         * }`,
         * changeIndex:number
         * }
         */
        getKeystore: async () => {

            const result = await get<{ keystore: string, changeIndex: number }>('/user/keystore');
            return result;

        },

        putKeystore: async (encodedKeystore: { keystore: string, changeIndex?: number }) => {

            return await put<any>('/user/keystore', encodedKeystore);

        },

        getStories: async () => {

            const rawStories = await get<{ objects: EncryptedStory[] }>(`/user/objects/${ObjectType.Stories}`);
            return rawStories.objects;

        },

        getStory: async (id: string) => {

            const story = await get<EncryptedStory>(`/user/objects/${ObjectType.Stories}/${id}`);
            return story;
        },


        putStory: async (storyInfo: EncryptedStory) => {

            const story =
                await put<EncryptedStory>(`/user/objects/${ObjectType.Stories}`, storyInfo);

            return story;

        },

        patchStory: async (storyInfo: { id: string, meta: string, data: string, changeIndex: number }) => {

            const story =
                await patch<EncryptedStory>(`/user/objects/${ObjectType.Stories}/${storyInfo.id}`, {
                    meta: storyInfo.meta,
                    data: storyInfo.data,
                    changeIndex: storyInfo.changeIndex
                });

            return story;

        },

        deleteStory: async (id: string) => {

            const story =
                await del(`/user/objects/${ObjectType.Stories}/${id}`);

            return story;

        },

        putStoryContent: async (storyContent: EncryptedStoryContent) => {

            const result = await put<EncryptedStoryContent>(`/user/objects/${ObjectType.StoryContent}`, storyContent);

            return result;
        },

        getStoryContent: async (id: string) => {

            const storyContent =
                await get<EncryptedStoryContent>(`/user/objects/${ObjectType.StoryContent}/${id}`);

            return storyContent;

        },

        patchStoryContent: async (content: { id: string, meta: string, data: string, changeIndex: number }) => {

            try {
                const result = await patch(`/user/objects/${ObjectType.StoryContent}/${content.id}`, {
                    meta: content.meta,
                    data: content.data,
                    changeIndex: content.changeIndex
                });

                console.dir(result);

            } catch (e) {
                console.log(`Error: ${e}`);
            }

        },

        deleteStoryContent: async (id: string) => {

            return await del(`/user/objects/${ObjectType.StoryContent}/${id}`);

        },

        generate: async (history: string, model?: string, params?: GenerateParams) => {

            const { output } = await send<{ output?: string, error?: string }>(
                '/ai/generate',
                {
                    model: model,
                    input: history,
                    parameters: params
                });
            return output;
        }

    };

}
