const http = require( 'http');
const promisify = require('jsutils').promisify;

const get = promisify( require('http').get );

/**
 * Allow display of other timezones using world time zone API.
 * @url http://worldtimeapi.org/
 */

const TimeApiUrl = "http://worldtimeapi.org/api/timezone/";

exports.init = function( bot ) {

	bot.dispatch.add( 'time', 'time [place]', cmdGetTime, {maxArgs:1} );

}

async function cmdGetTime( msg, query ) {

	var res = await get( TimeApiUrl + query );

	if ( res.statusCode !== 200 ) {

		res.resume();
		return msg.reply( 'Time not found');

	} else {

		let data = '';
		res.on('data', chunk=>{
			data+=chunk;
		});

		await promisify( res.on )( 'end' );
		return msg.reply(data);

	}

}



/**
 * Build JSON request info for windows.fetch()
*/
export const RequestInfo = (creds) => {

	let headers = new Headers();
	//headers.append( 'Content-Type', 'text/plain');
	//headers.append( 'Content-Type', 'application/octet-stream');
	//headers.append( 'Origin', 'http://localhost');

	return {
		method:'GET',
		headers:headers,
		mode:'cors',

		/**
		 * send user credentials? 'omit', 'same-origin' or 'include'
		 */
		credentials: creds ? 'include' : 'same-origin'
	};

}

/**
 *
 * @param {string} url
 * @param {boolean} creds
 */
export const fetchJSON = (url, creds)=>{

	return window.fetch( url, RequestInfo(creds) ).then( r=>{

		if ( r.status !== 200 ) {
			console.warn('Status: ' + r.status );
			return null;
		} else return r.json();

	}, err=>null );

}