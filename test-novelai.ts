import { getNovelAiClient, loginNovelAi, type NovelAiClient } from './plugins/novelai/novelai-client';
import { Story } from './plugins/novelai/objects/story';
import { StoryContent } from './plugins/novelai/objects/story-content';
import "dotenv/config";

let client: NovelAiClient;

const configuration = {

    username: process.env.NOVEL_AI_USER ?? '',
    password: process.env.NOVEL_AI_PW ?? '',
    apiToken: process.env.NOVEL_AI_API_TOKEN,
};

initClient();

async function initClient() {

    try {

        const result = (await loginNovelAi(configuration))!;
        client = getNovelAiClient(result.accessToken, result.encryptionKey);

        await client.loadKeystore();

        try {
            const objects = await client.loadStories(true);
            if (objects) {
                await testStories(objects.stories, objects.contents);
            }
        } catch (err) {
            console.log(`test failed.`);
        }

    } catch (error) {
        console.log(`failed to initialize client.`);
        console.error(error);
    }

}

async function testStories(stories: Story[], contents: (StoryContent | undefined)[]) {

    for (let i = 0; i < stories.length; i++) {

        try {
            const story = stories[i];
            const data = await story.decrypt();
            console.log(`story: ${data?.title}`);
            if (data?.title.toLowerCase().includes("test")) {
                console.log(`loading story content...: ${data.title}`);
                await testEditContent(contents[i]);
            }
        } catch (err) {
            console.log(`failed story load: ${stories[i].id}`);
            try {
                const result = await client.deleteStory(stories[i].id);
                console.log(`delete story complete:`);
                console.dir(result);
            } catch (err) {
                console.log(`delete story failed: ${err}`);
            }
        }

    }

    /*for (let i = 0; i < stories.length; i++) {

        const content = contents[i];

        if (content) {
            const data = await content.decrypt();
            if (content.getDocument()) {
                console.log(`has document...`);
            }

        }

    }*/
}

async function testEditContent(content?: StoryContent) {
    if (!content) {
        console.warn(`content not found`);
        return;
    }

    const data = await content.decrypt();
    if (!data) {
        console.log(`data not found`);
    } else {

        content.addContentText("This is more nifty content.");

    }

}

async function testStory(story: Story,) {

}
async function testContent(content: StoryContent) {

}