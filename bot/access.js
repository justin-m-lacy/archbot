const Discord = require ( 'discord.js');

/**
 * Determines access to commands for every BotContext.
 * PERMISSION FLAGS: https://discordapp.com/developers/docs/topics/permissions
 */
module.exports = class Access {

	toJSON() {
		return { perms: this._perms };
	}

	/**
	 * {Object( string->permission ) } perms - maps command names to permissions required to use command.
	 */
	get perms() { return this._perms; }
	set perms(v) { this._perms = v; }

	/**
	 * 
	 * @param {Object} [vars=null] 
	 */
	constructor(vars = null) {

		this._perms = this._perms || {};
		if (vars) this.perms = vars.perms || this._perms;

	}

	/**
	 * Remove all permission settings on a command, resetting command access to its default value.
	 * After access is unset, most commands
	 * will be available to all users. The exceptions tend to be special admin commands.
	 * @param {string} cmd 
	 */
	unsetAccess(cmd) {
		delete this._perms[cmd];
	}

	/**
	 * 
	 * @param {string} cmd 
	 * @param {number|string} perm 
	 */
	setAccess(cmd, perm) {

		if ( perm === null || perm === undefined ) this.perms[cmd] = Discord.Permissions.DEFAULT;
		else if (!isNaN(perm)) this.perms[cmd] = Number(perm);
		else if ( typeof(perm) === 'string' ) {

			perm = perm.toLowerCase();
			if ( perm === 'all' || perm === 'public' || perm === 'true' ) {

				this.perms[cmd] = Discord.Permissions.ALL;
	
			} else {

				// roles access.
				let roles = perm.split(',');
				if (roles.length === 0) return;
				if (roles.length === 1) {

					this.perms[cmd] = roles[0];

				} else {

					this.perms[cmd] = roles;
				}

			}

		} else return false;

		return true;

	}

	/**
	 * @param {string} cmd - command to get access string for.
	 * @returns {string|null}
	 */
	accessInfo() {

		if ( !this.perms.hasOwnProperty(cmd) ) return null;

		let perm = this.perms[cmd];

		if ( !isNaN(perm) ) return perm.toString();
		else if ( typeof(perm) === 'string' ) return perm;
		else if ( perm instanceof Array ) return perm.join(', ');

		return null;

	}

	/**
	 * 
	 * @param {string} cmd
	 * @returns {number|string|Array} access flags, or roles, or an array of any combination of them.
	 */
	getAccess(cmd) {

		if (!this.perms.hasOwnProperty(cmd)) return undefined;

		return this.perms[cmd];

	}

	/**
	 * @param {string} cmd - Command being called or setting being used.
	 * @param {GuildMember} gm
	 * @returns {boolean|undefined} Returned undefined if no permission is set for the command.
	 * Returns true if the command or setting can be used by the given member, false otherwise.
	 */
	canAccess(cmd, gm) {

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
	checkPerms(gm, perm) {

		if (isNaN(perm) === false) return gm.permissions.has(perm);

		else if (perm instanceof Array) {

			let a = perm;
			for (let i = a.length - 1; i >= 0; i--) {

				perm = a[i];
				if (isNaN(perm) === false && gm.permissions.has(perm) === true) return true;
				else if (typeof perm === 'string' &&
					gm.roles.some(role => role.name.toLowerCase() === perm.toLowerCase())) return true;

			}

			return false;

		} else if (typeof perm === 'string') {

			// assume perm is a role string.
			return gm.roles.some(role => role.name.toLowerCase() === perm.toLowerCase());

		}

	}

}