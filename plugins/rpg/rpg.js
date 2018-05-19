var initialized = false;

// includes after init.
var Char, Race, CharClass, CharGen, Trade, World, ItemGen;
const gamejs = require( './game.js');
const formula = require( './formulas.js');
const display = require( './display');
const RPG_DIR = 'rpg/';
const CHAR_DIR = 'chars/';
const LAST_CHARS = '`lastchars`';

function initData() {

	initialized = true;

	Char = require( './char/char.js');
	Race = require( './race.js');
	CharClass = require( './charclass.js' );	
	CharGen = require( './chargen.js' );
	Trade = require ( './trade.js' );
	World = require( './world/world.js');
	ItemGen = require( './items/itemgen.js');

}

// created for each bot context.
class RPG {

	get cache() { return this._cache; }

	/**
	 * 
	 * @param {botcontext.Context} context 
	 */
	constructor( context ) {

		this._context = context;
		console.log( "Creating RPG instance.");

		if ( !initialized) initData();
		this._cache = this._context.subcache( RPG_DIR );

		this.charCache = this._cache.makeSubCache( CHAR_DIR, Char.FromJSON );

		this.world = new World( this._context.cache );
		this.game = new gamejs.Game( this, this.charCache, this.world );

	}

	async load() {
		await this.loadLastChars();
	}

	async cmdAllChars( msg, uname=null ) {

		try {
			let list = await this._context.getDataList( RPG_DIR + CHAR_DIR );
			if ( !list ) return msg.reply( 'An unknown error has occurred. Oopsie.');

			return msg.reply( list.join(', ') );

		} catch(e) { console.log(e);}

	}

	async cmdParty( m, who ) {

		let char = await this.userCharOrErr( m, m.author );
		if (!char) return;

		let t;
		if ( who ) {
			t = await this.loadChar( who );
			if ( !t ) return;
		}

		return display.sendBlock( m, await this.game.party(char, t ));

	}

	async cmdLeader( m, who ) {

		let char = await this.userCharOrErr( m, m.author );
		if (!char) return;

		let t;
		if ( who ) {
			t = await this.loadChar( who );
			if ( !t ) return;
		}

		return display.sendBlock( m, this.game.setLeader(char, t ));

	}

	async cmdRevive( m, who ) {

		let char = await this.userCharOrErr( m, m.author );
		if (!char) return;

		let t;
		if ( who ) {
			t = await this.loadChar( who );
			if ( !t ) return;
		}

		await display.sendBlock( m, this.game.revive(char, t ));

	}

	async cmdLeaveParty( m ) {

		let char = await this.userCharOrErr( m, m.author );
		if (!char) return;

		await display.sendBlock( m, this.game.leaveParty(char) );
	}

	async cmdMkGuild( m, gname ) {

		try {
		let char = await this.userCharOrErr( m, m.author );
		if (!char) return;

		await display.sendBlock( m, await this.game.mkGuild(char, gname ));
		} catch (e ) {console.log(e);}

	}

	async cmdJoinGuild( m, gname ) {

		let char = await this.userCharOrErr( m, m.author );
		if (!char) return;

		await display.sendBlock( m, await this.game.joinGuild(char, gname ));

	}

	async cmdLeaveGuild( m ) {

		let char = await this.userCharOrErr( m, m.author );
		if (!char) return;

		await display.sendBlock( m, await this.game.leaveGuild(char ));

	}

	async cmdGuildInv( m, who ) {

		let char = await this.userCharOrErr( m, m.author );
		if (!char) return;

		let t;
		if ( who ) {
			t = await this.loadChar( who );
			if ( !t ) return;
		}

		return display.sendBlock( m, await this.game.guildInv(char, t ));

	}

	async cmdWhere( m, who ) {

		let char = await this.userCharOrErr( m, m.author );
		if (!char) return;

		let t = await this.loadChar( who );
		if ( !t ) return;
		return m.reply( t.name + ' is at ' + t.loc.toString() );

	}

