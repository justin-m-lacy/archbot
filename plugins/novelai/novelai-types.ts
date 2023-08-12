/**
 * Versions used for local content creation.
 */
export const STORY_METADATA_VERSION = 1;
// unknown
export const STORY_CONTENT_VERSION = 1;

export const LOREBOOK_VERSION = 5;

export const AI_MODELS = ['euterpe-v2', 'clio-v1', '6B-v4', 'kayra-v1'];

// Indicates data will be encrypted.
export type EncryptedData = string;
interface Encryptable {
    data: object
}
export type Encrypted<T extends Encryptable, K extends string = 'data'> = Omit<T, K> & { data: EncryptedData };

export const isEncrypted = <T extends Encryptable>(obj: T | Encrypted<T>): obj is Encrypted<T> => {
    return typeof obj.data === 'string' ? true : false
}

export type NovelAIConfig = {
    username: string,
    password: string
}

export type AiModel = {
    data: string,
    lr: number,
    steps: number,
}

export enum AiMode {
    Chat = 0,
    Story = 1
}

export enum ObjectType {
    Stories = 'stories',
    StoryContent = 'storycontent',
    AiModules = 'aimodules',
    Shelf = 'shelf',
    Presets = 'presets'
}

// TODO: Camel case values are assumed. Check actual values.
export enum RepetitionPenalty {
    Off = 'off',
    VeryLight = 'very_light',
    Light = 'light',
    Medium = 'medium',
    Aggressive = 'aggressive',
    VeryAggressive = 'very_aggressive'
}

export interface IStory {
    id: string,
    /// object type.
    type: ObjectType.Stories,
    /// used to create encryption key?
    meta: string,
    data: IStoryData,
    lastUpdatedAt: number,
    changeIndex: number
}

export type EncryptedStory = Encrypted<IStory>;
export interface IStoryData {
    storyMetadataVersion: number,

    /**
     * Length 36?
     * Remote id is used to fetch from server.
     * According to python, this number might be the meta.
     */
    id: string,
    remoteId: string,

    /**
     * remoteStoryId is equal to the StoryContent id.
     */
    remoteStoryId: string,
    title: string,
    description?: string,
    textPreview?: string,
    isTA?: boolean,
    favorite?: boolean,
    tags?: string[],
    createdAt: number,
    lastUpdatedAt: number,
    isModified?: boolean
}

export interface IStoryContent {
    id: string,
    /// used to create encryption key?
    meta: string,
    data: IStoryContentData,
    lastUpdatedAt?: number,
    changeIndex: number,
    /// object type.
    type: ObjectType.StoryContent
}

export interface IStoryContentData {

    title: string,
    storyContentVersion?: number,
    settings?: object,
    story?: {
        version: number,
        step: number,
        datablocks: StoryBlock[],
        currentBlock: number,
        fragments: StoryFragment[]
    },
    context?: {
        text: string, contextConfig: object
    }[],
    lorebook?: Lorebook,
    storyContextConfig?: StoryContextConfig,
    ephemeralContext?: unknown,
    didGenerate?: boolean,
    settingsDirty?: boolean,

}

export type EncryptedStoryContent = Encrypted<IStoryContent>;
interface StoryContextConfig {
    prefix: string,
    suffix: string,
    tokenBudget: number,
    reservedTokens: number,
    trimDirection: string,
    insertionType: string,
    maximumTrimType: string,
    insertionPosition: number,
    allowInsertionInside: number
}

export interface LorebookEntry {
    id: string;
    text: string;
    contextConfig: object;
    lastUpdatedAt: number;
    displayName: string;
    keys: string[];
    searchRange: number;
    enabled: boolean;
    forceActivation: boolean;
    keyRelative: boolean;
    nonStoryActivatable: boolean;
    category: string;
    loreBiasGroups: Array<any>;
}

export interface Lorebook {
    lorebookVersion: number;
    entries: LorebookEntry[];
    settings: object;
    categories: [];
}

type ContentOrigin = 'user' | 'root' | 'prompt' | 'ai' | 'edit';
export interface StoryFragment {
    data: string,
    origin: ContentOrigin
}

export interface StoryBlock {

    nextBlock: number[],
    prevBlock: number,
    origin: ContentOrigin,
    startIndex: number,
    endIndex: number,
    dataFragment: StoryFragment,
    fragmentIndex: number,
    removedFragments: object[],
    chain: boolean
}

export type GenerateParams = Partial<{
    prefix: string,
    use_string: boolean,
    generate_until_sentence: boolean,
    temperature: number,
    min_length: number,
    max_length: number,
    repetition_penalty: number,
    phrase_rep_pen: RepetitionPenalty
}>