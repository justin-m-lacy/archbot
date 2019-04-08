const urlRe = /^https?\:\/\//i;

export default class AudioSource {

	constructor( path, title=null, type=null ){

		this.path = path;
		this.title = title;
		this.type = type || findType(path);

	}

	findType( path ) {

		if ( urlRe.test(path) ) return 'web';
		else return 'file';

	}

	toString() {
		return this.path + ( this.title ? '\t' + this.title : '' );
	}

}