import { TextBasedChannel } from 'discord.js';
import { Story } from 'plugins/novelai/objects/story';
import { StoryContent } from 'plugins/novelai/objects/story-content';
import { NovelAiClient } from './novelai-client';
import { AiModels, GenerateParams, RepetitionPenalty, AiMode } from './novelai-types';
import { NovelApi } from './novelai-api';

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

    private readonly content: StoryContent;
    private readonly api: NovelApi;

    constructor(config: {
        channel: TextBasedChannel,
        content: StoryContent,
        story?: Story,
        client: NovelAiClient
    }) {

        this.client = config.client;
        this.channel = config.channel;
        this.content = config.content;
        this.story = config.story ?? null;

        this.api = this.client.getApi();

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

        this.content.addContentText(text);

        this.patchStory()
    }

    /**
     * Patch story changes to server.
     */
    private async patchStory() {

        const encrypted = await this.content.encrypt();
        const result = await this.api.patchStoryContent(encrypted);


    }

    async sendContent() {


    }


}