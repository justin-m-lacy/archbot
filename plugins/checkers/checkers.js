const Discord = require( 'discord.js');
const GameCache = require( '../../gamecache.js');

const game_dir = 'checkers/';

class Checkers {

	constructor( context ) {

		this.context = context;

	}

	cmdNewGame( m, opp, firstMove=null ) {
	}

	cmdPlayMove( m ) {
	}

}

exports.init = function ( bot ) {

	console.log('checkers init');

}