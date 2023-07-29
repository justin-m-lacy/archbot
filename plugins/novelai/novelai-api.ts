import { archGet, archPost, archPatch, makeRequest } from '@src/utils/fetch';
import { ObjectType, StoryData } from 'plugins/novelai/novelai-types';
import { GenerateParams } from './novelai-types';

const API_URL = 'https://api.novelai.net';

export const getNovelApi = ( accessToken:string )=>{

    const headers = {
        Authorization:`Bearer ${accessToken}`,
        "content-type": "application/json",
        "accept":"application/json"
    };

    
    const get = async <T>(path:string)=>{
        return archGet<T>(API_URL+path, headers);
    }

    const send = async <T>(path:string, data?:{[key:string]:unknown})=>{
        return archPost<T>(API_URL + path, data, headers);
    }

    const patch = async <T>(path:string, data?:{[key:string]:unknown})=>{
        return archPatch<T>(API_URL+path, data, headers);
    }
    const put = async <T>(path:String, data?:{[key:string]:unknown})=>{
        return makeRequest( API_URL+path, 'PUT', data, headers);
    }

return {
    getUserData:async ()=> {

        try {
            return await get<any>('/user/data');
        } catch(e){
            console.log(`error: ${e}`);
        }
    },

    /**
     * @returns base64 encoding of keystore object:
     * {
     *  version:number,
     *  nonce:number[],
     *  sdata:number[]
     * }
     */
    loadKeystore:async()=>{
    
        const result = await get<{keystore:string}>('/user/keystore');
        return result.keystore;

    },
    
    
      loadStories:async ()=>{
    
        try {
    
            const rawStories = await get<{objects:StoryData[]}>(`/user/objects/${ObjectType.Stories}`);
            return rawStories.objects;
        
        } catch (e){
            console.log(`error loading stories: ${e}`);
        }
    },
    
      createStory:async ()=>{
  
        const storyContent =
        await put<unknown>(`/user/objects/${ObjectType.Stories}`);

        return storyContent;

    },
    
      getStoryContent:async (id:string)=>{
    
        try {
            const storyContent =
            await get<unknown>(`/user/objects/${ObjectType.StoryContent}/${id}`);
    
            console.dir(storyContent);
    
        } catch (e){
            console.log(e);
        }
    },
    
    // Add content to story
    addContent:async (storyId:string, content:string)=>{
    
        try {
            const result = await patch(`/user/objects/${ObjectType.StoryContent}/${storyId}`, {
            meta: 'unknown',
            data: content,
            changeIndex: 0
          });
        
          console.dir(result);
    
        } catch (e){
            console.log(`Error: ${e}`);
        }
    
    },
    
        generate:async (history:string, model?:string, params?:GenerateParams)=>{

            const {output} = await send<{output?:string, error?:string}>(
                '/ai/generate',
                {
                    model: model,
                    input:history,
                    parameters:params
                });
            return output;
        }
            
    };

}
