module.exports = {

	CONTENT_MAX:1600,

	capsRegEx:/(?:\b(\w*)\b)*/g,

	blockText:(s)=> '```' + s + '```',

	sendEmbed:async (m,s,e)=> m.reply( '```' + s + '```', {embed:{image:{url:e}}}),

	sendBlock:async (m,s)=> m.reply( '```' + s + '```'),

	/**
 	* Checks if the character is a vowel.
	* @param {string} c - character to test.
	* @returns {boolean}
 	*/
	isVowel:( c ) => {

		c = c.toLowerCase();
		return c === 'a' || c === 'e' || c === 'i' || c === 'o' || c === 'u';

	},

	/**
	 *
	 * @param {string} str
	 * @returns {string}
	 */
	capitalize( str ){

		return str.replace( this.capsRegEx, ( sub )=>{
			return sub[0].toUpperCase() + sub.slice(1);
		});

	},

		/**
	 * Gets the total number of pages that would be required to display
	 * the text, given the maximum message size.
	 * @param {string} text
	 * @returns {number} one-based page count.
	 */
	pageCount( text ) {
		return Math.floor( text.length / this.CONTENT_MAX ) + 1;
	},

	/**
	 * Makes a standard page count string for the given text.
	 * @param {string} text
	 * @returns {string} Information about the number of pages required.
	 */
	pageFooter( text ) {
		let count = this.pageCount(text);
		return '( ' + count + ' page result' + ( count != 1 ? 's )' : ' )' );
	},

	/**
	 * Break the text into pages based on the maximum content length,
	 * and return the indicated page of text.
	 * @param {string} text
	 * @param {number} page - zero-based page index.
	 * @returns {string} - a single page of text out of the total.
	 */
	getPageText( text, page ) {
		return text.slice( this.CONTENT_MAX*page, this.CONTENT_MAX*(page+1) );
	},

	/**
	 * Break a message text into pages, and send it to the required message channel.
	 * @param {Discord.Message} m
	 * @param {string} text - text to paginate and send.
	 * @param {number} page - zero-based page of text to be sent.
	 */
	async sendPage( m, text, page ) {
		return m.channel.send( this.getPageText(text,page) + '\n\n' + this.pageFooter(text) );
	},

	/**
	 * Break a message text into pages, and reply the page to the given message.
	 * @param {Message} m
	 * @param {string} text - text to paginate and reply.
	 * @param {number} page - zero-based page of text to reply.
	 */
	async replyPage( m, text, page ) {
		return m.reply( this.getPageText(text, page) + '\n\n' + this.pageFooter(text) );
	},

	/**
	 * Paginates an array of text to only break between items.
	 * @param {string[]} items
	 * @param {number} [page=0] the zero-based index of the page of text to display.
	 * @returns { {page:string, pages:number} } text of page and total page count.
	 */
	paginate( items, page=0 ) {

		let it, len = items.length;
		let chars = 0;

		// item indices for breaking the current page.
		let totalPages=0, pageStart = 0;
		let pageStr = '';

		for( let i = 0; i < len; i++ ) {

			it = items[i];
			chars += it.length;

			// adding this item's text crossed a page boundary.
			if ( chars >= this.CONTENT_MAX ) {

				if ( totalPages === page ) pageStr = items.slice( pageStart, i ).join( '\n');

				totalPages++;
				pageStart = i;
				chars = it.length;

			}

		} // for

		return { page:pageStr, pages:totalPages+1 };
	}

}