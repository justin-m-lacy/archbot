// Indicates data will be encrypted.
export type EncryptedData = string;

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

export enum ObjectType {
    Stories='stories',
    StoryContent='storycontent',
    AiModules='aimodules',
    Shelf='shelf',
    Presets='presets'
}

// TODO: Camel case values are assumed. Check actual values.
export enum RepetitionPenalty {
    Off='off',
    VeryLight='very_light',
    Light='light',
    Medium='medium',
    Aggressive='aggressive',
    VeryAggressive='very_aggressive'
}

export interface Story {
    id: string,
    /// object type.
    type:ObjectType.Stories,
    /// used to create encryption key?
    meta: string,
    data: EncryptedData,
    lastUpdatedAt: 0,
    changeIndex: 0
}

export interface StoryData {
    storyMetadataVersion:1,

    /**
     * Equal to remote id. Length 36?
     * Remote id is used to fetch from server.
     */
    id:string,
    remoteId:string,
    remoteStoryId:string,
    title:string,
    description:string,
    textPreview:string,
    isTA?:boolean,
    favorite?:boolean,
    tags:string[],
    createdAt:number,
    lastUpdatedAt:number,
    isModified:boolean
}

export interface StoryContent {
    id: string,
    /// used to create encryption key?
    meta: string,
    data: EncryptedData,
    lastUpdatedAt: 0,
    changeIndex: 0,
    /// object type.
    type:ObjectType.StoryContent
}

interface StoryContextConfig {
    prefix:string,
    suffix:string,
    tokenBudget:number,
    reservedTokens:number,
    trimDirection:string,
    insertionType:string,
    maximumTrimType:string,
    insertionPosition:number,
    allowInsertionInside:number
}

export interface LoreBook {
    lorebookVersion:number,
    entries:object[],
    settings:object,
    categories:[]
}

type ContentOrigin = 'user'|'root'|'prompt'|'ai'|'edit';
export interface StoryFragment {
    data:string,
    origin:ContentOrigin
}

export interface StoryBlock {

    nextBlock:number[],
    prevBlock:number,
    origin:ContentOrigin,
    startIndex:number,
    endIndex:number,
    dataFragment:StoryFragment,
    fragmentIndex:number,
    removedFragments:object[],
    chain:boolean
}
export interface StoryContentData {

    id:string,
    title:string,
    storyContentVersion:number,
    settings:object,
    story:{
        version:number,
        step:number,
        datablocks:object[],
        currentBlock:number,
        fragments:object[]
    },
    context:{
        text:string, contextConfig:object
    }[],
    lorebook:LoreBook,
    storyContextConfig:StoryContextConfig,
    ephemeralContext:unknown,
    didGenerate:boolean,
    settingsDirty:boolean,

}

export type GenerateParams = Partial<{
    prefix:string,
    use_string: boolean,
    generate_until_sentence:boolean,
    temperature: number,
    min_length: number,
    max_length: number,
    repetition_penalty: number,
    phrase_rep_pen: RepetitionPenalty
}>