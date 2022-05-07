import { Loc } from './loc';

/**
 * Block of locations stored together.
 */
export default class Block {

	toJSON() {

		return {
			key: this.key,
			locs: this.locs
		};

	}

	readonly key: string;
	readonly locs: { [key: string]: Loc } = {};

	constructor(json?: any) {

		if (json) {

			this.key = json.key ?? 'unknown';

			let locs = json.locs;
			if (locs) {

				for (let p in locs) {
					this.locs[p] = Loc.FromJSON(locs[p]);
				} //for

			}

		} else {
			this.key = 'unknown';
		}

	}

	setLoc(key: string, loc: Loc) {
		this.locs[key] = loc;
	}

	getLoc(key: string) {
		return this.locs[key];
	}

} // class