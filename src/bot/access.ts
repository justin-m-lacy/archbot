import { GuildMember, PermissionResolvable } from 'discord.js';
const Discord = require('discord.js');

/**
 * Determines access to commands for every BotContext.
 * PERMISSION FLAGS: https://discordapp.com/developers/docs/topics/permissions
 */
export default class Access {

	toJSON() {
		return { perms: this._perms };
	}

	private _perms: { [key: string]: any };

	/**
	 * @property {Object( string->permission ) } perms - maps command names to permissions required to use command.
	 */
	get perms() { return this._perms; }
	set perms(v) { this._perms = v; }

	/**
	 *
	 * @param {Object} [vars=null]
	 */
	constructor(vars?: { perms?: { [key: string]: any } }) {

		this._perms = vars?.perms ?? {}

	}

	/**
	 * Remove all permission settings on a command, resetting command access to its default value.
	 * After access is unset, most commands
	 * will be available to all users. The exceptions tend to be special admin commands.
	 * @param {string} cmd
	 */
	unsetAccess(cmd: string) {
		delete this._perms[cmd];
	}

	/**
	 *
	 * @param {string} cmd
	 * @param {number|string} perm
	 */
	setAccess(cmd: string, perm: PermissionResolvable | 'all' | 'public' | 'true') {

		if (perm === null || perm === undefined) this.perms[cmd] = Discord.Permissions.DEFAULT;
		else if (typeof (perm) === 'string') {

			if (perm === 'all' || perm === 'public' || perm === 'true') {

				this.perms[cmd] = Discord.Permissions.ALL;

			} else {

				// roles access.
				const roles = perm.split(',');
				if (roles.length === 0) return;
				if (roles.length === 1) {

					this.perms[cmd] = roles[0];

				} else {

					this.perms[cmd] = roles;
				}

			}

		} else if (!Number.isNaN(perm)) this.perms[cmd] = Number(perm);
		else return false;

		return true;

	}

	/**
	 * @param {string} cmd - command to get access string for.
	 * @returns {string|null}
	 */
	accessInfo(cmd: string) {

		if (!this.perms.hasOwnProperty(cmd)) return null;

		const perm = this.perms[cmd];

		if (!isNaN(perm)) return perm.toString();
		else if (typeof (perm) === 'string') return perm;
		else if (Array.isArray(perm)) return perm.join(', ');

		return null;

	}

	/**
	 *
	 * @param {string} cmd
	 * @returns {number|string|Array} access flags, or roles, or an array of any combination of them.
	 */
	getAccess(cmd: string) {

		if (!this.perms.hasOwnProperty(cmd)) return undefined;

		return this.perms[cmd];

	}

	/**
	 * @param {string} cmd - Command being called or setting being used.
	 * @param {GuildMember} gm
	 * @returns {boolean|undefined} Returned undefined if no permission is set for the command.
	 * Returns true if the command or setting can be used by the given member, false otherwise.
	 */
	canAccess(cmd: string, gm: GuildMember) {

		if (this.perms.hasOwnProperty(cmd) === false) return undefined;

		try {

			return this.checkPerms(gm, this.perms[cmd]);

		} catch (e) { return false; }

	}

	/**
	 *
	 * @param {GuildMember} gm
	 * @param {number|string} perm
	 */
	checkPerms(gm: GuildMember, perm: PermissionResolvable) {

		if (typeof perm === 'number' && isNaN(perm) === false) {

			return gm.permissions.has(perm);

		} else if (Array.isArray(perm)) {

			const a = perm;
			for (let i = a.length - 1; i >= 0; i--) {

				perm = a[i];
				if (typeof perm === 'number' && isNaN(perm) === false && gm.permissions.has(perm) === true) return true;
				else if (typeof perm === 'string') {

					const lower = perm.toLowerCase();
					return gm.roles.cache.some(role => role.name.toLowerCase() === lower);
				}

			}

			return false;

		} else if (typeof perm === 'string') {

			const lower = perm.toLowerCase();
			// assume perm is a role string.
			return gm.roles.cache.some(role => role.name.toLowerCase() === lower);

		}

	}

}