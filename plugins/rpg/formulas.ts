import { Roller } from './dice';

export class DamageSrc {

	static FromString(dmg: string, type?: string) {
		return new DamageSrc(Roller.FromString(dmg), type);
	}

	static FromJSON(json: any) {

		if (typeof (json) === 'string') {
			return new DamageSrc(Roller.FromString(json));
		} else {

			if (json.dmg) {
				return new DamageSrc(Roller.FromString(json.dmg), json.type);
			} else {
				return new DamageSrc(new Roller(json.count, json.sides, json.bonus), json.type);
			}

		}
	}

	toJSON() { return { dmg: this.roller.toString(), type: this.type }; }

	get bonus() { return this.roller.bonus; }
	set bonus(v) { this.roller.bonus = v; }
	get sides() { return this.roller.sides; }
	set sides(v) { this.roller.sides = v; }
	get count() { return this.roller.count; }
	set count(v) { this.roller.count = v; }

	roller: Roller;
	readonly type: string;

	constructor(roller: Roller, type?: string) {

		this.roller = roller;
		this.type = type ?? 'mystery';

	}

	toString() { return this.roller.toString() + ' ' + this.type; }

	roll() { return this.roller.roll(); }

}