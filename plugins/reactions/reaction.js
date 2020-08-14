export class Reaction {

	toJSON(){

	}

	constructor( response, uid, t, embed ){

		/**
		 * @property {string} response - reaction response.
		 */
		this.response = response;

		/**
		 * @property {string} uid - uid of reaction creator
		 */
		this.uid = uid;

		/**
		 * @property {number} t - timestamp of reaction creation time.
		 */
		this.t = t;

		/**
		 * @property {string} embed - url of reaction embed.
		 */
		this.embed = embed;

	}

	toString(){
	}

}