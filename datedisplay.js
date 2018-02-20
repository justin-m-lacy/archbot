const ms_per_day = 1000*3600*24;
const ms_per_hr = 1000*3600;
const ms_per_min = 60*1000;

const months = [ 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec' ];
const days = [ 'Sun', 'Mon', 'Tues', 'Wed', 'Thr', 'Fri', 'Sat' ];

module.exports = class {

	static elapsed( since ) {

		let dt = Date.now() - since;
		return this.timespan( Date.now() - since );

	}

	// returns string of span of time.
	static timespan( dt ) {
		if ( dt < ms_per_hr ) return ( (dt/ms_per_min).toFixed(2) + ' minutes');
		return ( dt / ms_per_hr).toFixed(2) + ' hours';
	}

	static dateString( date ) {

		let dt;

		if ( date instanceof Date ) {
			dt = Date.now() - date.getTime();
		} else {
			dt = Date.now() - date;
			date = new Date(date);
		}

		if ( this.inDay(dt) ) return this.getDayString(date);
		else if ( this.inWeek(dt)) return this.getWeekDate(date);
		else if ( this.inMonth(dt)) return this.getMonthDate(date);
		return this.getFarDate(date);


	}

	static getDayString( date ) {
		return date.getHours() + ':' + date.getMinutes();
	}

	// elapsed time within a month.
	static getMonthDate( date ) {
		return months[ date.getMonth() ] + ' ' + date.getDate() + ' at ' + date.getHours() + ':' + date.getMinutes();
	}

	// return string for elapsed time within a week.
	static getWeekDate( date ) {
		return days[ date.getDay() ] + ' ' + date.getMonth() + '/'
		+ date.getDate() + ' at ' + date.getHours() + ':' + date.getMinutes();
	}

	/// return a date string when the time involved is very long.
	static getFarDate( date ) {
		return months[ date.getMonth() ] + ' ' + date.getDate() + ', ' + date.getFullYear();
	}

	// elapsed time less than day
	static inDay( dt ) {
		return Math.abs(dt) < ms_per_day;
	}

	// elapsed less than week
	static inWeek( dt ) {
		return Math.abs(dt) < 7*ms_per_day;
	}

	// elapsed less than month.
	static inMonth( dt ) {
		return Math.abs(dt) < 31*ms_per_day;
	}


}