	async cmdNerf( m, who ) {

		let char = await this.loadChar( who );
		if ( !char ) return;

		if ( !this._context.isMaster( m.author ) ) return m.reply( 'You do not have permission to do that.');

		return m.reply( Trade.nerfItems( char ) );

	}

	async cmdFormula( m, str ) {

		if ( !this._context.isMaster( m.author ) ) return m.reply( 'You do not have permission to do that.');
		let char = await this.userCharOrErr( m, m.author );
		if (!char) return;

		try {
		let f = formula.Formula.TryParse( str );
		if ( !f ) return m.reply( 'Formula could not parse.');
	
			let res = f.eval( char );
			return m.reply( 'result: ' + res );

		} catch ( e ) { console.log(e); }

	}

	async cmdSetHome( m ) {

		let char = await this.userCharOrErr( m, m.author );
		if (!char) return;

		return m.reply( this.world.setHome( char ) );

	}

	async cmdGoHome( m ) {

		let char = await this.userCharOrErr( m, m.author );
		if (!char) return;

		return m.reply( this.game.goHome( char ) );

	}

	async cmdLocDesc( m, desc ) {

		let char = await this.userCharOrErr( m, m.author );
		if (!char) return;

		let resp = await this.world.setDesc( char, desc, m.attachments.first() );
		if ( resp ) return m.reply( resp );

	}

	async cmdLore( m, wot ) { return display.sendBlock( m, gamejs.getLore(wot) ); }

	async cmdTake( m, first, end ){

		try {

			let char = await this.userCharOrErr( m, m.author )
			if (!char) return;

			await m.channel.send(  await this.game.take( char, first, end ) );

		} catch ( e) { console.log(e); }
	}

	async cmdDrop( m, what, end=null ) {

		let char = await this.userCharOrErr( m, m.author )
		if (!char) return;
		
		return m.channel.send( await this.game.drop( char, what, end ));

	}

	async cmdExplored( m ) {
		
		let char = await this.userCharOrErr( m, m.author );
		if (!char) return;

		return display.sendBlock( m, await this.world.explored(char) );

	}

	async cmdViewLoc( msg, what ) {

		let char = await this.userCharOrErr( msg, msg.author );
		if (!char) return;

		let info = await this.world.view( char, what );

		if ( typeof(info) === 'string') await display.sendBlock( msg, info );
		else display.sendEmbed( msg, info[0], info[1] );

	}

	async cmdExamine( msg, what ) {

		let char = await this.userCharOrErr( msg, msg.author );
		if (!char) return;

		await display.sendBlock( msg, await this.world.examine( char, what ) );

	}

	async cmdLook( m, what ) {

		let char = await this.userCharOrErr( m, m.author );
		if (!char) return;

		return display.sendBlock( m, await this.world.look( char, what ) );

	}

	async cmdUseLoc( msg, wot ) {

		let char = await this.userCharOrErr( msg, msg.author );
		if (!char) return;

		return display.sendBlock( msg, await this.world.useLoc(char, wot ));
	}

	async cmdHike( msg, dir ) {

		try {

			let char = await this.userCharOrErr( msg, msg.author );
			if (!char) return;

			await display.sendBlock( msg, await this.game.hike(char,dir) );
			this.checkLevel( msg, char );

		} catch ( e) { console.log(e);}

	}

	async cmdMove( msg, dir ) {

		let char = await this.userCharOrErr( msg, msg.author );
		if (!char) return;

		await display.sendBlock( msg, await this.game.move(char,dir) );
		this.checkLevel( msg, char );

	}

	/**
	 * Roll damage test with current weapon.
	 * @param {*} msg 
	 */
	async cmdRollDmg( msg ) {

		let char = await this.userCharOrErr( msg, msg.author )
		if (!char) return;

		return msg.reply( 'Weapon roll for ' + char.name + ': ' + char.testDmg() );

	}

