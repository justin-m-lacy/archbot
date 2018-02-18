
class TestClass {

	constructor() {
	}

	myMethod() {
	}

}

var f = TestClass.prototype.myMethod;
for ( let t in f ) {
	console.log( t );
}