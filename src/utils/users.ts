import { GuildMember, User, Message } from 'discord.js';

export const getLocalName = (user: GuildMember | User) => {

    if ('displayName' in user) {
        return user.displayName ?? user.nickname ?? user.user.username;
    } else { 
        return user.username;
    }

}

export const getSenderName = (m: Message) => {

    if (m.member) {
        return m.member.displayName ?? m.member.nickname ?? m.member.user.username;
    } else {
        return m.author.username;
    }

}