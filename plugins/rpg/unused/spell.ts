import { Formula } from 'formulic';
import { ProtoEffect } from '../magic/effects';
class Spell {

	get duration() { return this._duration; }

	// 'single', 'allies', 'enemies', 'all', 'self'
	get target() { return this._target; }
	get damage() { return this._damage; }

	get formula() { return this._formula; }

	get effects() { return this._effects; }

	get mods() { return this._mods; }

	readonly name: string;
	private _duration: number = 0;
	private _target: any;
	private _damage?: any;
	private _formula?: Formula;
	private _effects?: ProtoEffect[];
	private _mods?: any[];


	constructor(name: string) {
		this.name = name;
	}

	cast(src: any, target: any) {
	}

}