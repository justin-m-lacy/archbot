var z = 0;
var a;

while ( a = inc() ) {
	console.log('while');
}

function inc() {

	z++;
	if ( z > 10 ) {
		return false;
	}
	return true;

}