	/**
	 * Roll a new armor for testing.
	 * @param {*} msg 
	 */
	async cmdRollWeap( msg ) {

		let char = await this.userCharOrErr( msg, msg.author )
		if (!char) return;

		await display.sendBlock( msg, Trade.rollWeap( char ) );

	}

	/**
	 * Roll a new armor for testing.
	 * @param {Message} msg 
	 */
	async cmdRollArmor( msg, slot=null ) {

		let char = await this.userCharOrErr( msg, msg.author )
		if (!char) return;

		await display.sendBlock( msg, Trade.rollArmor( char, slot ) );

	}

	async cmdUnequip( m, slot ) {

		let char = await this.userCharOrErr( m, m.author )
		if (!char) return;

		return m.reply( this.game.unequip(char, slot ));

	}

	async cmdEquip( m, wot ) {

		let char = await this.userCharOrErr( m, m.author )
		if (!char) return;
	
		if ( !wot ) return display.sendBlock( m, `${char.name} equip:\n${char.listEquip()}` );

		return display.sendBlock( m, this.game.equip( char, wot ) );

	}

	async cmdCompare( m, wot ) {

		let char = await this.userCharOrErr( m, m.author )
		if (!char) return;

		if ( !wot ) return m.reply( 'Compare what item?');

		return display.sendBlock( m, this.game.compare( char, wot ) );

	}

	async cmdWorn( m, slot ) {

		let char = await this.userCharOrErr( m, m.author )
		if (!char) return;
		if ( !slot ) await display.sendBlock( m, `${char.name} equip:\n${char.listEquip()}` );
		else {

			let item = char.getEquip( slot );
			if ( !item ) return m.reply( 'Nothing equipped in ' + slot + ' slot.');
			if ( typeof(item) === 'string' ) return m.reply( item );
			else if ( item instanceof Array ) {

				let r = '';
				for( let i = item.length-1; i>= 0; i-- ) {
					r += item[i].getDetails() + '\n';
				}
				return m.reply(r);

			} else return m.reply( item.getDetails() );

		} //

	}

	async cmdEat( m, wot ) {

		let char = await this.userCharOrErr( m, m.author )
		if (!char) return;

		return m.reply( this.game.eat( char, wot ) );

	}

	async cmdQuaff( m, wot ) {

		let char = await this.userCharOrErr( m, m.author )
		if (!char) return;

		return m.reply( this.game.quaff( char, wot ) );

	}

	async cmdRest( m ) {
		let char = await this.userCharOrErr( m, m.author );
		if ( char) return m.reply( await this.game.rest( char ) );
	}

	async cmdCook( m, what ) {

		let char = await this.userCharOrErr( m, m.author );
		if ( !char ) return;

		return m.reply( this.game.cook( char, what ) );

	}

	cmdPotList( m, level ) {

		if ( !level) return m.reply( 'List potions for which level?');
		return m.reply( ItemGen.potsList(level) );

	}

	async cmdInscribe( m, wot, inscrip ) {

		let char = await this.userCharOrErr( m, m.author )
		if (!char) return;

		if ( !wot ) return m.reply( 'Which item in inventory do you want to inscribe?');

		return m.reply( this.game.inscribe( char, wot, inscrip ) );

	}

	async cmdDestroy( m, first, end=null ) {

		let char = await this.userCharOrErr( m, m.author )
		if (!char) return;

		if ( !first ) return m.reply( 'Which inventory item do you want to destroy?');

		return m.reply( this.game.destroy( char, first, end ));

	}

	async cmdViewItem( msg, which ) {

		let char = await this.userCharOrErr( msg, msg.author )
		if (!char) return;

		if ( !which ) return msg.reply( 'View which inventory item?');

		let item = char.getItem( which );
		if ( !item ) return msg.reply( 'Item not found.');

		let view = item.getView();
		if ( view[1] ) await msg.reply( view[0], { embed:{ image:{url:view[1]}} } );
		else await msg.reply( view[0] );

	}

