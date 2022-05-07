const turns_per_hour = 900;
const turns_per_min = 15;

const regex = /(?:(\d+)\s?hrs?)?\s*(?:(\d+)\s?mins?)?\s*(?:(\d+)\s?turns?)?/ig;

/**
 * Parse string durations into turn-counts.
 */
export default {

	/**
	 * Parse a string to get a number of game turns.
	 * @param {string} str - time string.
	 * @returns {number} duration in number of turns.
	 */
	getTurns(str: string) {

		let res = regex.exec(str);
		if (res === null) return 0;

		let turns = 0, count;

		if (res.length > 1) {
			count = parseInt(res[1]);
			if (!Number.isNaN(count)) turns += count * turns_per_hour;
		}

		if (res.length > 2) {
			count = parseInt(res[2]);
			if (!Number.isNaN(count)) turns += count * turns_per_min;
		}

		if (res.length > 3) {
			count = parseInt(res[3]);
			if (!Number.isNaN(count)) turns += count;
		}

		return turns;

	},

	/**
	 * Converts a number of turns into a string duration.
	 * @param {number} turns - number of turns.
	 * @returns {string} - human readable duration.
	 */
	getDuration(turns: number) {

		if (turns === 0) return 'instant';

		let hours = Math.floor(turns / turns_per_hour);
		let mins = Math.round((turns % turns_per_hour) / turns_per_min);

		return ((hours > 0) ? `${hours} hrs ` : '') + ((mins > 0) ? `${mins} mins` : '');
	}

};