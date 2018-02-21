var jimp = require('jimp');

var board;
var pieces;
var tileSize;

const teamRow = { 'W':1, 'B':0 };
const pieceCol = { 'q':0, 'k':1, 'r':2, 'n':3, 'b':4, 'p': 5};

async function loadImages( cont ) {

	console.time( 'load');

	board = await jimp.read( './images/board.png' );
	pieces = await jimp.read( './images/pieces.png');

	console.timeEnd( 'load');

	tileSize = Math.floor( board.bitmap.width / 8 );

	cont();

}

function compose( locs ){

	let b = board.clone();

	let obj;
	let srcR, srcC;
	for( let i = locs.length-1; i >= 0; i-- ){

		obj = locs[i];
		srcR = obj.side == 'W' ? 1 : 0;
		srcC = pieceCol[ obj.piece ];

		b.composite( pieces, obj.col*tileSize, obj.row*tileSize, srcC*tileSize, srcR*tileSize, tileSize, tileSize );

	}

	return b;

}


loadImages( makeBoard );


async function makeBoard() {

let locs = [
	{ piece:'p', side:'W', row:6, col:0},
	{ piece:'p', side:'W', row:6, col:1},
	{ piece:'p', side:'W', row:6, col:2},
	{ piece:'p', side:'W', row:6, col:3},
	{ piece:'p', side:'W', row:6, col:4},
	{ piece:'p', side:'W', row:6, col:5},
	{ piece:'p', side:'W', row:6, col:6},
	{ piece:'p', side:'W', row:6, col:7},
	{ piece:'r', side:'W', row:7, col:0},
	{ piece:'n', side:'W', row:7, col:1},
	{ piece:'b', side:'W', row:7, col:2},
	{ piece:'q', side:'W', row:7, col:3},
	{ piece:'k', side:'W', row:7, col:4},
	{ piece:'b', side:'W', row:7, col:5},
	{ piece:'n', side:'W', row:7, col:6},
	{ piece:'r', side:'W', row:7, col:7},
	
	{ piece:'p', side:'B', row:1, col:0},
	{ piece:'p', side:'B', row:1, col:1},
	{ piece:'p', side:'B', row:1, col:2},
	{ piece:'p', side:'B', row:1, col:3},
	{ piece:'p', side:'B', row:1, col:4},
	{ piece:'p', side:'B', row:1, col:5},
	{ piece:'p', side:'B', row:1, col:6},
	{ piece:'p', side:'B', row:1, col:7},
	{ piece:'r', side:'B', row:0, col:0},
	{ piece:'n', side:'B', row:0, col:1},
	{ piece:'b', side:'B', row:0, col:2},
	{ piece:'q', side:'B', row:0, col:3},
	{ piece:'k', side:'B', row:0, col:4},
	{ piece:'b', side:'B', row:0, col:5},
	{ piece:'n', side:'B', row:0, col:6},
	{ piece:'r', side:'B', row:0, col:7},
	];


	console.time('compose');

	var image = compose( locs );

	console.timeEnd( 'compose');

	console.time( 'save');

	image.write( './images/outfile.png', (e)=>{
		console.timeEnd('save');
	});

}


