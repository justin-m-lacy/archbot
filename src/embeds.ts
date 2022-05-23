import { Message, MessageEmbed } from 'discord.js';


export const getEmbedUrl = (m: Message) => {

    let url = m.embeds.find(e => e.image?.url != null);
    if (url != null) {
        return url.image?.url;
    } else {

        let attach = m.attachments.find(

            a => a.url != null || a.proxyURL != null

        );
        if (attach) {
            return attach.url ?? attach.proxyURL;
        }

    }
}

export const makeImageEmbed = (imageUrl: string) => {
    return new MessageEmbed({ image: { url: imageUrl, proxy_url: imageUrl } });
}

export const replyEmbedUrl = (m: Message, embedUrl: string, text?: string | null,) => {
    return m.reply(
        {

            content: text ?? ' ', embeds: [
                makeImageEmbed(embedUrl)
            ]
        }
    );
}

export const sendEmbedUrl = (m: Message, embedUrl: string, text?: string | null,) => {

    return m.channel.send({
        content: text ?? ' ', embeds: [
            makeImageEmbed(embedUrl)
        ]
    });

}

