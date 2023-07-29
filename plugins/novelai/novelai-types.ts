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

export interface StoryData {
    id: string,
    /// object type.
    type:string,
    /// used to create encryption key?
    meta: string,
    data: EncryptedData,
    lastUpdatedAt: 0,
    changeIndex: 0
}

export interface StoryContent {
    id: string,
    /// used to create encryption key?
    meta: string,
    data: EncryptedData,
    lastUpdatedAt: 0,
    changeIndex: 0,
    /// object type.
    type:string
}