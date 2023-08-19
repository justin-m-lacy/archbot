import { TextBasedChannel } from 'discord.js';
import { Story } from 'plugins/novelai/objects/story';
import { StoryContent } from 'plugins/novelai/objects/story-content';
import { NovelAiClient } from './novelai-client';
import { AiModels, GenerateParams, RepetitionPenalty, AiMode } from './novelai-types';
import { NovelApi } from './novelai-api';

export type StoryEntry = {
    storyId?: string,
    contentId?: string,
    meta?: string
}


/**
 * Associates a novelai story with a discord channel.
 */
export class ChannelStory {

    private aiModel: AiModels | string = AiModels.Kayra;
    private readonly client: NovelAiClient;

    private readonly channel: TextBasedChannel;

    /**
     * Whether AI attempts to speak like a story, or a chat.
     */
    private mode: AiMode = AiMode.Story;

    private genParams: GenerateParams = {
        prefix: undefined,
        use_string: true,
        generate_until_sentence: true,
        temperature: 0.65,
        min_length: 2,
        max_length: 30,
        repetition_penalty: 2.975,
        phrase_rep_pen: RepetitionPenalty.Aggressive
    }

    private story: Story | null = null;
    private content: StoryContent | null = null;

    private readonly api: NovelApi;

    private storyId?: string;
    private contentId?: string;

    /**
     * Promise resolves on story, content loaded.
     */
    private waitLoad?: Promise<StoryEntry>;

    constructor(config: {
        channel: TextBasedChannel,
        client: NovelAiClient,
        storyId?: string,
        contentId?: string
    }) {

        this.client = config.client;
        this.channel = config.channel;

        this.api = this.client.getApi();

    }

    /**
     * Resolves on story and content loaded.
     * @returns 
     */
    public async loadOrCreateStory() {

        if (!this.story || !this.content) {
            if (!this.waitLoad) this.waitLoad = this._loadOrCreate();
            return this.waitLoad;
        } else {
            return {
                meta: this.content.meta,
                storyId: this.story.id,
                contentId: this.content.id
            }
        }

    }

    private async _loadOrCreate() {

        if (this.contentId || this.storyId) {

            try {

                await this.loadStory();
            } catch (err) {
                console.warn(`failed to load story: ${err}`);
            }

        } else {
            await this.createStory();

        }
        return {
            meta: this.content?.meta ?? this.story?.meta,
            storyId: this.story?.id,
            contentId: this.content?.id
        }

    }

    private async loadStory() {

        this.story = await this.client.loadStory(this.storyId!) ?? null;
        this.content = await this.client.loadStoryContent(this.contentId!) ?? null;

    }

    private async createStory() {

        try {

            console.log(`creating new story...`);
            const params = {
                title: ('name' in this.channel) ? this.channel.name : `Story: ${this.channel.id}`
            };

            const objects = await this.client!.createStory(this.channel.id, params);
            if (objects) {


                console.log(`story created:`);
                this.storyId = objects.story.id;
                this.contentId = objects.content.id;

                this.story = objects.story;
                this.content = objects.content;

                return {
                    storyId: this.storyId,
                    contentId: this.contentId,
                    meta: objects.content.meta ?? objects.story.meta
                }

            } else {
                console.log(`failed to create story`);
            }

            return undefined;

        } catch (err) {
            console.warn(`createStory(): ${err}`);
        }

    }

    public setGenerationParams(genParams: Partial<GenerateParams>) {

        let k: keyof typeof genParams;
        for (k in genParams) {
            const param = genParams[k];
            // @ts-ignore
            if (param !== undefined) this.genParams[k] = genParams[k];

        }


    }

    /**
     * Story is probably not necessary to generate content.
     * @param story 
     */
    setStory(story: Story | undefined | null) {
        this.story = story ?? null;
    }

    public generate(text: string) {

        this.content!.addContentText(text);

        this.patchStory()
    }

    /**
     * Patch story changes to server.
     */
    private async patchStory() {

        const encrypted = await this.content!.encrypt();
        const result = await this.api.patchStoryContent(encrypted);


    }

    async sendContent() {


    }


}