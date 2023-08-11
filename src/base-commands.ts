import { DiscordBot } from './bot/discordbot';
import { Client, GuildMember, Message, TextBasedChannel, User, PermissionFlagsBits } from 'discord.js';
import { UserHistory } from './history';
import * as jsutils from './utils/jsutils';
import DateFormat from './datedisplay';
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

    cmds.add('uptime', 'uptime', cmdUptime);

    cmds.add('lastplay', '!lastplay <userName> <gameName>', cmdLastPlay, { maxArgs: 2, module: DefaultModule });
    cmds.add('laston', 'laston <userName>', cmdLastOn, { maxArgs: 1, module: DefaultModule });
    cmds.add('lastidle', 'lastidle <userName>', cmdLastIdle, { maxArgs: 1, module: DefaultModule });
    cmds.add('lastactive', 'lastactive <userName>', cmdLastActive, { maxArgs: 1, module: DefaultModule });
    cmds.add('lastoff', 'lastoff <userName>', cmdLastOff, { maxArgs: 1, module: DefaultModule });

    cmds.add('offtime', 'offtime <userName>', cmdOffTime, { maxArgs: 1, module: DefaultModule });
    cmds.add('ontime', 'ontime <username>', cmdOnTime, { maxArgs: 1, module: DefaultModule });
    cmds.add('idletime', 'idletime <username>', cmdIdleTime, { maxArgs: 1, module: DefaultModule });
    cmds.add('playtime', 'playtime <userName>', cmdPlayTime, { maxArgs: 1, module: DefaultModule });

    cmds.add('magicmissile', 'You need material components for all of your spells.',
        (m: Message) => m.channel.send('You attack the darkness.'), { hidden: true, module: 'magic' });
    cmds.add('say', '', cmdSay, { maxArgs: 1, module: DefaultModule, hidden: true, access: PermissionFlagsBits.Administrator });

    cmds.add('palantir', 'What does the Great Eye command?', (m: Message) => m.channel.send('Build me an army worthy of Mordor.'), { hidden: true, module: 'orthanc' });
    cmds.add('ranking', 'ranking', cmdRanking, { hidden: true, maxArgs: 0 });
    cmds.add('fuck', null, cmdFuck, { hidden: true, module: 'explicit' });

    cmds.add('test', 'test [ping message]', cmdTest, { maxArgs: 1, module: DefaultModule });

}





const sendGameTime = async (channel: TextBasedChannel, displayName: string, gameName: string) => {

    const uObject = bot.userOrSendErr(channel, displayName);
    if (!uObject || !(uObject instanceof GuildMember)) return;

    gameName = gameName.toLowerCase();
    if (uObject.presence?.activities?.find(v => v.name.toLowerCase() === gameName)) {
        return channel.send(displayName + ' is playing ' + gameName);
    }

    try {

        const data = await bot.fetchUserData(uObject);
        const games = data.games;

        const dateStr = DateFormat.dateString(games[gameName]);
        return channel.send(displayName + ' last played ' + gameName + ' ' + dateStr);

    } catch (err) {
        console.error(err);
        return channel.send(gameName + ': No record for ' + displayName + ' found.');
    }

}


/**
 *
 * @param {GuildMember} gMember
 * @param {string[]|string} statuses
 * @returns {boolean}
 */
const hasStatus = (gMember: GuildMember | User, statuses: string | string[]) => {

    if (gMember instanceof User) { return false; }
    const status = gMember.presence?.status;
    if (Array.isArray(statuses)) {

        for (let i = statuses.length - 1; i >= 0; i--) {

            if (statuses[i] === status) return true;
        }
        return false;

    }
    return statuses === status;

}

/**
 * checks history object for last time user was in a given status
 * or in any of the statuses given in an array.
 * @param {Object} history
 * @param {string|string[]} statuses
 */
const latestStatus = (history: UserHistory | null | undefined, statuses: string | string[]) => {

    if (!history) return null;
    if (Array.isArray(statuses)) {

        let statusTime = null;

        if (statuses.length === 0) { return null; }
        for (let i = statuses.length - 1; i >= 0; i--) {

            const status = statuses[i];
            if (history.hasOwnProperty(status) === true) {
                statusTime = (!statusTime ? history[status] : Math.max(history[status], statusTime));
            }

        }
        return statusTime;

    } else if (typeof statuses === 'string') {

        if (history.hasOwnProperty(statuses) === true) return history[statuses];

    }
    return null;
}

/**
 * Get the history object of a guild member.
 * @async
 * @param {GuildMember} gMember
 * @returns {Promise<Object|null>}
 */
const readHistory = async (gMember: GuildMember | User) => {

    try {
        const data = await bot.fetchUserData(gMember);
        if (data && data.hasOwnProperty('history')) return data.history;
    } catch (e) {
        console.log(e);
    }
    return null;

}

const cmdRanking = async (m: Message) => { return m.channel.send('Last place: garnish.'); }

