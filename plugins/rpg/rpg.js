var initialized = false;

// includes after init.
var util, Char, Race, CharClass, CharGen, item, Trade, World, Loc;
const Combat = require( './combat.js');

const gamejs = require( './game.js');

const display = require( './display');
const RPG_DIR = 'rpg/';
const LAST_CHARS = RPG_DIR + '`lastchars`';

function initData() {

	initialized = true;

	util = require('../../jsutils.js');
	Char = exports.Char = require( './char/char.js');
	Race = exports.Race = require( './race.js');
	CharClass = exports.CharClass = require( './charclass.js' );	
	CharGen = require( './chargen.js' );
	item = require( './items/item.js' );
	Trade = require ( './trade.js' );
	World = require( './world/world.js');
	Loc = require( './world/loc.js');

}

// created for each discord context.
class RPG {

	/**
	 * 
	 * @param {botcontext.Context} context 
	 */
	constructor( context ) {

		try {

			this._context = context;
			console.log( "Creating RPG instance.");

			if ( !initialized) initData();

			// active chars by user id.
			this.activeChars = {};

			this.world = new World( this._context.cache );

		} catch ( e ) { console.log(e); }

	}

	async cmdAllChars( msg, uname=null ) {

		try {
			let list = await this._context.getDataList(RPG_DIR );
			if ( list == null ) await msg.reply( 'An unknown error has occurred. Oopsie.');
			else {
				await msg.reply( list.join(', ') );
			}
		} catch(e) { console.log(e);}

	}

	async cmdSetHome( m ) {

		let char = await this.activeCharOrErr( m, m.author );
		if (!char) return;

		await m.reply( this.world.setHome( char ) );
		this.cacheChar( char );

	}

	async cmdGoHome( m ) {

		let char = await this.activeCharOrErr( m, m.author );
		if (!char) return;

		await m.reply( this.world.goHome( char ) );
		this.cacheChar( char );

	}

	async cmdLocDesc( m, desc ) {

		let char = await this.activeCharOrErr( m, m.author );
		if (!char) return;

		let resp = await this.world.setDesc( char, desc, m.attachments.first() );
		if ( resp ) await m.reply( resp );

	}

	async cmdLore( m, wot ) {
		display.send( m, gamejs.getDesc(wot) );
	}

	async cmdTake( msg, what ){

		try {

			let char = await this.activeCharOrErr( msg, msg.author )
			if (!char) return;

			let resp = await this.world.take( char, what );
			await msg.channel.send( resp);

		} catch ( e) { console.log(e); }
	}

	async cmdDrop( msg, what ) {

		try {
			let char = await this.activeCharOrErr( msg, msg.author )
			if (!char) return;

			let resp = await this.world.drop( char, what );
			await msg.channel.send( resp);

		} catch ( e) { console.log(e); }

	}

	async cmdExplored( m ) {
		
		let char = await this.activeCharOrErr( m, m.author );
		if (!char) return;

		display.sendBlock( m, await this.world.explored(char) );

	}

	async cmdViewLoc( msg, what ) {

		let char = await this.activeCharOrErr( msg, msg.author );
		if (!char) return;

		let info = await this.world.view( char, what );

		if ( typeof(info) === 'string') display.sendBlock( msg, info );
		else display.sendEmbed( msg, info[0], info[1] );

	}

	async cmdLook( msg, what ) {

		let char = await this.activeCharOrErr( msg, msg.author );
		if (!char) return;

		display.sendBlock( msg, await this.world.look( char, what ) );

	}

	async cmdUseLoc( msg, wot ) {

		let char = await this.activeCharOrErr( msg, msg.author );
		if (!char) return;

		display.sendBlock( msg, await this.world.useLoc(char, wot ));
	}

	async cmdMove( msg, dir ) {

		try {

			let char = await this.activeCharOrErr( msg, msg.author );
			if (!char) return;

			display.sendBlock( msg, await this.world.move(char,dir) );
			this.checkLevel( msg, char );

		} catch ( e) { console.log(e);}

	}

