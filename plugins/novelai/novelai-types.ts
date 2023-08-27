/**
 * Versions used for local content creation.
 */
export const STORY_METADATA_VERSION = 1;
// unknown
export const STORY_CONTENT_VERSION = 6;

export const STORY_VERSION = 2;

export const LOREBOOK_VERSION = 5;

export enum AiModels {
    Euterpe = 'euterpe-v2',
    Clio = 'clio-v1',
    Kayra = 'kayra-v1'
};

// Indicates data will be encrypted.
export type EncryptedData = string;
interface Encryptable {
    data: object | undefined | string
}
export type Encrypted<T extends Encryptable, K extends string = 'data'> = Omit<T, K> & { data: EncryptedData };

export type Unencrypted<T extends Encryptable, K extends string = 'data'> = Omit<T, K> & { data: object };

export const isEncrypted = <T extends Encryptable>(obj: T | Encrypted<T>): obj is Encrypted<T> => {
    return typeof obj.data === 'string' ? true : false
}

export type NovelAIConfig = {
    username: string,
    password: string,
    apiToken?: string,
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
    data: string,
    lastUpdatedAt: number,
    changeIndex: number
}

export interface IStoryData {
    storyMetadataVersion: number,

    /**
     * Story and Content meta. Unsure why.
     */
    id: string,

    /**
     * Id of parent story.
     */
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
    isModified?: boolean,
    hasDocument?: boolean
}

export interface IDocument {

    /**
     * section keys appear random? 16 digits long. not uuid
     * type usually appears to be 1
     * source appears to be 0 for user generated,
     * undefined for prompt
     * meta ex:
     *  1 => [{ position: 0, data: 1, length: 162 },
          { data: 2, length: 56, position: 162 } ],
        2 => []
     */
    sections: Map<number, { type: number, text: string, meta: any, source: number | undefined }>,
    /**
     * keys from sections, defines the order of the sections in the document.
     */
    order: number[],

    /**
     * Unsure what this means.
     * Neither root, current or node keys refer to section keys.
     */
    history: {
        root: number,
        current: number,
        /**
         * keys are not same keys as sections.
         * Sample object:
         *      id: 1424383245752401,
                parent: 1151486769511318,
                children: Set(1) { 1350048921598512 },
                route: undefined,
                changes: Map(2) {
                    1671454468462109 => { type: 1, diff: [Object] },
                    2141014204757573 => { type: 0, section: [Object], after: 1641454468422109 }
                    },
                date: 2023-08-15T07:40:45.104Z,
                genPosition: undefined
         */
        nodes: Map<number, Object>
    },
    /**
     * presumably keyed by section keys.
     * unknown values.
     */
    dirtySections: Map<number, any>,
    /**
     * Maybe a content increment count?
     */
    step: number

}
export interface IStoryContent {
    id: string,
    /// used to create encryption key?
    meta: string,
    data: string,
    lastUpdatedAt?: number,
    changeIndex: number,
    /// object type.
    type: ObjectType.StoryContent
}

export interface IStoryContentData {

    storyContentVersion?: number,
    settings?: object,
    /**
     * Document is base64 encoded string of data packed with msgpack
     */
    document?: string | IDocument,
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
    id?: string;

    /// content of lorebook entry.
    text: string;
    contextConfig?: object;
    lastUpdatedAt?: number;
    displayName: string;

    /// Triggers
    keys: string[];
    searchRange?: number;
    enabled?: boolean;
    forceActivation?: boolean;
    keyRelative?: boolean;
    nonStoryActivatable?: boolean;
    category?: string;
    loreBiasGroups?: Array<any>;
}

export interface Lorebook {
    lorebookVersion: number;
    entries: LorebookEntry[];
    settings: object;
    categories: [];
}

export type ContentOrigin = 'user' | 'root' | 'prompt' | 'ai' | 'edit';
export interface StoryFragment {
    data: string,
    origin: ContentOrigin
}

export interface StoryBlock {

    nextBlock: number[],
    prevBlock: number,
    origin: ContentOrigin,
    startIndex?: number,
    endIndex?: number,
    dataFragment?: StoryFragment,
    fragmentIndex: number,
    removedFragments?: StoryFragment[],
    chain?: boolean
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

export class NotDecryptedError extends Error {
    constructor() {

        super("Object not decrypted");
        this.name = "NotDecryptedError";
    }

}