	async cmdInspect( msg, wot ) {

		let char = await this.userCharOrErr( msg, msg.author )
		if ( !char ) return;

		if ( !wot ) return msg.reply( 'Inspect which inventory item?');

		let item = char.getItem( wot );
		if ( !item ) return msg.reply( 'Item not found.');
		return msg.reply( item.getDetails() );

	}

	async cmdCraft( m, itemName, desc ) {

		if ( !itemName ) return m.reply( 'Crafted item must have name.');
		if ( !desc ) return m.reply( 'Crafted item must have a description.' );

		let char = await this.userCharOrErr( m, m.author )
		if ( !char ) return;
		
		let a = m.attachments.first();
		let res = a ? this.game.craft( char, itemName, desc, a.proxyURL ) : this.game.craft( char, itemName, desc );

		return display.sendBlock( m, res );

	}

	async cmdBrew( m, potName ) {

		if ( !potName ) return m.reply( 'Brew what potion?');

		let char = await this.userCharOrErr( m, m.author )
		if ( !char ) return;
		
		let a = m.attachments.first();
		let res = a ? this.game.brew( char, potName, a.proxyURL ) : this.game.brew( char, potName );

		return display.sendBlock( m, res );

	}

	async cmdInv( msg, who ) {

		var char;

		if ( who ) {

			char = await this.loadChar( who );
			if ( !char ) return;

		} else {

			char = await this.userCharOrErr( msg, msg.author );
			if ( !char ) return msg.reply( `Character '${who}' not found.`);

		}

		await display.sendBlock( msg, `${char.name} Inventory:\n${char.inv.getMenu()}` );

	}

	async cmdSell( m, first, end ) {

		let src = await this.userCharOrErr( m, m.author );
		if ( !src ) return;

		return display.sendBlock( m, this.game.sell( src, first, end ));
	}

	async cmdGive( m, who, expr ) {

		let src = await this.userCharOrErr( m, m.author );
		if ( !src ) return;
	
		let dest = await this.loadChar( who );
		if ( !dest ) return m.reply( `'${who}' not found on server.` );

		return m.reply( this.game.give( src, dest, expr) );

	}

	async cmdScout( m ) {

		let char = await this.userCharOrErr( m, m.author );
		if ( !char ) return;

		await display.sendBlock( m, this.game.scout( char ) );

	}

	async cmdTrack( m, who ) {

		let src = await this.userCharOrErr( m, m.author );
		if ( !src ) return;

		let dest = await this.loadChar( who );
		if ( !dest ) return m.reply( `'${who}' not found on server.` );

		await display.sendBlock( m, this.game.track( src, dest ) );

	}

	async cmdAttack( m, who ) {

		try {
		let src = await this.userCharOrErr( m, m.author );
		if ( !src ) return;

		if ( !who ) who = 1;

		let targ = await this.world.getNpc( src, who );
		let res;

		if ( targ ) res = await this.game.attackNpc( src, targ );
		else {
		
			targ = await this.loadChar( who );
			if ( !targ ) return m.reply( `'${who}' not found.` );

			res = await this.game.attack( src, targ );

		}
	

		await display.sendBlock( m, res );

		} catch (e) { console.log(e);}
		
	}

	async cmdSteal( m, who, wot=null ) {

		let src = await this.userCharOrErr( m, m.author );
		if ( !src ) return;
	
		let dest = await this.loadChar( who );
		if ( !dest ) return m.reply( `'${who}' not found on server.` );

		await display.sendBlock( m, this.game.steal( src, dest, wot ) );

	}

	async cmdRmChar( msg, charname ) {

		if ( !charname ) return msg.reply( 'Must specify a character to delete.');

		try {

			let char = await this.loadChar( charname );
			if ( !char ) return msg.reply( `'${charname}' not found on server.` );

			if ( !char.owner || char.owner === msg.author.id ) {

				this.charCache.delete( this.getCharKey( charname ) );

				// TODO: REMOVE LAST LOADED NAME. etc.
				if ( this.lastChars[char.owner] === charname ) this.clearUserChar( char.owner );

				return msg.reply( charname + ' deleted.' );

			} else return msg.reply( 'You do not have permission to delete ' + charname );

		} catch ( e ) { console.log(e); }
	
	}