	/**
	 * Roll damage test with current weapon.
	 * @param {*} msg 
	 */
	async cmdRollDmg( msg ) {

		let char = await this.activeCharOrErr( msg, msg.author )
		if (!char) return;

		await msg.reply( 'Weapon roll for ' + char.name + ': ' + char.testDmg() );

	}

		/**
	 * Roll a new armor for testing.
	 * @param {*} msg 
	 */
	async cmdRollWeap( msg ) {

		let char = await this.activeCharOrErr( msg, msg.author )
		if (!char) return;

		try {

			display.sendBlock( msg, Trade.rollWeap( char ) );
			this.saveChar( char, true );

		} catch ( e) { await msg.reply( 'Massive unknown error!!!'); console.log(e);}

	}

	/**
	 * Roll a new armor for testing.
	 * @param {Message} msg 
	 */
	async cmdRollArmor( msg, slot=null ) {

		let char = await this.activeCharOrErr( msg, msg.author )
		if (!char) return;

		try {

			display.sendBlock( msg, Trade.rollArmor( char, slot ) );
			this.saveChar( char, true );

		} catch ( e) { msg.reply( 'Massive unknown error!!!'); console.log(e);}

	}

	async cmdUnequip( msg, slot ) {

		let char = await this.activeCharOrErr( msg, msg.author )
		if (!char) return;

		if ( !slot ) await msg.reply( 'You must specify an equip slot to remove.');
		else {

			if ( char.unequip(slot) ) await msg.reply( 'Removed.');
			else await msg.reply( 'Cannot unequip from ' + slot );

		}

	}

	async cmdEquip( m, what ) {

		let char = await this.activeCharOrErr( m, m.author )
		if (!char) return;

		if ( !what ) {

			display.sendBlock( m, `${char.name} equip:\n${char.listEquip()}` );

		} else {

			let res = char.equip(what);
			if ( res === true ){
				await m.reply( char.name + ' equips ' + what );
			} else if ( typeof(res) === 'string') {
				await m.reply( res );
			} else {
				await m.reply( char.name + ' does not have ' + what );
			}

		}

	}

	async cmdWorn( m, slot ) {

		let char = await this.activeCharOrErr( m, m.author )
		if (!char) return;
		if ( !slot ) display.sendBlock( m, `${char.name} equip:\n${char.listEquip()}` );
		else {

			let item = char.getEquip( slot );
			if ( item == null ) await m.reply( 'Nothing equipped in ' + slot + ' slot.');
			else if ( typeof(item) === 'string' ) await m.reply( item );
			else {
				await m.reply( item.getDetails() );
			}

		} //

	}

	async cmdEat( msg, what ) {

		let char = await this.activeCharOrErr( msg, msg.author )
		if (!char) return;

		await msg.reply( char.eat( what ) );

	}

	async cmdCook( msg, what ) {

		let char = await this.activeCharOrErr( msg, msg.author )
		if (!char) return;

		let resp = char.cook( what );
		await msg.reply( resp );

	}

	async cmdInscribe( msg, whichItem, inscrip ) {

		let char = await this.activeCharOrErr( msg, msg.author )
		if (!char) return;

		if ( !whichItem ) await msg.reply( 'Which item in inventory do you want to inscribe?');
		else {

			let item = char.getItem( whichItem );
			if ( !item ) await msg.reply( 'Item not found.');
			else {

				item.inscription = inscrip;
				await msg.reply( 'Item inscribed.');
				await this.saveChar( char );

			}

		} //

	}

	async cmdDestroy( msg, whichItem ) {

		let char = await this.activeCharOrErr( msg, msg.author )
		if (!char) return;

		if ( !whichItem ) await msg.reply( 'Which inventory item do you want to obliterate?');
		else {

			let item = char.takeItem( whichItem );
			if ( !item ) await msg.reply( 'Item ' + whichItem + ' not in inventory.');
			else {

				await msg.reply( item.name + ' is gone forever.' );

			}

		} //

	}

