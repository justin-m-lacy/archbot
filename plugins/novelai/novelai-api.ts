import { archGet, archPost, makeRequest } from '@src/utils/fetch';
import { calcAccessKey } from './crypt';
import { archPatch } from '../../src/utils/fetch';

export type NovelAIConfig = {
    username:string,
    password:string
}

export type AiModel = {
    data:string,
    lr:number,
    steps:number,
}

export enum AiMode {
    Chat=0,
    Story=1
}

enum ObjectType {
    Stories='stories',
    StoryContent='storycontent',
    AiModules='aimodules',
    Shelf='shelf',
    Presets='presets'
}

const API_URL = 'https://api.novelai.net';

const leadingPeriod = /(?:^\.)/gi;
const cleanOutput = (s:string)=>{
    return s.replace(leadingPeriod, ' ').trim();
}

export const getNovelAiClient = (token:string)=>{

    const accessToken = token;
    const headers = {
        Authorization:`Bearer ${accessToken}`,
        "content-type": "application/json",
        "accept":"application/json"
    };

    const modelIndex = 0;
    const models = ['euterpe-v2', 'clio', '6B-v4'];

    let activeModel:string = models[modelIndex];
    let userData:unknown;
    
    let histories:{[key:number]:string[]} = {

        [AiMode.Chat]:[],
        [AiMode.Story]:[]
    };

    const get = async <T>(path:string)=>{
        return JSON.parse( await archGet(API_URL+path, headers) );
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

    const chatRegex = /(\[\[\w+\]\]\:?)\s?/ig;

    const getUserData = async ()=> {

        try {
            const result = await get<any>(
                '/user/data',

            );
            userData = result;
            } catch(e){
                console.log(`error: ${e}`);
            }
    }

    return {

        getStories:async ()=>{

        },

        getStoryContent: async ()=>{

        },

        // Add content to story
        addContent:async (id:string, content:string)=>{

            await archPatch

        },

        generate: async ( prompt:string, mode:AiMode=AiMode.Chat )=>{

            const history = histories[mode];
        
            if ( history.length>50){
                history.splice(0, 10);
            }

            history.push(prompt);

            try {
                const {output} = await send<{output?:string, error?:string}>(
                '/ai/generate',
                {
                    model: mode === AiMode.Story ? 'clio' : activeModel,
                    input:history.join('\n'),
                    parameters:{
                        prefix: mode === AiMode.Chat ? "euterpe-v2:74123c83e0c4cee8a655206014dd7bcc5adf2aee040efa66db4dbdc1e54833d0:e91fa243411b234a66bfe352d654819cd6e799887e481921107a75514b89c1e0" : undefined,
                        use_string: true,
                        generate_until_sentence:true,
                        temperature: 0.8,
                        min_length: 8,
                        max_length: mode === AiMode.Chat? 34 : 48
                }
            });


                if ( output){

                    if ( mode === AiMode.Chat ){
                        const parts = cleanOutput(output).split('\n');

                        history.push(parts[0]);
                        return parts[0].replace(chatRegex, '');

                    } else return cleanOutput(output).replace(/\n/ig, '');
                }


            } catch (e){
                console.log(`generate error: ${e}`);
                return undefined;
            }
        },

        async genImage() {

        }

    }

}

export const loginNovelAi = async (username:string, password:string)=>{

    try {

        const json = await archPost<{accessToken:string}>( API_URL + '/user/login',
        { key:await calcAccessKey(username, password) },
            {
                "content-type": "application/json",
                "accept":"application/json"
            }
        );

        return json.accessToken;

    } catch (err){
        console.log(`err: ${err}`);
        return undefined;
    }

}