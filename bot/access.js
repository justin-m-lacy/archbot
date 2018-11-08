/**
 * Determines access to commands for every BotContext.
 */
module.exports = class Access {

	/**
	 * {Object( string->permission ) } perms - maps command names to permissions required to use command.
	 */
	get perms() { return this._perms; }
	set perms( v ) { this._perms = v; }

	constructor( vars=null ) {

		if ( vars ) Object.assign( this, vars );
		this._perms = this._perms || {};

	}

	unsetAccess( cmd ) {
		delete this._perms[cmd];
	}

	setAccess( cmd, perm ) {

		if ( !isNaN(perm )) this.perms[cmd] = Number( perm );
		else {

			// roles access.
			let roles = perm.split( ',' );
			if ( roles.length === 0 ) return;
			if ( roles.length === 1 ) {
	
				this.perms[cmd] = roles[0];
	
			} else {
	
				this.perms[cmd] = roles;
			}

		}

	}

	getAccess( cmd ) {

		if ( !this.perms.hasOwnProperty(cmd) ) return undefined;

		return this.perms[cmd];
		
	}

	/**
	 * @param {string} cmd - Command being called or setting being used.
	 * @param {GuildMember} gm
	 * @returns {Boolean|undefined} Returned undefined if no permission is set for the command.
	 * Returns true if the command or setting can be used by the given member, false otherwise.
	 */
	canAccess( cmd, gm ) {

		if ( !this.perms.hasOwnProperty(cmd) ) return undefined;

		return this.checkPerms( gm, this.perms[cmd]);;

	}

	checkPerms( gm, perm ){

		if ( !isNaN(perm)) return gm.permissions.has( perm );

		else if ( perm instanceof Array ) {

			let a = perm;
			for( let i = a.length-1; i >= 0; i-- ) {

				perm = a[i];
				if ( !isNaN(perm) && gm.permissions.has(perm) ) return true;
				else if ( gm.roles.some( role=>role.name === perm )) return true;

			}

			return false;

		} else {

			// assume perm is a role string.
			return gm.roles.some( role=>role.name === perm );

		}


	}

}