	async cmdViewItem( msg, which ) {

		let char = await this.activeCharOrErr( msg, msg.author )
		if (!char) return;

		if ( !which ) await msg.reply( 'Which inventory item do you want to view?');
		else {

			let item = char.getItem( which );
			if ( !item ) await msg.reply( 'Item not found.');
			else {

				let view = item.getView();
				if ( view[1] ) await msg.reply( view[0], { embed:{ image:{url:view[1]}} } );
				else await msg.reply( view[0] );
			}

		} //

	}

	async cmdInspect( msg, whichItem ) {

		let char = await this.activeCharOrErr( msg, msg.author )
		if ( !char ) return;

		if ( !whichItem ) await msg.reply( 'Which inventory item do you want to inspect?');
		else {

			let item = char.getItem( whichItem );
			if ( !item ) await msg.reply( 'Item not found.');
			else await msg.reply( item.getDetails() );

		} //

	}

	async cmdCraft( msg, itemName, desc ) {

		let char = await this.activeCharOrErr( msg, msg.author )
		if ( !char ) return;

		if ( !itemName ) await msg.reply( 'Crafted item must have name.');
		else if ( !desc ) await msg.reply( 'Crafted item must have a description.' );
		else {

			let a = msg.attachments.first();
			if ( a ) {
				item.Craft( char, itemName, desc, a.proxyURL );

			} else item.Craft( char, itemName, desc );

			this.checkLevel(msg,char);

			await this.saveChar( char );

		} //

	}

	async cmdInv( msg, who ) {

		var char;

		if ( who ) {

			char = await this.tryLoadChar( who );
			if ( !char ) return;

		} else {

			char = await this.activeCharOrErr( msg, msg.author );
			if ( !char ) {
				await msg.reply( `Character '${who}' not found.`);
				return;
			}

		}

		display.sendBlock( msg, `${char.name} Inventory:\n${char.inv.getMenu()}` );

	}

	async cmdSell( m, wot ) {

		let src = await this.activeCharOrErr( m, m.author );
		if ( !src ) return;

		display.sendBlock( m, Trade.sell( src, wot ));
	}

	async cmdGive( msg, who, expr ) {

		let src = await this.activeCharOrErr( msg, msg.author );
		if ( !src ) return;

		let dest = await this.tryLoadChar( who );
		if ( !dest ) await msg.reply( `'${who}' not found on server.` );
		else {

			let err = Trade.transfer( src, dest, expr );
			if ( typeof(err) === 'string ' ) {
			
				await msg.reply( err );

			} else {

				this.cacheChar( src );
				this.cacheChar( dest  );
				await msg.reply( 'Transfer complete.');

			}

		}

	}

	async cmdAttack( m, who ) {

		let src = await this.activeCharOrErr( m, m.author );
		if ( !src ) return;

		let dest = await this.tryLoadChar( who );
		if ( !dest ) {
			return m.reply( `'${who}' not found on server.` );
		}

		let com = new Combat(src, dest, this.world );
		com.fight();

		this.cacheChar( src );
		this.cacheChar(dest);

		display.sendBlock( m, com.getText() );
	}

	async cmdSteal( m, who, wot=null ) {

		let src = await this.activeCharOrErr( m, m.author );
		if ( !src ) return;

		let dest = await this.tryLoadChar( who );
		if ( !dest ) {
			return m.reply( `'${who}' not found on server.` );
		}

		let com = new Combat( src, dest, this.world );
		com.steal( wot );

		this.cacheChar( src );
		this.cacheChar(dest);

		display.sendBlock( m, com.getText() );
	}

	async cmdRmChar( msg, charname ) {

		if ( !charname ) {
			msg.reply( 'Must specify a character to delete.');
			return;
		}

		try {

			let char = await this.tryLoadChar( charname );
			if ( !char ) {
				await msg.reply( `'${charname}' not found on server.` );
				return;
			} 

			if ( !char.owner || char.owner === msg.author.id ) {

				// delete
				let key = this.getCharKey( charname );
				this._context.deleteKeyData( key );

				let active = this.activeChars[char.owner];
				if ( active && active.name === charname ) await this.clearActiveChar( char.owner );

				msg.reply( charname + ' deleted.' );

			} else msg.reply( 'You do not have permission to delete ' + charname );

		} catch ( e ) { console.log(e); }
	
	}