	async cmdViewChar( m, charname=null ) {
	
		let char;

		if ( !charname ) {
			char = await this.userCharOrErr( m, m.author );
			if ( !char) return;
		} else {
			char = await this.loadChar( charname );
			if (!char) return m.reply( charname + ' not found on server. D:' );
		}
		return display.echoChar( m.channel, char );

	}

	async cmdAddStat( m, stat ) {

		let char = await this.userCharOrErr( m, m.author );
		if ( !char) return;

		let res = char.addStat(stat);
		if ( typeof(res) === 'string') return m.reply( res );

	}

	async cmdTalents( m, charname=null ) {
	
		let char;

		if ( !charname ) {
			char = await this.userCharOrErr( m, m.author );
			if ( !char) return;
		} else {
			char = await this.loadChar( charname );
			if (!char) return m.reply( charname + ' not found on server. D:' );
		}

		await display.sendBlock( m, char.getTalents() );

	}

	async cmdCharStats( m, charname=null ) {
	
		let char;

		if ( !charname ) {
			char = await this.userCharOrErr( m, m.author );
			if ( !char) return;
		} else {
			char = await this.loadChar( charname );
			if (!char) return m.reply( charname + ' not found on server. D:' );
		}

		await display.sendBlock( m, char.getHistory() );

	}

	async cmdSaveChar( m ) {

		let char = await this.userCharOrErr( m, m.author );
		if (!char) return;

		await this.saveChar( char, true );
		return m.reply( char.name + ' saved.');

	}

	async cmdLoadChar( msg, charname=null ) {

		if ( !charname ) charname = msg.author.username;
	
		try {
	
			let char = await this.loadChar( charname );
			if (!char) return msg.reply( charname + ' not found on server. D:' );

			let prefix;

			if ( char.owner !== msg.author.id ) {
				prefix = 'This is NOT your character.\n';
			} else {
				
				await this.setUserChar( msg.author, char );
				prefix = 'Active character set.\n';
			}
	
			return display.echoChar( msg.channel, char, prefix );

		} catch(e) {console.log(e);}
	
	}
	
	async cmdRollChar( m, charname=null, racename=null, classname=null, sex=null ) {

		try {
			
			let race = Race.RandRace( racename );
			if ( !race ) return await m.reply( 'Race ' + racename + ' not found.' );

			let charclass = CharClass.RandClass( classname );
			if ( !charclass ) return await m.reply( 'Class ' + classname + ' not found.' );

			if ( !sex ) sex = Math.random() < 0.5 ? 'm' : 'f';

			if ( charname ) {

				if ( this._context.illegalName(charname)) return m.reply( `'${charname}' contains illegal characters.`);
				if ( await this.charExists(charname) ) return m.reply( `Character '${charname}' already exists.` );

			} else charname = await this.uniqueName( race, sex );

			let char = CharGen.genChar( m.author.id, race, charclass, charname, null );
			console.log( 'char rolled: ' + char.name );

			await this.setUserChar( m.author, char );
			display.echoChar( m.channel, char );
			await this.saveChar( char, true );

		} catch ( e ){ console.log(e); }

	}
	
	async charExists( charname ) { return this.charCache.exists( this.getCharKey( charname ) ); }

	async userCharOrErr( m, user ) {

		let charname = this.lastChars[user.id];
		if ( !charname ) {
			await m.reply( 'No active character for: ' + user.username );
			return;
		}

		let char = await this.loadChar( charname );
		if ( !char ) {
			await m.reply( `Error loading '${charname}'. Load new character.` );
			return;
		}
		if ( char.owner !== user.id ) {
			await m.reply( `You are not the owner of '${charname}'` );
			return;
		}
		return char;

	}

