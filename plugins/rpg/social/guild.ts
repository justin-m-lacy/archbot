import Cache from 'archcache';
import Char from '../char/char';
import Inventory from '../inventory';

const SocialGroup = require('./socialGroup');

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

		data = Guild.FromJSON(data);
		this.cache.cache(name, data);

		return data;

	}

	/**
	 *
	 * @returns {Promise<Guild>}
	 */
	async MakeGuild(name: string, leader: Char) {

		let g = new Guild(name);
		g.leader = leader.name;
		g.roster.push(leader.name);
		g.time = Date.now();

		await this.cache.store(name, g);
		return g;

	}

}

export class Guild extends SocialGroup {

	static FromJSON(json: any) {

		let g = new Guild(json.name);

		Object.assign(g, json);

		if (g._inv) g._inv = Inventory.FromJSON(g._inv);
		else g._inv = new Inventory();

		return g;

	}

	toJSON() {

		return {

			name: this._name,
			leader: this._leader,
			desc: this._desc,
			roster: this._roster,
			invites: this._invites,
			inv: this.inv,
			level: this._level,
			loc: this._loc,
			time: this._time,
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

	get time() { return this._time; }
	set time(v) { this._time = v; }

	private _level: number = 1;
	private _exp: number = 0;

	constructor(name: string) {

		super();

		this.name = name;

	}

}