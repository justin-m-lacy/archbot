const urlRe = /^https?\:\/\//i;

module.exports = class AudioSource {

	constructor( path, title=null, type=null ){

		this.path = path;
		this.title = title;
		this.type = type || this.findType(path);

	}

	findType( path ) {

		if ( urlRe.test(path) ) return 'web';
		else return 'file';

	}

	toString() {
		return this.path + ( this.title ? '\t' + this.title : '' );
	}

}