	async loadChar( charname ) {
	
		let key = this.getCharKey( charname );

		let data = this.charCache.get(key);
		if ( !data ) return this.charCache.fetch( key );
		return data;
	}

	clearUserChar( uid ) { delete this.lastChars[uid]; }

	async setUserChar( user, char ) {

		this.lastChars[user.id] = char.name;
		this._cache.cache( LAST_CHARS, this.lastChars );

	}

	async loadLastChars() {

		let lastjson = await this._cache.fetch( LAST_CHARS );
		if ( lastjson ) {
			this.lastChars = lastjson;
			return lastjson;
		}
		this.lastChars = {};	// uid->char name
		this._cache.cache( LAST_CHARS, this.lastChars );

	}

	checkLevel( m, char ) {
		if ( char.levelFlag ){
			m.reply( char.name + ' has leveled up.' );
			char.levelFlag = false;
		}
	}

	getCharKey( charname ) { return charname; }

	cacheChar( char ) {this.charCache.cache( this.getCharKey( char.name ), char );}

	async saveChar( char, forceSave=false ) {

		if ( forceSave) return this.charCache.store( this.getCharKey( char.name ), char );
		this.charCache.cache( this.getCharKey(char.name), char );

	}

	async uniqueName( race, sex ) {

		let namegen = require( './namegen.js');
		do {
			var name = namegen.genName( race.name, sex );
		} while ( await this.charExists(name) )

		return name;

	}

} // class