	async cmdViewChar( m, charname=null ) {
	
		let char;

		if ( !charname ) {
			char = await this.activeCharOrErr( m, m.author );
			if ( !char) return;
		} else {
			char = await this.tryLoadChar( charname );
			if (!char) {
				m.reply( charname + ' not found on server. D:' );
				return;
			}
		}
		display.echoChar( m.channel, char );

	}

	async cmdCharStats( m, charname=null ) {
	
		let char;

		if ( !charname ) {
			char = await this.activeCharOrErr( m, m.author );
			if ( !char) return;
		} else {
			char = await this.tryLoadChar( charname );
			if (!char) {
				m.reply( charname + ' not found on server. D:' );
				return;
			}
		}
		try {
		display.sendBlock( m, char.getHistory() );}catch(e){console.log(e);}

	}

	async cmdSaveChar( m ) {

		let char = await this.activeCharOrErr( m, m.author );
		if (!char) return;

		await this.saveChar( char, true );
		m.reply( char.name + ' saved.');

	}

	async cmdLoadChar( msg, charname=null ) {

		if ( !charname ) charname = msg.author.username;
	
		try {
	
			let char = await this.tryLoadChar( charname );
			let prefix;
			if (!char) {
				await msg.reply( charname + ' not found on server. D:' );
				return;
			} else if ( char.owner !== msg.author.id ) {
				prefix = 'This is not your character.\n';
			} else {
				
				await this.setActiveChar( msg.author, char );
				prefix = 'Active character set.\n';
			}
	
			display.echoChar( msg.channel, char, prefix );

		} catch(e) {console.log(e);}
	
	}
	
	async cmdRollChar( m, charname=null, racename=null, classname=null, sex=null ) {

		try {
			
			let race = Race.GetRace( racename );
			if ( !race ) return await m.reply( 'Race ' + racename + ' not found.' );

			let charclass = CharClass.GetClass( classname );
			if ( !charclass ) return await m.reply( 'Class ' + classname + ' not found.' );

			if ( !sex ) sex = Math.random() < 0.5 ? 'm' : 'f';

			if ( charname ) {

				if ( this._context.illegalName(charname)) {
					m.reply( `'${charname}' contains illegal characters.`);
					return;
				}
				if ( await this.charExists(charname) ) {
					m.reply( `Character '${charname}' already exists.` );
					return;
				}

			} else charname = await this.uniqueName( race, sex );

			let char = CharGen.genChar( m.author.id, race, charclass, charname, null );
			console.log( 'char rolled: ' + char.name );

			await this.setActiveChar( m.author, char );
			display.echoChar( m.channel, char );
			await this.saveChar( char, true );

		} catch ( e ){ console.log(e); }

	}
	
	async charExists( charname ) {
		return await this._context.cache.exists( this.getCharKey( charname ) );
	}

	async activeCharOrErr( m, user ) {

		let char = this.activeChars[user.id];
		if ( char ) return char;

		if ( !this.lastChars ) await this.loadLastChars();

		let charname = this.lastChars[user.id];
		if ( !charname ) {
			await m.reply( 'No active character for: ' + user.username );
			return;
		}

		char = await this.tryLoadChar( charname );
		if ( !char ) {
			await m.reply( `Error loading '${charname}' Load new character.` );
			return;
		}
		if ( char.owner != user.id ) {
			await m.reply( `You are not the owner of character '${charname}'` );
			return;
		}
		return char;

	}

	async clearActiveChar( uid ) {

		delete this.activeChars[uid];
		if ( !this.lastChars ) await this.loadLastChars();
		delete this.lastChars[uid];

	}

	async setActiveChar( user, char ) {

		let lastChar = this.activeChars[user.id];
		if ( lastChar ) await this.saveChar( lastChar, true );		// save previous.

		if ( !this.lastChars ) await this.loadLastChars();

		this.activeChars[user.id] = char;
		this.lastChars[user.id] = char.name;

		this._context.cacheKeyData( LAST_CHARS, this.lastChars );

	}

