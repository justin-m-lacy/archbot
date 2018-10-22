const itemjs = require( './item.js');
const effects = require( '../magic/effects.js');
const forms = require( 'formulic');

module.exports = class Potion extends itemjs.Item  {

	static FromJSON( json ) {

		let p = new Potion();

		if ( json.effect ) p.effect = json.effect;
		if ( json.form ) p.form = json.form;

		itemjs.Item.FromJSON( json, p );

		return p;

	}

	toJSON() {

		let s = super.toJSON();

		if ( this._spell ) s.spell = this._spell;
		if ( this._effect ) s.effect = this._effect;
		if ( this._form ) s.form = this._form;

		return s;

	}

	get form() { return this._form; }
	set form(v) { this._form = v; }

	get effect() { return this._effect; }
	set effect(v) { this._effect = v; }

	get spell() { return this._spell; }
	set spell(v) { this._spell = v; }

	constructor() {
		super( '', '', 'potion');
	}

	quaff( char ) {

		if ( this._form ) {

			//if ( this._form instanceof forms.Formula ) this._form.eval( char );
			let f = forms.Formula.TryParse( this._form );
			f.eval(char);

		} else if ( this._effect ) {

			if ( typeof(this._effect) === 'string') {

				let e = effects.getEffect( this._effect );
				if ( !e) {
					console.log('effect not found: ' + this._effect );
					return;
				}

				console.log('adding potion effect.');
				char.addEffect( e );

			} else if ( this._effect instanceof effects.Effect ) char.addEffect( this._effect );

		}

	}

}