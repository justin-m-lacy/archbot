import { archGet, archPost } from '@src/utils/fetch';
import { calcAccessKey } from './crypt';

export type NovelAIConfig = {
    username:string,
    password:string
}

export type AiModel = {
    data:string,
    lr:number,
    steps:number,
}

const API_URL = 'https://api.novelai.net';


export const getNovelAiClient = (token:string)=>{

    const accessToken = token;
    const authHeader = {Authorization:`Bearer ${accessToken}`};

    const models = [];

    let activeModel:string = 'euterpe-v2';
    let userData:unknown;
    
    const send = async <T>(path:string, data?:{[key:string]:unknown})=>{
        return await archPost<T>(
            API_URL + path,
            data,
            authHeader
        );
    }
    const getUserData = async ()=> {
        try {
            const result = await send<any>(
                '/user/data',
            );
            console.dir(result);
            userData = result;
            } catch(e){
                console.log(`error: ${e}`);
            }
    }
    getUserData();

    return {

        async getModels(){
        },

        async generate( prompt:string ){

            try {
            const result = await send<{output?:string, error?:string}>(
                'ai/generate',
                {
                    input:prompt,
                    model:activeModel,
                    parameters:{
                        use_string: true,
                        temperature: 1,
                        min_length: 8,
                        max_length: 45
                }
            });
                console.dir(result);
                console.log(`${result.output}`);

                return result.output;
            } catch (e){
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
            }
        );

        console.log(`result: ${json}`);

        console.log(`json: ${json.accessToken}`);

        return getNovelAiClient( json.accessToken);

    } catch (err){
        console.log(`err: ${err}`);
        return undefined;
    }

}