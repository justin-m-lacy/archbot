import { archPost } from '@src/utils/fetch';
import { getAccessKey, getEncryptionKey } from './novelai-crypt';
import { AiMode, ObjectType, StoryContent, StoryData, AiModel, NovelAIConfig, RepetitionPenalty, GenerateParams } from './novelai-types';
import { Keystore } from './keystore';
import { getNovelApi } from 'plugins/novelai/novelai-api';
export {AiMode, ObjectType, StoryContent, StoryData as Story, AiModel, NovelAIConfig};

const API_URL = 'https://api.novelai.net';
const MAX_HISTORY = 50;

const leadingPeriod = /(?:^[\.\,])/i;
const cleanOutput = (s:string)=>{
    return s.replace(leadingPeriod, '').trim();
}


/// Generate parameters to send for each AI type.
const GenParams:{
    [Property in AiMode]:GenerateParams
} = {
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

export const getNovelAiClient = (accessToken:string, encryptionKey:Uint8Array )=>{

    const novelApi = getNovelApi( accessToken );

    const modelIndex = 0;
    const models = ['euterpe-v2', 'clio-v1', '6B-v4'];
    const cryptKey = encryptionKey;

    const keystore:Keystore = new Keystore();

    let chatModel:string = models[modelIndex];
    let storyModel = 'euterpe-v2';

    let userData:unknown;
    
    const stories = new Map<string,string>();

    let histories:{[key:number]:string[]} = {

        [AiMode.Chat]:[],
        [AiMode.Story]:[]
    };

    const chatRegex = /(\[\[\w+\]\]\:?)\s?/ig;

    const getUserData = async ()=> {
        return novelApi.getUserData();
    }

    const loadKeystore = async()=>{

        try {

            const result = await novelApi.loadKeystore();

            await keystore.descryptStore(result!, encryptionKey)

            void loadStories();

        } catch (e){
            console.log(`${e}`);
        }
    }

    const loadStories = async ()=>{

        try {
 
            const storyObjects = await novelApi.loadStories();

            for( const storyData of storyObjects! ){

                console.dir(storyData);
                const story = await keystore.decrypt(storyData);
                if ( story){
                    console.log(`story data: ${story}`);
                } else {
                    console.log(`story empty: ${story}`);
                }

            }

        } catch (e){
            console.log(`error loading stories: ${e}`);
        }
    };

    const createStory = async ()=>{
        try {
            console.log(`creating new story....`);
            const storyContent = await novelApi.createStory();

            console.log(`story created: ${storyContent}`);

            return storyContent;

        } catch (e){
            console.log(e);
        }
    };

    const loadStoryContent = async (id:string)=>{

        try {
            const storyContent = await novelApi.getStoryContent(id);

            console.dir(storyContent);

        } catch (e){
            console.log(e);
        }
    };

    // Add content to story
    const addContent = async (id:string, content:string)=>{

        try {
            const result = await novelApi.addContent( id, content);
        
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
            const output = await novelApi.generate( history.join('\n'),
                mode === AiMode.Story ? storyModel : chatModel, GenParams[mode]);
    
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

        loadKeystore,
        loadStories,
        createStory,
        loadStoryContent,
        addContent,
        generate,

        clearStory(){
            histories[AiMode.Story] = [];
        },
        clearChat(){
            histories[AiMode.Chat] = [];
        },

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

        return {
            accessToken:json.accessToken,
            encryptionKey:await getEncryptionKey(username, password)
        }

    } catch (err){
        console.log(`err: ${err}`);
    }

}