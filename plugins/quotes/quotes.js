
class Quoter {

	constructor( context ) {

		this.quotes = null;
		this._context = context;

		this.loadQuotes();

	}

	async cmdQuote( m ) {

		if ( this.quotes == null ) {
			await this.loadQuotes();
		}

		let len = this.quotes.length;
		if ( len == 0 ) {
			m.channel.send( 'There are no quotes for this server.');
			return;
		}

		let str = this.quotes[ Math.floor( Math.random()*len ) ];
		m.channel.send( str );

	}

	cmdNewQuote( m, ...args ) {

		let q = args.join(' ');
		if ( q == null || q === '') {
			m.channel.send( "That isn't a quote, stupid.");
			return;
		}
		this.quotes.push( q );

		this._context.storeKeyData( 'quoter/quotes', this.quotes );

	}

	async loadQuotes() {

		try {
			let q = await this._context.fetchKeyData( 'quoter/quotes' );
			console.log( 'quotes loaded: ' + q );
			if ( q != null ) {
				this.quotes = this.quotes.concat(q);
			} else {
				this.quotes = [];
			}
		} catch (e) { console.log(e); }

	}

}

exports.init = function( bot ) {

	bot.addContextCmd( 'quote', '!quote', Quoter.prototype.cmdQuote, Quoter );
	bot.addContextCmd( 'mkquote', '!mkquote ["stupid quote"]', Quoter.prototype.cmdNewQuote, Quoter );

}