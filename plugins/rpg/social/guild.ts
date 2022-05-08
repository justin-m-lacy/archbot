import Cache from 'archcache';
import Char from '../char/char';
import Inventory from '../inventory';
import SocialGroup from './socialGroup';
import { Coord } from '../world/loc';

/**
 * Can't use statics because static variables from
 * different servers are shared.
 */
export class GuildManager {

	readonly cache: Cache;

	constructor(cache: Cache) {
		this.cache = cache;
	}

	/**
	 *
	 * @param {string} name
	 * @returns {Promise<Guild>}
	 */
	async GetGuild(name: string) {

		let data = this.cache.get(name);
		if (data) return data;

		data = await this.cache.fetch(name);
		if (!data) return;

		if (data instanceof Guild) return data;

		data = Guild.FromJSON(data, this.cache);
		this.cache.cache(name, data);

		return data;

	}

	/**
	 *
	 * @returns {Promise<Guild>}
	 */
	async MakeGuild(name: string, leader: Char) {

		let g = new Guild(name, this.cache);
		g.leader = leader.name;
		g.roster.push(leader.name);
		g.createdAt = Date.now();

		await this.cache.store(name, g);
		return g;

	}

}

export class Guild extends SocialGroup {

	static FromJSON(json: any, cache: Cache) {

		let g = new Guild(json.name, cache);

		Object.assign(g, json);

		if (g.inv) g.inv = Inventory.FromJSON(g.inv);
		else g.inv = new Inventory();

		return g;

	}

	toJSON() {

		return {

			name: this.name,
			leader: this.leader,
			desc: this._desc,
			roster: this.roster,
			invites: this.invites,
			inv: this.inv,
			level: this._level,
			loc: this._loc,
			created: this.createdAt,
			exp: this._exp

		};

	}

	get desc() { return this._desc; }
	set desc(v) { this._desc = v; }

	get inv() { return this._inv; }
	set inv(v) { this._inv = v; }

	get level() { return this._level; }
	set level(v) { this._level = v; }

	get loc() { return this._loc; }
	set loc(v) { this._loc.setTo(v); }

	get exp() { return this._exp; }
	set exp(v) { this._exp = v; }

	private _level: number = 1;
	private _exp: number = 0;
	createdAt: number = 0;
	private _desc?: string;
	private _inv?: Inventory;
	private _loc: Coord = new Coord(0, 0);

	constructor(name: string, cache: Cache) {

		super(cache);

		this.name = name;

	}

}