exports.init = function( bot ) {

	bot.addCmd( 'rollname', '!rollname [<race>] [m|f]', cmdRollName, {minArgs:0, maxArgs:2});

}

var nameParts = {

	'dwarf':{

		'm':{
			roots:[ 'bom', 'dor', 'dur', 'dwa', 'fi', 'gim', 'glo', 'ki', 'nor', 'od', 'ori', 'tho' ],
			parts:[ 'boro', 'bur', 'fith', 'r', 'rin', 'th', 'thur' ],
			ends:[ 'bur', 'in', 'li', 'lin', 'ly', 'mir', 'thor', 'urn' ]
		},
		'f':{
			roots:[ 'bre', 'brum', 'dop', 'elg', 'folg', 'frey', 'gil', 'gin', 'gold', 'helg', 'lus', 'nan',
			'olg', 'pam', 'val', 'vol', 'win' ],
			parts:[ 'ar', 'ef', 'el', 'hil', 'il', 'ory', 'ta', 'u', 'urs' ],
			ends:[ 'a', 'da', 'die', 'es', 'eth', 'lein', 'lin', 'y', 'yn' ]
		}

	},

	'elf':{

		'm':{
			roots:[ 'ael', 'galad',  'cele', 'cin', 'leg', 'mirth', 'quel', 'tun'],
			parts:[ 'aelf', 'ael', 'arf', 'gil', 'gol', 'ilu', 'lent', 'o', 'vanya' ],
			ends:[ 'in', 'las', 'lin', 'ol', 'orn', 'orn' ]
		},
		'f':{
			roots:[ 'al', 'ar', 'cin', 'el', 'eth', 'gal', 'gwyn', 'il', 'lor', 'nia', 'ti', 'tuv', 'va' ],
			parts:[ 'ael', 'anya', 'ay', 'la', 'lev', 'ie', 'ilu', 'wyn'],
			ends:[ 'ial', 'iel', 'ien', 'lyn', 'wen']
		}

	},

	'halfling':{

		'm':{
			roots:[ 'bil', 'col', 'dro', 'fro', 'fu', 'mer', 'per', 'pip', 'sam' ],
			parts:[ 'bo', 'bong', 'cob', 'do', 'fin', 'gaff', 'gri', 'o', 'pa', 'ri', 'ro'],
			ends:[ 'bo', 'do', 'doc', 'er', 'in', 'go', 'pin', 'ry', 's', 'wise']
		},
		'f':{
			roots:[ 'am', 'ala', 'das', 'peg', 'pol', 'rose', 'san' ],
			parts:[ 'ana', 'ba', 'bea', 'bell', 'bella', 'di', 'els', 'emm', 'fea', 'fli',
			'jen', 'mary', 'pip', 'winn'],
			ends:[ 'a', 'an', 'anne', 'donna', 'ie', 'ly', 'lyn', 's', 'sie', 'y', 'wine']
		}

	},

	'human':{

		'm':{
			roots:[ 'ad', 'ben', 'bra', 'deo', 'dor', 'ed', 'garn', 'fra', 'fre', 'han', 'hen', 'hu', 'im',
				'jas', 'jus', 'joh', 'ke', 'lan', 'lar', 'leo', 'luk', 'mat', 'mic', 'nat',
				'nath', 'pet', 'ron', 'sam', 'ti', 'vin', 'wil', 'wal', 'war'],
			parts:[ 'ada', 'bern', 'char', 'dor', 'e', 'of', 'or', 'jor', 'li', 'mard', 'mir', 'ath', 'per', 'tal'],
			ends:[ 'ad', 'an', 'ar', 'ard', 'd', 'do', 'el', 'ew', 'iam', 'ian', 'id', 'in', 'on', 'osh', 'ry' ]
		},
		'f':{
			roots:[ 'ana', 'be', 'cam', 'cas', 'cel', 'cind', 'cla', 'cle', 'da', 'di', 'des', 'em', 'es', 'han',
			'hel', 'jen', 'kel', 'kim', 'li', 'lis',
				'may', 'pam', 'pri', 're', 'san', 'shan', 'ti', 'vi', 'wan', 'winn', 'ze'],
			parts:[ 'a', 'an', 'el', 'en', 'es', 'la', 'li', 'nal', 'th', 'tra', 'zel'],
			ends:[ 'a', 'ana', 'anne', 'bell', 'beth', 'ca', 'da', 'dy', 'ea', 'este',
			'ia', 'ie', 'ina', 'ine', 'ippy', 'ix',
				'le', 'lein', 'len', 'ly', 'lyn', 'ma', 'my', 'ny', 'onna', 'oppy', 're', 's', 'sa', 'sy', 'y', 'wyn']
		}

	},

	'goblin':{

		'm':{
			roots:[ 'bli', 'faz', 'gip', 'gar', 'kil', 'nak', 'pik', 'qui', 'zap', 'zaph'],
			parts:[ 'aik', 'az', 'faz', 'fla', 'it', 'iz', 'nak', 'pip', 'plik', 'quib'],
			ends:[ 'bilg', 'bit', 'bolg', 'ilg', 'it', 'ix', 'olg', 'plik', 'zip', 'zit']
		},
		'f':{
			roots:[ 'bel', 'das', 'fal', 'nim', 'nin', 'ik', 'ra', 'zan', 'zin'],
			parts:[ 'ain', 'bli', 'faz', 'flis', 'it', 'nik', 'nin', 'piks', 'sip', 'zel'],
			ends:[ 'en', 'in', 'is', 'izzy', 'ning', 'vex', 'vix', 'y', 'zeel', 'zel', 'zing']
		}

	},
	'orc':{

		'm':{
			roots:[],
			parts:[ 'bar', 'bolg', 'dok', 'folg', 'glarb', 'glub', 'har', 'krag', 'korb', 'kro', 'luk', 'nag', 'tar', 'thog', 'og'],
			ends:[]
		},
		'f':{
			roots:[],
			parts:[ 'bar', 'bilg', 'dee', 'felga', 'glup', 'glik', 'har', 'lek', 'neg', 'ter', 'thig', 'olg', 'zend'],
			ends:[]
		}

	},

	'troll':{

		'm':{
			roots:[],
			parts:[ 'arb', 'bar', 'fzor', 'glrk', 'gok', 'mmrok', 'yarg', 'zaft', 'zor', 'zurb'],
			ends:[]
		},
		'f':{
			roots:[],
			parts:[ 'abf', 'bir', 'doo', 'flrk', 'glk', 'yilg', 'zorb', 'zink'],
			ends:[]
		}

	},

};

nameParts['hobbit'] = nameParts['halfling'];

function cmdRollName( m, race, gender ) {

	if ( gender == null ) gender = Math.random() < 0.5 ? 'm' : 'f';
	if ( race == null ) race = 'human';

	m.channel.send( getName( race, gender ));

}

/**
 * 
 * @param {string} race 
 */
function getName( race, gender='m' ) {

	if ( !nameParts.hasOwnProperty(race)) {
		race = 'human';
	}
	let lists = nameParts[ race ][gender];


	return buildName( lists.roots, lists.parts, lists.ends );

}

function buildName( roots, parts, ends ) {

	if ( roots == null || roots.length == 0 ) roots = parts;
	if ( ends == null || ends.length == 0 ) ends = parts;

	if ( Math.random() < 0.4 ) roots = parts;

	let name = roots[ Math.floor( roots.length*Math.random() ) ];

	let len = parts.length;
	let count = Math.floor( 2*Math.random());
	for( let i = count; i > 0; i-- ) {
		name += parts[ Math.floor(len*Math.random()) ];
	}

	if ( count == 0 || Math.random() < 0.4 ) name += ends[ Math.floor( ends.length*Math.random() ) ];
	return name;

}