	async loadLastChars() {

		let lastjson = await this._context.fetchKeyData( LAST_CHARS );
		if ( lastjson ) {
			this.lastChars = lastjson;
			return lastjson;
		}
		this.lastChars = {};
		this._context.cacheKeyData( LAST_CHARS, this.lastChars );

	}

	checkLevel( m, char ) {
		if ( char.levelFlag ){
			m.reply( char.name + ' has leveled up.' );
			char.levelFlag = false;
		}
	}

	addExp( m, char, exp ) {
		if ( char.addExp(exp)) {
			m.reply( char.name + ' has leveled up.');
			char.levelFlag = false;
		}
	}

	cacheChar( char ) {
		this._context.cacheKeyData( this.getCharKey( char.name ), char );
	}

	async saveChar( char, forceSave=false ) {
		await this._context.storeKeyData( this.getCharKey( char.name ), char, forceSave );
	}

	async tryLoadChar( charname ) {

		try {
	
		let key = this.getCharKey( charname );

		let data = this._context.getKeyData(key);
		if ( !data ) {
			data = await this._context.fetchKeyData( key );
			if ( !data ) return null;
		}
		if ( data instanceof Char ) return data;

		console.log('parsing JSON char: ' + charname );

		let char = Char.FromJSON( data );
		//restore char so Char is returned, not json.
		this._context.storeKeyData( key, char );

		return char;

		} catch(e) { console.log(e);}
	}

	getCharKey( charname ) { return RPG_DIR + charname; }

	async uniqueName( race, sex ) {

		let namegen = require( './namegen.js');

		do {
			var name = namegen.genName( race.name, sex );
		} while ( await this.charExists(name) )

		return name;

	}

} // class

