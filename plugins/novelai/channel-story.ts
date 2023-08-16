import { TextBasedChannel } from 'discord.js';
import { Story } from 'plugins/novelai/objects/story';
import { StoryContent } from 'plugins/novelai/objects/story-content';
import { NovelAiClient } from './novelai-client';
import { AiModels, GenerateParams, RepetitionPenalty, AiMode } from './novelai-types';
import { NovelApi } from './novelai-api';

type StoryEntry = {
    channelId: string,
    storyId?: string,
    contentId?: string,
    meta: string
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

    private loadingStory: boolean = false;
    private loadingContent: boolean = false;

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

    async loadOrCreateStory() {

        if (this.loadingStory) return;

        this.loadingContent = true;
        this.loadingStory = true;

        if (this.storyId) {

        } else {
            return this.createStory();
        }

        this.loadingContent = false;
        this.loadingStory = false;

    }

    async createStory() {

        try {

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

            } else {
                console.log(`failed to create story`);
            }

            return objects;

        } catch (err) {
            console.warn(`createStory(): ${err}`);
        }

    }

    createStoryEntry() {

        const entry = this.cache.get(this.channel.id) ?? {
        };

        entry.meta = this.content?.meta ?? this.story?.meta;
        if (this.story) {
            entry.storyId = this.story?.id;
        }
        if (this.content) {
            entry.contentId = this.content?.id;
        }


        this.cache.cache(this.channel.id, entry);

    }

    setGenerationParams(genParams: Partial<GenerateParams>) {

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

    generate(text: string) {

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