const rollex = /^([\+\-]?\d*)?d(\d*)([\+\-]?\d+)?/;

export class Roller {

	static FromString(str: string) {

		//console.log('roller from: ' + str );

		const res = rollex.exec(str);
		if (res === null) return new Roller();

		let num = parseInt(res[1]);
		let sides = parseInt(res[2]);
		let bonus = parseInt(res[3]);

		if (Number.isNaN(num)) num = 1;
		if (Number.isNaN(sides)) sides = 6;
		if (Number.isNaN(bonus)) bonus = 0;

		return new Roller(num, sides, bonus);

	}

	static FromJSON(json: string | Partial<Roller>) {

		if (typeof (json) === 'string') return Roller.FromString(json);
		return Object.assign(new Roller(), json);
	}

	readonly count: number;
	readonly sides: number;
	bonus: number;

	constructor(count: number = 1, sides: number = 0, bonus: number = 0) {

		this.sides = Math.min(sides, 999999);
		this.count = Math.min(count, 99999);
		this.bonus = Math.min(bonus, 999999);

	}

	toString() {
		return this.bonus ? this.count + 'd' + this.sides + '+' + this.bonus : this.count + 'd' + this.sides;
	}

	roll() {

		let tot = this.bonus, s = this.sides;
		let i = this.count;

		if (i >= 0) {

			while (i-- > 0) tot += Math.floor(s * Math.random() + 1);
			return tot;
		} else {

			while (i++ < 0) tot += Math.floor(s * Math.random() + 1);
			return -tot;
		}

	}

}


export const parseRoll = (str: string) => {

	const res = rollex.exec(str);
	if (res === null) return roll(1, 6);

	let num = Math.min(parseInt(res[1]), 10000);
	let sides = Math.min(parseInt(res[2]), 999999);
	let bonus = Math.min(parseInt(res[3]), 999999);

	if (Number.isNaN(num)) num = 1;
	if (Number.isNaN(sides)) sides = 6;
	if (Number.isNaN(bonus)) bonus = 0;

	let tot = bonus;

	if (num >= 0) {

		while (num-- > 0) tot += Math.floor(sides * Math.random()) + 1;
		return tot;

	} else {

		while (num++ < 0) tot += Math.floor(sides * Math.random()) + 1;
		return -tot;

	}

}

export const roll = (count: number, sides: number, bonus: number = 0) => {

	let tot = bonus;

	if (count >= 0) {

		while (count-- > 0) tot += Math.floor(sides * Math.random()) + 1;
		return tot;

	} else {

		while (count++ < 0) tot += Math.floor(sides * Math.random()) + 1;
		return -tot;

	}

}
