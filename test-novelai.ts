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
            if (data?.title.toLowerCase().includes("test")) {
                console.log(`testing patch story...`);
                await testPatchStoryChange(story);
                console.log(`story changeIndex: ${story.getObject().changeIndex}`);
                // await testEditContent(contents[i]);
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


async function testPatchStoryChange(story: Story) {

    try {
        const result = await client.getApi().patchStory({
            id: story.id,
            meta: story.meta,
            lastUpdatedAt: Date.now(),
            changeIndex: story.changeIndex

        });

        console.log(`result: ${result}`);
    } catch (err) {
        console.log(`patch story failed: ${err}`);

    }
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

        console.log(`changeIndex: ${content.getObject().changeIndex}`);

        content.addContentText("This is more nifty content.");
        const encrypted = await content.encrypt();
        console.log(`encrypted: ${encrypted}`);

        try {
            console.log(`starting patch story...`);
            const result = await client.getApi().patchStoryContent(encrypted);
            console.log(`patch content result:`);
            console.dir(result);

        } catch (err) {
            console.log(`error patching content:`);
            console.log(err);
        }

    }

}

async function testStory(story: Story,) {

}
async function testContent(content: StoryContent) {

}