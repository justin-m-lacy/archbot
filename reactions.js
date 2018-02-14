exports.Reactions = class Reactions {

	// reactionData = {search_str:{r:response}}
	// repeatWait - secs wait before repeating a message.
	// globalWait - secs between ANY message.
	constructor( reactionData, repeatWait=5*60, globalWait=5 ) {

		this.reactions = reactionData;
		this.minWait = repeatWait;
		this.gWait = globalWait;
		this.gTime = 0;

	}

	react( message ) {

		let now = Date.now()/1000;
		if ( now - this.gTime < this.gWait ) return null;
		this.gTime = now;

		let lower = message.toLowerCase();
		let resp;

		for( var k in this.reactions ) {

			if ( lower.indexOf(k) >= 0 ) {

				resp = this.tryReact( this.reactions[k] );
				if ( resp != null ) return resp;

			}
		}
		return null;

	}

	tryReact( obj ) {

		if ( obj.hasOwnProperty('last')){

			if ( this.gTime - obj.last < this.minWait ) return null;
		}
		obj.last = this.gTime;
		return obj.r;

	}

}