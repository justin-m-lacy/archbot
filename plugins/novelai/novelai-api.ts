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
    const headers = {
        Authorization:`Bearer ${accessToken}`,
        "content-type": "application/json",
        "accept":"application/json"
    };

    const models = ['euterpe-v2', 'clio'];

    let activeModel:string = 'clio';
    let userData:unknown;
    
    const get = async <T>(path:string)=>{
        return JSON.parse( await archGet(API_URL+path, headers) );
    }

    const send = async <T>(path:string, data?:{[key:string]:unknown})=>{
        return await archPost<T>(
            API_URL + path,
            data,
            headers
        );
    }
    const getUserData = async ()=> {

        try {
            const result = await get<any>(
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
                '/ai/generate',
                {
                    input:prompt,
                    parameters:{
                        use_string: true,
                        generate_until_sentence:true,
                        temperature: 1,
                        min_length: 8,
                        max_length: 20
                }
            });
                console.dir(result);
                console.log(`${result.output}`);

                return result.output;
            } catch (e){
                console.log(`gen failed: ${e}`);
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

        return getNovelAiClient( json.accessToken);

    } catch (err){
        console.log(`err: ${err}`);
        return undefined;
    }

}