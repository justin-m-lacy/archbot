exports.init = function( bot ) {

	bot.addCmd( 'rollname', '!rollname [<race>] [m|f]', cmdRollName, {minArgs:0, maxArgs:2});

}

var nameParts = {

	'dwarf':{

		'm':{
			roots:[ 'bom', 'dor', 'dur', 'dwa', 'fi', 'gim', 'glo', 'ki', 'nor', 'od', 'ori', 'tho', 'thra' ],
			parts:[ 'boro', 'bur', 'fith', 'r', 'rin', 'th', 'thur' ],
			ends:[ 'bur', 'in', 'li', 'lin', 'ly', 'mir', 'ne', 'thor', 'urn' ]
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
			roots:[ 'ael', 'galad',  'cel', 'cin', 'leg', 'mirth', 'quel', 'tun'],
			parts:[ 'a', 'aelf', 'ael', 'arf', 'e', 'gil', 'gol', 'ilu', 'lent', 'o', 'vanya' ],
			ends:[ 'in', 'las', 'lin', 'ol', 'orn', 'orn' ]
		},
		'f':{
			roots:[ 'al', 'ar', 'cin', 'el', 'eth', 'gal', 'gwyn', 'il', 'lor', 'ni', 'ny', 'ti', 'tuv', 'val' ],
			parts:[ 'a', 'ad', 'ael', 'anya', 'ay', 'e', 'la', 'lev', 'ie', 'ilu'],
			ends:[ 'beth', 'ial', 'iel', 'ien', 'lyn', 'na', 'ya', 'wen', 'wyn']
		}

	},

	'halfling':{

		'm':{
			roots:[ 'bil', 'col', 'dro', 'fro', 'fu', 'mer', 'per', 'pip', 'sam' ],
			parts:[ 'bo', 'bong', 'cob', 'do', 'fin', 'gaff', 'gri', 'o', 'pa', 'ri', 'ro'],
			ends:[ 'bo', 'do', 'doc', 'er', 'in', 'go', 'pin', 'ry', 's', 'wise']
		},
		'f':{
			roots:[ 'am', 'ala', 'dar', 'das', 'fal', 'may', 'nan', 'peg', 'pol', 'rose',
				'san', 'wen' ],
			parts:[ 'ana', 'ba', 'bea', 'bell', 'bella', 'di', 'els', 'emm', 'fea', 'fli',
			'jen', 'mary', 'pip', 'winn'],
			ends:[ 'a', 'an', 'anne', 'donna', 'ie', 'ly', 'lyn', 'ny', 's', 'sie', 'y', 'wine']
		}

	},

	'human':{

		'm':{
			roots:[ 'ad', 'ben', 'bra', 'deo', 'dor', 'ed', 'garn', 'fra', 'fre', 'han', 'hen', 'hu', 'im',
				'jas', 'jus', 'joh', 'ke', 'lan', 'lar', 'leo', 'luk', 'mat', 'mic', 'nat',
				'nath', 'pet', 'phi', 'ron', 'sam', 'ti', 'vin', 'wil', 'wal', 'war'],
			parts:[ 'ada', 'bern', 'char', 'dor', 'e', 'of', 'or', 'jor', 'li', 'mard', 'mir', 'ath', 'per', 'tal'],
			ends:[ 'ad', 'an', 'ar', 'ard', 'd', 'do', 'el', 'ew', 'iam', 'ian', 'ick', 'id', 'in', 'ip', 'on', 'osh', 'ry' ]
		},
		'f':{
			roots:[ 'ana', 'be', 'cam', 'cas', 'cel', 'cind', 'cla', 'cle', 'da', 'di', 'des', 'em', 'es', 'han',
			'hel', 'jen', 'kel', 'kim', 'li', 'lis',
				'may', 'pam', 'pri', 're', 'san', 'shan', 'ter', 'ti', 'vi', 'wan', 'winn', 'ze'],
			parts:[ 'a', 'an', 'el', 'en', 'es', 'la', 'li', 'nal', 'th', 'tri', 'zel'],
			ends:[ 'a', 'ana', 'anne', 'bell', 'beth', 'ca', 'da', 'dy', 'ea', 'este', 'ette',
			'ia', 'ie', 'ina', 'ine', 'ippy', 'ith', 'ix',
				'le', 'lein', 'len', 'ly', 'lyn', 'ma', 'my', 'ny', 'onna', 'oppy', 're', 's', 'sa', 'sy', 'stra', 'y', 'wyn']
		}

	},

	'goblin':{

		'm':{
			roots:[ 'bli', 'faz', 'gip', 'gar', 'kil', 'nak', 'pik', 'qui', 'zap', 'zaph'],
			parts:[ 'aik', 'az', 'faz', 'flab', 'it', 'iz', 'nak', 'pip', 'plik', 'quib'],
			ends:[ 'bilg', 'bit', 'bolg', 'ilg', 'it', 'ix', 'olg', 'plik', 'zip', 'zit']
		},
		'f':{
			roots:[ 'bel', 'das', 'eki', 'fal', 'nim', 'nin', 'ik', 'ra', 'zan', 'zin'],
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
			roots:[ 'bar', 'dee', 'felga', 'gul', 'har', 'jub', 'lu', 'na', 'pol', 'um', 'vir', 'wom', 'yil', 'zue'],
			parts:[ 'bar', 'bilg', 'dee', 'felga', 'gar', 'glup', 'glik', 'har', 'lek', 'neg', 'ter', 'thig', 'olg', 'zend'],
			ends:[]
		}

	},

	'demon':{

		'm':{
			roots:[ 'az', 'ba', 'bar', 'bal', 'cthu', 'dia', 'dor', 'dur', 'fest', 'gol', 'j\'ku', 'kil', 'kthu',
			'ra', 'raz', 'thra', 'mar', 'meph', 'viz' ],
			parts:[  'af', 'ar', 'az', 'b', 'bar', 'bez', 'el', 'fel', 'fzor', 'gok', 'ist', 'or', 'phel', 'ze', 'zur'],
			ends:[ 'bub', 'es', 'ize', 'lo', 'lu', 'moth', 'o', 'pest', 'to', 'vex', 'zar', 'zel', 'ziel']
		},
		'f':{
			roots:[ 'az', 'bar', 'bal', 'cthu', 'dor', 'fest', 'gol', 'j\'ku', 'kil', 'mar', 'vize' ],
			parts:[ 'arb', 'bar', 'el', 'fzor', 'gok', 'af', 'or', 'ze', 'zur'],
			ends:[ 'bub', 'lu', 'moth', 'pest', 'vex', 'zar', 'zel']
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

	if ( Math.random() < 0.2 ) roots = parts;

	let name = roots[ Math.floor( roots.length*Math.random() ) ];

	let len = parts.length;
	let count = Math.floor( 2*Math.random());
	for( let i = count; i > 0; i-- ) {
		name += parts[ Math.floor(len*Math.random()) ];
	}

	if ( count == 0 || Math.random() < 0.4 ) name += ends[ Math.floor( ends.length*Math.random() ) ];
	return name;

}