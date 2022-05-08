import Char from '../char/char';
import Cache from 'archcache';
import { Coord } from '../world/loc';
import SocialGroup from './socialGroup';

export default class Party extends SocialGroup {

	static FromJSON(json: any, cache: Cache) {

		let p = new Party(json.leader, cache);

		Object.assign(p, json);

		return p;

	}

	toJSON() {

		return {
			roster: this.names,
			leader: this.leader,
			invites: this.pending
		}

	}

	get loc() { return this._loc; }
	set loc(v) { this._loc.setTo(v); }

	private _loc: Coord;

	constructor(leader: Char, cache: Cache) {

		super(cache);

		this.roster = [leader.name];

		this.leader = leader.name;
		this.name = this.leader + "'s Party";

		this._loc = new Coord(leader.loc.x, leader.loc.y);

	}

	async getState() {

		let char;
		for (let i = this.roster.length - 1; i >= 0; i--) {

			char = await this.cache.fetch(this.roster[i]);
			if (char && char.isAlive()) return 'alive';

		} //
		return 'dead';

	}

	/**
	 *
	 * @param {string} name
	 */
	async getChar(name: string) { return this._cache.fetch(name); }

	/**
	 *
	 * @param coord
	 */
	async move(coord: Coord) {

		this.loc = coord;

		let roster = this.roster;

		for (let i = roster.length - 1; i >= 0; i--) {

			var char = await this._cache.fetch(roster[i]);
			if (char) {
				char.loc = coord;
				if (char.isAlive()) char.recover();
			}

		} //

	}

	async rest() {

		let hp = 0;
		let max = 0;

		let roster = this.roster;

		for (let i = roster.length - 1; i >= 0; i--) {

			var char = await this._cache.fetch(roster[i]);
			if (!char) continue;
			if (char.isAlive()) char.rest();
			hp += char.curHp;
			max += char.maxHp;

		} //

		return hp / max;
	}

	async recover() {

		let roster = this.roster;

		for (let i = roster.length - 1; i >= 0; i--) {

			var char = await this._cache.fetch(roster[i]);
			//console.log( 'moving char: ' + char.name + ' to: ' + coord.toString() );
			if (char && char.isAlive()) char.recover();

		} //

	}

	async getStatus() {

		let res = this.name + ':';

		let roster = this.roster;
		let len = roster.length;

		for (let i = 0; i < len; i++) {
			var char = await this._cache.fetch(roster[i]);
			res += `\n${char.name}  ${char.getStatus()}`;
		}

		return res;

	}

	async addExp(exp: number) {

		let count = this.roster.length;

		// add exp bonus for party members.
		exp = Math.floor(exp * (1 + count * 0.15) / count);

		for (let i = count - 1; i >= 0; i--) {

			var c = await this._cache.fetch(this.roster[i]);
			if (c) c.addExp(exp)

		}

	}

	/**
	 * Returns a random alive character from a group.
	 */
	async randAlive() {

		let len = this.roster.length;
		let ind = Math.floor(Math.random() * len);
		let start = ind;

		do {

			var c = await this._cache.fetch(this.roster[ind]);
			if (c && c.state === 'alive') return c;

			if (++ind >= len) ind = 0;

		} while (ind != start);

		return null;

	}


	/**
	 * A valid target must be alive and have positive hitpoints.
	 */
	async randTarget() {

		let len = this.roster.length;
		let ind = Math.floor(Math.random() * len);
		let start = ind;

		do {

			var c = await this._cache.fetch(this.roster[ind]);
			if (c && c.curHp > 0 && c.state === 'alive') return c;

			console.log(this.roster[ind] + ' NOT A VALID TARGEt.');
			if (++ind >= len) ind = 0;

		} while (ind != start);

		return null;

	}

}