const cmdUptime = async (m: Message) => {
    return m.channel.send(
        client.user!.username + ' has reigned for ' + DateFormat.timespan(client.uptime ?? 0));
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

const cmdLastPlay = (msg: Message, who: string, game: string) => {
    return sendGameTime(msg.channel, who, game);
}

const cmdSay = (msg: Message, what: string) => {

    return msg.channel.send(`[ ${what} ]`);
}

/**
 *
 * @param {Message} msg
 * @param {string} who - user to check.
 */
const cmdLastOn = (msg: Message, who: string) => {
    sendHistory(msg.channel, who, ['online', 'idle', 'dnd'], 'online');
}

/**
 *
 * @param {Message} msg
 * @param {string} who - user to check.
 */
const cmdLastIdle = (msg: Message, who: string) => {
    sendHistory(msg.channel, who, 'idle');
}

/**
 *
 * @param {Message} msg
 * @param {string} who - user to check.
 */
const cmdLastActive = (msg: Message, who: string) => {
    sendHistory(msg.channel, who, 'online', 'active');
}

/**
 *
 * @param {Message} msg
 * @param {string} who - user to check.
 */
const cmdLastOff = (msg: Message, who: string) => {
    sendHistory(msg.channel, who, 'offline');
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

const cmdFuck = (m: Message) => {
    if (m.member) {
        m.channel.send(m.content.slice(1) + ' yourself, ' + getSenderName(m));
    }
}


/**
 *
 * @param {Message} msg
 * @param {string} name
 */
const cmdPlayTime = async (msg: Message, name: string) => {

    const chan = msg.channel;
    const gMember = bot.userOrSendErr(chan, name);
    if (!gMember || !('presence' in gMember)) return;

    if (!gMember.presence?.activities || gMember.presence!.activities.length == 0) return chan.send(name + ' is not playing a game.');

    const gameName = gMember.presence!.activities[0].name;

    try {

        const data = await bot.fetchUserData(gMember);
        if (data.hasOwnProperty('games') && data.games.hasOwnProperty(gameName)) {
            const lastTime = data.games[gameName];
            return chan.send(name + ' has been playing ' + gameName + ' for ' + DateFormat.elapsed(lastTime));
        }

    } catch (err) {
        console.error(err);
    }
    return chan.send('I do not know when ' + name + '\'s game started.');

}

/**
 *
 * @param {Message} msg
 * @param {string} name
 */
const cmdIdleTime = async (msg: Message, name: string) => {

    const chan = msg.channel;
    const gMember = bot.userOrSendErr(chan, name);
    if (!gMember) return;

    if (!hasStatus(gMember, 'idle')) return chan.send(name + ' is not idle.');

    try {

        const history = await readHistory(gMember);
        if (history) {

            const lastTime = latestStatus(history, ['offline', 'dnd', 'online']);

            if (lastTime) return chan.send(name + ' has been idle for ' + DateFormat.elapsed(lastTime));

        }

    } catch (err) {

        console.error(err);
    }

    return chan.send('I do not know when ' + name + ' went idle.');

}

/**
 *
 * @param {Message} msg
 * @param {string} name
 */
const cmdOnTime = async (msg: Message, name: string) => {

    const chan = msg.channel;

    const gMember = bot.userOrSendErr(chan, name);
    if (!gMember) return;

    if (hasStatus(gMember, 'offline')) return chan.send(name + ' is not online.');

    try {

        const history = await readHistory(gMember);
        if (history) {

            const lastTime = latestStatus(history, 'offline');

            if (lastTime) return chan.send(name + ' has been online for ' + DateFormat.elapsed(lastTime));

        }

    } catch (err) {

        console.error(err);
    }

    return chan.send('I do not know when ' + name + ' came online.');

}

/**
 * @async
 * @param {Message} msg
 * @param {string} name
 * @returns {Promise}
 */
const cmdOffTime = async (msg: Message, name: string) => {

    const chan = msg.channel;

    const gMember = bot.userOrSendErr(chan, name);
    if (!gMember) return;

    if (!hasStatus(gMember, 'offline')) return chan.send(name + ' is not offline.');

    try {

        const history = await readHistory(gMember);
        if (history) {

            const lastTime = latestStatus(history, 'offline');

            if (lastTime) return chan.send(name + ' has been offline for ' + DateFormat.elapsed(lastTime));

        }

    } catch (err) {

        console.log(err);
    }
    return chan.send('I do not know when ' + name + ' went offline.');

}

/**
 * Send status history of user to channel.
 * @async
 * @param {Channel} channel
 * @param {string} name - name of user to check.
 * @param {(string|string[])} statuses - status name or list of statuses to check.
 * @param {string} statusType - status to display.
 */
const sendHistory = async (channel: TextBasedChannel, name: string, statuses: string | string[], statusType?: string) => {

    const gMember = bot.userOrSendErr(channel, name);
    if (!gMember) return;

    if (!statusType) {
        if (typeof statuses === 'string') {
            statusType = statuses;
        } else {
            statusType = statuses.length > 0 ? statuses[0] : 'unknown';
        }
    }

    if (hasStatus(gMember, statuses)) return channel.send(name + ' is now ' + statusType + '.');

    try {

        const memData = await bot.fetchUserData(gMember);
        const lastTime = latestStatus(memData.history, statuses);

        const dateStr = DateFormat.dateString(lastTime);

        return channel.send('Last saw ' + name + ' ' + statusType + ' ' + dateStr);

    } catch (err) {
        return channel.send('I haven\'t seen ' + name + ' ' + statusType + '.');
    }

}

/**
 * Merge existing user data.
 * @async
 * @param {GuildMember|User} uObject
 * @param {Object} newData - data to merge into existing data.
 * @returns {Promise}
 */
export const mergeMember = async (uObject: GuildMember | User, newData: any) => {

    try {

        const data = await bot.fetchUserData(uObject);
        if (data && typeof data === 'object') {
            jsutils.recurMerge(data, newData);
            newData = data;
        }

        return bot.storeUserData(uObject, newData);

    } catch (e) {
        console.error(e);
    }

}