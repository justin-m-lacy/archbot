import { archGet, archPost, archPatch, makeRequest } from '@src/utils/fetch';
import { getAccessKey } from './crypt';
import { AiMode, ObjectType, StoryContent, Story, AiModel, NovelAIConfig, RepetitionPenalty } from './ai-types';
export {AiMode, ObjectType, StoryContent, Story, AiModel, NovelAIConfig};

const API_URL = 'https://api.novelai.net';
const MAX_HISTORY = 50;

const leadingPeriod = /(?:^[\.\,])/i;
const cleanOutput = (s:string)=>{
    return s.replace(leadingPeriod, '').trim();
}

/// Generate parameters to send for each AI type.
const GenParams = {
    [AiMode.Chat]:{
        prefix:"euterpe-v2:74123c83e0c4cee8a655206014dd7bcc5adf2aee040efa66db4dbdc1e54833d0:e91fa243411b234a66bfe352d654819cd6e799887e481921107a75514b89c1e0",
        use_string: true,
        generate_until_sentence:true,
        temperature: 0.65,
        min_length: 2,
        max_length: 34,
        repetition_penalty: 2.975,
        phrase_rep_pen: RepetitionPenalty.Aggressive
    },
    [AiMode.Story]:{
        prefix: undefined,
        use_string: true,
        generate_until_sentence:true,
        temperature: 0.65,
        min_length: 12,
        max_length: 48,
        repetition_penalty: 2.975,
        phrase_rep_pen: RepetitionPenalty.Aggressive
    }
}

export const getNovelAiClient = (token:string)=>{

    const accessToken = token;
    const headers = {
        Authorization:`Bearer ${accessToken}`,
        "content-type": "application/json",
        "accept":"application/json"
    };

    const modelIndex = 0;
    const models = ['euterpe-v2', 'clio-v1', '6B-v4'];

    let activeModel:string = models[modelIndex];
    let userData:unknown;
    
    let histories:{[key:number]:string[]} = {

        [AiMode.Chat]:[],
        [AiMode.Story]:[]
    };

    const get = async <T>(path:string)=>{return archGet<T>(API_URL+path, headers);}

    const send = async <T>(path:string, data?:{[key:string]:unknown})=>{
        return archPost<T>(API_URL + path, data, headers);
    }

    const patch = async <T>(path:string, data?:{[key:string]:unknown})=>{
        return archPatch<T>(API_URL+path, data, headers);
    }
    const put = async <T>(path:String, data?:{[key:string]:unknown})=>{
        return makeRequest( API_URL+path, 'PUT', data, headers);
    }

    const chatRegex = /(\[\[\w+\]\]\:?)\s?/ig;

    const getUserData = async ()=> {

        try {
            userData = await get<any>('/user/data');
        } catch(e){
            console.log(`error: ${e}`);
        }
    }

    const getStories = async ()=>{

        try {
            const stories = (await get<{objects:any[]}>(`/user/objects/${ObjectType.Stories}`)).objects;
            //console.dir(stories);

            return stories;

        } catch (e){
            console.log(e);
        }
    };

    const createStory = async ()=>{
        try {
            const storyContent =
            await put<unknown>(`/user/objects/${ObjectType.Stories}`);

            console.dir(storyContent);

        } catch (e){
            console.log(e);
        }
    };

    const getStoryContent = async (id:string)=>{

        try {
            const storyContent =
            await get<unknown>(`/user/objects/${ObjectType.StoryContent}/${id}`);

            console.dir(storyContent);

        } catch (e){
            console.log(e);
        }
    };

    // Add content to story
    const addContent = async (id:string, content:string)=>{

        try {
            const result = await patch(`/user/objects/${ObjectType.StoryContent}/${id}`, {
            meta: 'unknown',
            data: content,
            changeIndex: 0
          });
        
          console.dir(result);

        } catch (e){
            console.log(`Error: ${e}`);
        }

    };

    const generate = async ( prompt:string, mode:AiMode=AiMode.Chat )=>{

        const history = histories[mode];
    
        if ( history.length>MAX_HISTORY){
            history.splice(0, 10);
        }

        history.push(prompt);

        try {
            const {output} = await send<{output?:string, error?:string}>(
            '/ai/generate',
            {
                model: mode === AiMode.Story ? 'clio-v1' : activeModel,
                input:history.join('\n'),
                parameters:GenParams[mode]
            });

            if ( output){

                if ( mode === AiMode.Chat ){
                    const parts = cleanOutput(output).split('\n');

                    history.push(parts[0]);
                    return parts[0].replace(chatRegex, '');

                } else {

                    history.push(output);
                    return cleanOutput(output);
                }
            }

        } catch (e){
            console.log(`generate error: ${e}`);
        }
    }

    return {

        getStories,
        createStory,
        getStoryContent,
        addContent,
        generate

    }

}

export const loginNovelAi = async (username:string, password:string)=>{

    try {

        const json = await archPost<{accessToken:string}>( API_URL + '/user/login',
        { key:await getAccessKey(username, password) },
            {
                "content-type": "application/json",
                "accept":"application/json"
            }
        );

        return json.accessToken;

    } catch (err){
        console.log(`err: ${err}`);
    }

}