exports.init = function( bot ){

	// CHAR MANAGEMENT
	bot.addContextCmd( 'rollchar', '!rollchar [charname] [racename] [classname]', RPG.prototype.cmdRollChar, RPG, { maxArgs:4} );

	bot.addContextCmd( 'loadchar', '!loadchar <charname>', RPG.prototype.cmdLoadChar, RPG, { maxArgs:1}  );
	bot.addContextCmd( 'savechar', '!savechar', RPG.prototype.cmdSaveChar, RPG, {maxArgs:0});

	bot.addContextCmd( 'viewchar', '!viewchar <charname>', RPG.prototype.cmdViewChar, RPG, { maxArgs:1}  );
	bot.addContextCmd( 'rmchar', '!rmchar <charname>', RPG.prototype.cmdRmChar, RPG, {minArgs:1, maxArgs:1} );
	bot.addContextCmd( 'charstats', '!charstats [charname]', RPG.prototype.cmdCharStats, RPG, {minArgs:0, maxArgs:1} );

	bot.addContextCmd( 'allchars', '!allchars\t\tList all character names on server.', RPG.prototype.cmdAllChars,
			RPG, {maxArgs:0} );

	// HELP
	bot.addContextCmd( 'lore', '!lore wot', RPG.prototype.cmdLore, RPG, {minArgs:1, maxArgs:1} );

	// PVP TEST
	bot.addContextCmd( 'attack', '!attack who', RPG.prototype.cmdAttack, RPG, {minArgs:1, maxArgs:1});
	bot.addContextCmd( 'steal', '!steal fromwho', RPG.prototype.cmdSteal, RPG, {minArgs:1, maxArgs:2});

	// EQUIP
	bot.addContextCmd( 'equip', '!equip [what]\t\tEquips item from inventory, or displays all worn items.',
			RPG.prototype.cmdEquip, RPG, {minArgs:0, maxArgs:1} );
	bot.addContextCmd( 'unequip', '!unequip [equip slot]\t\tRemoves a worn item.',
				RPG.prototype.cmdUnequip, RPG, {minArgs:1, maxArgs:1} );
	bot.addContextCmd( 'worn', '!worn [equip slot]\t\tInspect an equipped item.', RPG.prototype.cmdWorn, RPG, {maxArgs:1});

	// ITEMS
	bot.addContextCmd( 'destroy', '!destroy <item_number|item_name>\t\tDestroys an item. This action cannot be undone.',
					RPG.prototype.cmdDestroy, RPG, {maxArgs:1});
	bot.addContextCmd( 'inspect', '!inspect <item_number|item_name>', RPG.prototype.cmdInspect, RPG, {maxArgs:1});
	bot.addContextCmd( 'viewitem', '!viewitem <item_number|item_name> : View an item.', RPG.prototype.cmdViewItem, RPG, {maxArgs:1} );
	bot.addContextCmd( 'inscribe', '!inscribe <item_number|item_name> <inscription>', RPG.prototype.cmdInscribe, RPG, {maxArgs:2, group:"right"});
	bot.addContextCmd( 'inv', '!inv [player]', RPG.prototype.cmdInv, RPG, {maxArgs:1});
	bot.addContextCmd( 'craft', '!craft <item_name> <description>', RPG.prototype.cmdCraft, RPG, {maxArgs:2, group:"right"} );
	bot.addContextCmd( 'give', '!give <charname> <what>', RPG.prototype.cmdGive, RPG, { minArgs:2, maxArgs:2, group:"right"} );
	bot.addContextCmd( 'sell', '!sell <wot>', RPG.prototype.cmdSell, RPG, {minArgs:1, maxArgs:1} );

	// FOOD
	bot.addContextCmd( 'eat', '!eat <what>\t\tEat something from your inventory.', RPG.prototype.cmdEat, RPG, {minArgs:1, maxArgs:1});
	bot.addContextCmd( 'cook', '!cook <what>\t\tCook an item in inventory.', RPG.prototype.cmdCook, RPG, {minArgs:1, maxArgs:1} );

	// TESTING
	bot.addContextCmd( 'rolldmg', '!rolldmg', RPG.prototype.cmdRollDmg, RPG, {hidden:true, maxArgs:0} );
	bot.addContextCmd( 'rollweap', '!rollweap', RPG.prototype.cmdRollWeap, RPG, {hidden:true, maxArgs:0} );
	bot.addContextCmd( 'rollarmor', '!rollarmor [slot]', RPG.prototype.cmdRollArmor, RPG, {hidden:true, maxArgs:1});

	// LOCATION
	bot.addContextCmd( 'look', '!look [item on ground]', RPG.prototype.cmdLook, RPG, { maxArgs:1 } );
	bot.addContextCmd( 'view', '!view <item_number|item_name>', RPG.prototype.cmdViewLoc, RPG );
	bot.addContextCmd( 'drop', '!drop <what>', RPG.prototype.cmdDrop, RPG, {minArgs:1, maxArgs:1});
	bot.addContextCmd( 'take', '!take <what>', RPG.prototype.cmdTake, RPG, {minArgs:1, maxArgs:1});
	bot.addContextCmd( 'locdesc', '!locdesc <description>', RPG.prototype.cmdLocDesc, RPG, {minArgs:1, maxArgs:1} );
	bot.addContextCmd( 'explored', '!explored', RPG.prototype.cmdExplored, RPG, {maxArgs:0} );
	bot.addContextCmd( 'sethome', '!sethome', RPG.prototype.cmdSetHome, RPG, {maxArgs:0});
	bot.addContextCmd( 'gohome', '!gohome', RPG.prototype.cmdGoHome, RPG, {maxArgs:0});
	bot.addContextCmd( 'useloc', '!useloc [feature]', RPG.prototype.cmdUseLoc, RPG, {maxArgs:1});

	// MOVE
	bot.addContextCmd( 'move', '!move <direction>', RPG.prototype.cmdMove, RPG, {maxArgs:1});
	bot.addContextCmd( 'north', '!north', RPG.prototype.cmdMove, RPG, { maxArgs:0, args:['north'] } );
	bot.addContextCmd( 'south', '!south', RPG.prototype.cmdMove, RPG, { maxArgs:0, args:['south'] } );
	bot.addContextCmd( 'east', '!east', RPG.prototype.cmdMove, RPG, { maxArgs:0, args:['east'] } );
	bot.addContextCmd( 'west', '!west', RPG.prototype.cmdMove, RPG, { maxArgs:0, args:['west'] } );

}