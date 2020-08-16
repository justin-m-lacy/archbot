class Quoter {

	constructor( context ) {

		this.quotes = null;
		this._context = context;

	}

	/**
	 *
	 * @param {Message} m
	 * @returns {Promise}
	 */
	async cmdQuote( m ) {

		if ( !this.quotes ) await this.loadQuotes();

		let len = this.quotes.length;
		if ( len > 0 ) {

			let str = this.quotes[ Math.floor( Math.random()*len ) ];
			return m.channel.send( str );

		}
		return m.channel.send( 'There are no quotes for this server.');

	}

	/**
	 *
	 * @param {*} m
	 * @param  {...any} args
	 * @returns {Promise}
	 */
	async cmdNewQuote( m, ...args ) {

		if ( !this.quotes ) await this.loadQuotes();

		let q = args.join(' ');
		// todo: allow attachments.
		if ( q === null || q === '') return m.channel.reply( "Your silence is not memorable.");

		this.quotes.push( q );

		this._context.storeData( 'quoter/quotes', this.quotes );

	}

	async loadQuotes() {

		try {
			let q = await this._context.fetchData( 'quoter/quotes' );

			if ( q ) {

				if ( this.quotes == null ) this.quotes = q;
				else this.quotes = this.quotes.concat(q);

			} else this.quotes = [];

		} catch (e) { console.log(e); this.quotes = []; }

	}

}

exports.init = function( bot ) {

	bot.addContextCmd( 'quote', 'quote', Quoter.prototype.cmdQuote, Quoter );
	bot.addContextCmd( 'mkquote', 'mkquote ["stupid quote"]', Quoter.prototype.cmdNewQuote, Quoter );

}