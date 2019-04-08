class Info {

	constructor( context ) {

		this.infos = {};

		this._context = context;
		this.loadInfos();

	}

	getKey() { return this._context.getDataKey( 'info', 'info'); }

	async cmdInfo( m, subj, info=null ) {

		if ( subj == null ) return m.channel.send( 'Usage: !info "subj" "definition"' );

		if ( info ) {
			await this.addInfo( subj, info, m.author.id );
			return m.channel.send( 'Ah, "' + subj + '" -> ' + info );
		} else {

			info = this.getInfo( subj );
			if ( info ) return m.reply( info );
			else return m.reply( 'Information not found.');

		}

	}

	async cmdRmInfo( m, subj ) {

		if ( !subj ) return m.channel.send( 'Usage: !rminfo "subject"' );

		let res = await this.rmInfo( subj );
		if ( res ) return m.channel.send('info removed.');

		return m.channel.send('Info not found.');

	}

	/**
	 * 
	 * @param {*} subj 
	 * @param {*} which - Not yet implemented. 
	 */
	async rmInfo( subj, which ) {

		subj = subj.toLowerCase();
		let cur = this.infos[subj];
		if ( cur ) {
			delete this.infos[subj];
			await this._context.storeData( this.getKey(), this.infos );
			return true;
		}

	}

	getInfo( subj ) {
		let cur = this.infos[subj];
		if ( cur ) return cur.i;
		return null;

	}

	async addInfo( subj, info, uid ) {

		try {

			subj = subj.toLowerCase();
			let cur = this.infos[ subj ];	//TODO: implement info lists?

			info = { i:info, uid:uid, t:Date.now() };

			this.infos[subj] = info;

			await this._context.storeData( this.getKey(), this.infos );
	
		} catch ( e ) { console.error(e); }

	}

	async loadInfos() {

		try {

			let infoData = await this._context.fetchData( this.getKey() );
			if ( infoData ) this.infos = infoData;
			else console.warn('Info data not found.');

		} catch ( e ) { console.error(e);}

	}

}


exports.init = function( bot ) {

	bot.addContextCmd( 'info', 'info <subject> [definition]',
		Info.prototype.cmdInfo, Info, { minArgs:1, maxArgs:2, group:'right'} );
	bot.addContextCmd( 'rminfo', 'rminfo <subject> [definition]',
		Info.prototype.cmdRmInfo, Info, { minArgs:1, maxArgs:1, group:'right'} );

}