exports.init = function( bot ){

	console.log('INIT RPG');
	var proto = RPG.prototype;

	// CHAR MANAGEMENT
	bot.addContextCmd( 'rollchar', '!rollchar [charname] [racename] [classname]', proto.cmdRollChar, RPG, { maxArgs:4} );

	bot.addContextCmd( 'loadchar', '!loadchar <charname>', proto.cmdLoadChar, RPG, { maxArgs:1}  );
	bot.addContextCmd( 'savechar', '!savechar', proto.cmdSaveChar, RPG, {maxArgs:0});

	bot.addContextCmd( 'viewchar', '!viewchar <charname>', proto.cmdViewChar, RPG, { maxArgs:1}  );
	bot.addContextCmd( 'rmchar', '!rmchar <charname>', proto.cmdRmChar, RPG, {minArgs:1, maxArgs:1} );
	bot.addContextCmd( 'charstats', '!charstats [charname]', proto.cmdCharStats, RPG, {minArgs:0, maxArgs:1} );
	bot.addContextCmd( 'talents', '!talents [charname]', proto.cmdTalents, RPG, {minArgs:0, maxArgs:1} );

	bot.addContextCmd( 'addstat', '!addstat [statname]', proto.cmdAddStat, RPG, {minArgs:1, maxArgs:1} );

	bot.addContextCmd( 'allchars', '!allchars\t\tList all character names on server.', proto.cmdAllChars,
			RPG, {maxArgs:0} );

	// HELP
	bot.addContextCmd( 'lore', '!lore wot', proto.cmdLore, RPG, {minArgs:1, maxArgs:1} );
	//bot.addContextCmd( 'rpgchanges', '!rpgchanges', proto.cmdChanges, RPG, {maxArgs:0});

	// PVP
	bot.addContextCmd( 'attack', '!attack [who] - attack something.', proto.cmdAttack, RPG, {minArgs:0, maxArgs:1, alias:'a'} );
	bot.addContextCmd( 'track', '!track who', proto.cmdTrack, RPG, {minArgs:1, maxArgs:1});
	bot.addContextCmd( 'steal', '!steal fromwho', proto.cmdSteal, RPG, {minArgs:1, maxArgs:2});

	// PARTY
	bot.addContextCmd( 'party', '!party [who] - join party, invite to party, or show current party.',
		proto.cmdParty, RPG, {minArgs:0, maxArgs:1});
	bot.addContextCmd( 'revive', '!revive [who] - revive a party member.',
		proto.cmdRevive, RPG, {minArgs:0, maxArgs:1});
	bot.addContextCmd( 'leader', '!leader [who] - view or set party leader.',
		proto.cmdLeader, RPG, {minArgs:0, maxArgs:1});
	bot.addContextCmd( 'leaveparty', '!leaveparty - leave current party', proto.cmdLeaveParty, RPG, {maxArgs:0});

	// GUILD
	bot.addContextCmd( 'mkguild', '!mkguild [name] - create a new guild', proto.cmdMkGuild, RPG, {minArgs:1, maxArgs:1});
	bot.addContextCmd( 'joinguild', '!joinguild [guild] - join a guild', proto.cmdJoinGuild, RPG, {minArgs:1, maxArgs:1} );
	bot.addContextCmd( 'guildinv', '!guildinv [who] - invite to a guild', proto.cmdGuildInv, RPG, {minArgs:1, maxArgs:1} );
	bot.addContextCmd( 'leaveguild', '!leaveguild - leave current guild', proto.cmdLeaveGuild, RPG, {maxArgs:0});

	// EQUIP
	bot.addContextCmd( 'equip', '!equip [what]\t\tEquips item from inventory, or displays all worn items.',
			proto.cmdEquip, RPG, {minArgs:0, maxArgs:1} );
	bot.addContextCmd( 'wear', '!wear [what]\t\tEquips item from inventory, or displays all worn items.',
			proto.cmdEquip, RPG, {minArgs:0, maxArgs:1} );

	bot.addContextCmd( 'unequip', '!unequip [equip slot]\t\tRemoves a worn item.',
				proto.cmdUnequip, RPG, {minArgs:1, maxArgs:1} );
	bot.addContextCmd( 'worn', '!worn [equip slot]\t\tInspect an equipped item.', proto.cmdWorn, RPG, {maxArgs:1});
	bot.addContextCmd( 'compare', '!compare <pack item> - Compare inventory item to worn item.',
		proto.cmdCompare, RPG, { minArgs:1, maxArgs:1});

	// ITEMS
	bot.addContextCmd( 'destroy', '!destroy <item_number|item_name>\t\tDestroys an item. This action cannot be undone.',
					proto.cmdDestroy, RPG, {minArgs:1, maxArgs:2});
	bot.addContextCmd( 'inspect', '!inspect <item_number|item_name>', proto.cmdInspect, RPG, {maxArgs:1});
	bot.addContextCmd( 'viewitem', '!viewitem <item_number|item_name> : View an item.', proto.cmdViewItem, RPG, {maxArgs:1} );
	bot.addContextCmd( 'inv', '!inv [player]', proto.cmdInv, RPG, {maxArgs:1});
	bot.addContextCmd( 'give', '!give <charname> <what>', proto.cmdGive, RPG, { minArgs:2, maxArgs:2, group:"right"} );
	bot.addContextCmd( 'sell', '!sell <wot> OR !sell <start> <end>', proto.cmdSell, RPG, {minArgs:1, maxArgs:2} );

	// CRAFT
	bot.addContextCmd( 'craft', '!craft <item_name> <description>', proto.cmdCraft, RPG, {maxArgs:2, group:"right"} );
	bot.addContextCmd( 'brew', '!brew <potion> - brew a potion.', proto.cmdBrew, RPG, {maxArgs:1, group:"right"} );
	bot.addContextCmd( 'inscribe', '!inscribe <item_number|item_name> <inscription>', proto.cmdInscribe, RPG, {maxArgs:2, group:"right"});
	bot.addContextCmd( 'potlist', '!potlist <level> - list of potions by level.', proto.cmdPotList, RPG, {minArgs:1, maxArgs:1} );

	// DOWNTIME
	bot.addContextCmd( 'eat', '!eat <what>\t\tEat something from your inventory.', proto.cmdEat, RPG, {minArgs:1, maxArgs:1});
	bot.addContextCmd( 'cook', '!cook <what>\t\tCook an item in inventory.', proto.cmdCook, RPG, {minArgs:1, maxArgs:1} );
	bot.addContextCmd( 'rest', '!rest', proto.cmdRest, RPG, {maxArgs:0} );
	bot.addContextCmd( 'quaff', '!quaff <what>\t\tQuaff a potion.', proto.cmdQuaff, RPG, {minArgs:1, maxArgs:1});

	bot.addContextCmd( 'rolldmg', '!rolldmg', proto.cmdRollDmg, RPG, {hidden:true, maxArgs:0} );
	bot.addContextCmd( 'rollweap', '!rollweap', proto.cmdRollWeap, RPG, {hidden:true, maxArgs:0} );
	bot.addContextCmd( 'rollarmor', '!rollarmor [slot]', proto.cmdRollArmor, RPG, {hidden:true, maxArgs:1});

	
	// TESTING	
	bot.addContextCmd( 'nerf', '', proto.cmdNerf, RPG, {hidden:true, minArgs:1, maxArgs:1});
	bot.addContextCmd( 'form', '!form <formula>', proto.cmdFormula, RPG, {hidden:true, minArgs:1, maxArgs:1});

	// NPC
	bot.addContextCmd( 'ex', '!ex [monster|npc]', proto.cmdExamine, RPG, { maxArgs:1 } );

	// LOCATION
	bot.addContextCmd( 'look', '!look [item on ground]', proto.cmdLook, RPG, { maxArgs:1 } );
	bot.addContextCmd( 'view', '!view <item_number|item_name>', proto.cmdViewLoc, RPG );
	bot.addContextCmd( 'drop', '!drop <what> OR !drop <start> <end>', proto.cmdDrop, RPG, {minArgs:1, maxArgs:2});
	bot.addContextCmd( 'take', '!take <what> OR !take <start> <end>', proto.cmdTake, RPG, {minArgs:1, maxArgs:2});
	bot.addContextCmd( 'locdesc', '!locdesc <description>', proto.cmdLocDesc, RPG, {minArgs:1, maxArgs:1} );
	bot.addContextCmd( 'explored', '!explored', proto.cmdExplored, RPG, {maxArgs:0} );
	bot.addContextCmd( 'sethome', '!sethome', proto.cmdSetHome, RPG, {maxArgs:0});
	bot.addContextCmd( 'gohome', '!gohome', proto.cmdGoHome, RPG, {maxArgs:0});
	//bot.addContextCmd( 'where', '!where [char]', proto.cmdWhere, RPG, {minArgs:1,maxArgs:1});
	bot.addContextCmd( 'scout', '!scout', proto.cmdScout, RPG, {maxArgs:0});
	bot.addContextCmd( 'useloc', '!useloc [feature]', proto.cmdUseLoc, RPG, {maxArgs:1});

	// MOVE
	bot.addContextCmd( 'move', '!move <direction>', proto.cmdMove, RPG, {maxArgs:1});
	bot.addContextCmd( 'north', '!north', proto.cmdMove, RPG, { maxArgs:0, args:['north'], alias:'n' } );
	bot.addContextCmd( 'south', '!south', proto.cmdMove, RPG, { maxArgs:0, args:['south'], alias:'s' } );
	bot.addContextCmd( 'east', '!east', proto.cmdMove, RPG, { maxArgs:0, args:['east'], alias:'e' } );
	bot.addContextCmd( 'west', '!west', proto.cmdMove, RPG, { maxArgs:0, args:['west'], alias:'w' } );
	bot.addContextCmd( 'hike', '!hike <direction>', proto.cmdHike, RPG, { minArgs:1, maxArgs:1} );

}

/*
	async cmdChanges(m) {
		let changes = require('./data/changelog.json');
		let list = '';

		for( let k in changes ) {
			list += k + '\n' + changes[k].join('\n') + '\n\n';
		}

		await display.sendBlock( m, list )
	}*/