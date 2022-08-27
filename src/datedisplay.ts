const Display = require('./display');

const ms_per_day: number = 1000 * 3600 * 24;
const ms_per_hr: number = 1000 * 3600;
const ms_per_min: number = 60 * 1000;
const ms_per_year: number = ms_per_day * 365;

const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const fullMonths = ['january', 'february', 'march', 'april', 'may', 'june',
	'july', 'august', 'september', 'october', 'november', 'december'];

const days = ['sun', 'mon', 'tues', 'wed', 'thr', 'fri', 'sat'];
const fullDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export default {

	parse(str: string) {

		const parts = str.split(' ');
		let len = parts.length;
		let part, value, num;

		const date = new Date();

		for (let i = 0; i < len; i++) {

			part = parts[i];

			if (part.indexOf(':') > 0) {
				this.setTime(date, part);
				continue;
			}

			num = parseInt(part);
			if (isNaN(num)) {

				value = this.tryGetMonth(part);
				if (value >= 0) {
					date.setMonth(value);
				} else {

					const day = this.tryGetDay(part);
					if (value >= 0) {
					}

				}


			} else {

			}

		} //

		return new Date();

	},

	/**
	 * Parse a time string into its hours/minutes components and set
	 * the given date's time to the result.
	 * @param {Date} date
	 * @param {string} str
	 */
	setTime(date: Date, str: string) {

		try {
			const parts = str.split(':').map(v => parseInt(v));
			// @ts-ignore
			date.setHours.apply(date, parts);
		} catch (err) {
			console.warn(`failed to parse ${str} date parts: ${err}`);
		}

	},

	/**
	 * Attempts to get a day of the week.
	 * @param {string} str
	 * @returns {number} zero-based day of week, or -1 on failure.
	 */
	tryGetDay(str: string) {

		str = str.toLocaleLowerCase();
		let day = days.indexOf(str);
		if (day < 0) day = fullDays.indexOf(str);
		return day;

	},

	/**
	 * Get a numeric month of the year based on a month string.
	 * @param {string} str
	 * @returns {number} zero-based month of the year, or -1 on failure.
	 */
	tryGetMonth(str: string) {

		str = str.toLocaleLowerCase();
		let month = months.indexOf(str);
		if (month < 0) month = fullMonths.indexOf(str);
		return month;

	},

	/**
	 *
	 * @param {number} since - timestamp of the starting Date.
	 * @returns {string} Description of time elapsed.
	 */
	elapsed(since: number) {

		//let dt = Date.now() - since;
		return this.timespan(Date.now() - since);

	},

	/**
	 * Gets a string describing a span of time.
	 * @param {number} dt - span of time in milliseconds.
	 * @returns {string} - description of the time span.
	 */
	timespan(dt: number) {
		if (dt < ms_per_hr) return ((dt / ms_per_min).toFixed(2) + ' minutes');
		return (dt / ms_per_hr).toFixed(2) + ' hours';
	},

	/**
	 * Returns a date string formatted for a date/time appropriate
	 * to the intervening time scale.
	 * @param {Date|number} date
	 * @returns {string}
	 */
	dateString(date: Date | number) {

		let dt: number;

		if (date instanceof Date) {
			dt = Date.now() - date.getTime();
		} else {
			dt = Date.now() - date;
			date = new Date(date);
		}

		if (this.inDay(dt)) return this.getDayString(date);
		else if (this.inWeek(dt)) return this.getWeekDate(date);
		else if (this.inMonth(dt)) return this.getMonthDate(date);
		return this.getFarDate(date);

	},

	/**
	 * Returns a string for a date within the given day.
	 * @param {Date} date
	 * @returns {string}
	 */
	getDayString(date: Date) {
		return date.getHours() + ':' + date.getMinutes();
	},

	/**
	 * Gets a date string for dates less than a month away.
	 * @param {Date} date
	 * @returns {string}
	 */
	getMonthDate(date: Date) {
		return Display.capitalize(months[date.getMonth()] + ' ' + date.getDate() + ' at ' + date.getHours() + ':' + date.getMinutes());
	},

	/**
	 * Returns a date string for dates less than a week away.
	 * @param {Date} date
	 * @returns {string}
	 */
	getWeekDate(date: Date) {
		return Display.capitalize(days[date.getDay()] + ' ' + date.getMonth() + '/'
			+ date.getDate() + ' at ' + date.getHours() + ':' + date.getMinutes());
	},

	/**
	 * Gets a date string for times very far away.
	 * @param {Date} date
	 * @returns {string}
	 */
	getFarDate(date: Date) {
		return Display.capitalize(months[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear());
	},

	/**
	 * Determines if the elapsed milliseconds is under a day.
	 * @param {number} dt - elapsed period if time in milliseconds.
	 * @returns {boolean} - true if the elapsed time is less than a day.
	 */
	inDay(dt: number) {
		return Math.abs(dt) < ms_per_day;
	},

	/**
	 * Determines if the elapsed milliseconds is under a week.
	 * @param {number} dt - elapsed period if time in milliseconds.
	 * @returns {boolean} - true if the elapsed time is less than a week.
	 */
	inWeek(dt: number) {
		return Math.abs(dt) < 7 * ms_per_day;
	},

	/**
	 * Determines if the elapsed milliseconds is under a month.
	 * @param {number} dt - elapsed period if time in milliseconds.
	 * @returns {boolean} - true if the elapsed time is less than a month.
	 */
	inMonth(dt: number) {
		return Math.abs(dt) < 31 * ms_per_day;
	},

	/**
	 * Determines if the elapsed milliseconds is under a year.
	 * @param {number} dt - elapsed period if time in milliseconds.
	 * @returns {boolean} - true if the elapsed time is less than a year.
	 */
	inYear(dt: number) {
		return Math.abs(dt) < ms_per_year;
	}

}