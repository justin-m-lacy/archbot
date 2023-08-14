import { DiscordBot } from './bot/discordbot';
import { Client, GuildMember, Message, PermissionFlagsBits } from 'discord.js';

import { parseRoll } from '../plugins/rpg/dice';
import { getSenderName } from './utils/users';

let bot: DiscordBot;
let client: Client;

const DefaultModule = 'default';

export function initBasicCommands(b: DiscordBot) {

    bot = b;
    client = b.client;
    const cmds = b.dispatch;

    cmds.add('help', 'help <cmd>', cmdHelp, { maxArgs: 2, module: DefaultModule });
    cmds.add('roll', '!roll [n]d[s]', cmdRoll, { maxArgs: 1, module: DefaultModule });

    cmds.add('uid', 'uid <username>', cmdUid, { maxArgs: 1, module: DefaultModule });
    cmds.add('uname', "uname <nickname> - get user's username", cmdUName, { maxArgs: 1, module: DefaultModule });
    cmds.add('nick', "nick <displayName> - get user's nickname", cmdNick, { maxArgs: 1, module: DefaultModule });
    cmds.add('displayname', "displayname <user> - get user's display name.", cmdDisplayName, { maxArgs: 1, module: DefaultModule });

    cmds.add('say', '', cmdSay, { maxArgs: 1, module: DefaultModule, hidden: true, access: PermissionFlagsBits.Administrator });

    cmds.add('test', 'test [ping message]', cmdTest, { maxArgs: 1, module: DefaultModule });

}

/**
 * @async
 * @param {Message} msg
 * @param {string} name
 * @returns {Promise}
 */
const cmdUName = async (msg: Message, name: string) => {

    const gMember = bot.userOrSendErr(msg.channel, name);
    if (!gMember || !(gMember instanceof GuildMember)) return;
    return msg.channel.send(name + ' user name: ' + gMember.user.username)

}

/**
 * @async
 * @param {Message} msg
 * @param {string} name
 * @returns {Promise}
 */
const cmdNick = async (msg: Message, name: string) => {

    const gMember = bot.userOrSendErr(msg.channel, name);
    if (gMember && (gMember instanceof GuildMember)) {
        return msg.channel.send(name + ' nickname: ' + gMember.nickname);
    }

}

const cmdDisplayName = async (msg: Message, name: string) => {

    const usr = bot.userOrSendErr(msg.channel, name);
    if (usr && (usr instanceof GuildMember)) {
        return msg.channel.send(name + ' display name: ' + usr.displayName);
    }

}
/**
 *
 * @param {Message} msg
 * @param {string} [cmd] command to get help for.
 */
const cmdHelp = (msg: Message, cmd?: string, page?: string) => {

    const cmdPage = cmd ? Number.parseInt(cmd) : undefined;

    if (cmd && Number.isNaN(cmdPage)) {

        const usePage = page ? Number.parseInt(page) : 0;
        return bot.printCommand(msg.channel, cmd, usePage);

    } else {
        bot.printCommands(msg.channel, cmdPage);
    }

}

/**
 * @async
 * @param {Message} msg
 * @param {string} name
 * @returns {Promise}
 */
const cmdUid = async (msg: Message, name: string) => {

    const gMember = bot.userOrSendErr(msg.channel, name);
    if (!gMember || !(gMember instanceof GuildMember)) return;
    return msg.channel.send(name + ' uid: ' + gMember.user.id)

}

/**
 * @async
 * @param msg
 * @param {string} dicestr - roll formatted string.
 * @returns {Promise}
 */
const cmdRoll = async (msg: Message, dicestr: string) => {

    try {
        const sender = bot.getSender(msg);
        const total = parseRoll(dicestr);
        return msg.channel.send(bot.displayName(sender) + ' rolled ' + total);
    } catch (err) {

        if (err instanceof RangeError) {
            return msg.channel.send("Don't be a dick.");
        }
        return msg.channel.send('Dice format must be: xdy+z');

    }


}

const cmdSay = (msg: Message, what: string) => {

    return msg.channel.send(`[ ${what} ]`);
}

/**
 *
 * @param {Message} msg
 * @param {string} reply
 */
const cmdTest = (msg: Message, reply: string) => {
    if (reply == null) return msg.channel.send('eh?');
    else if (msg.member) return msg.channel.send(reply + ' yourself, ' + getSenderName(msg));
}