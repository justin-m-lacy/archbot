const ms_per_day = 1000*3600*24;
const ms_per_hr = 1000*3600;
const ms_per_min = 60*1000;

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

	static recent( time ) {

		let dt;

		if ( time instanceof Date ) {
			dt = Date.now() - time.getTime();
		} else {
			dt = Date.now() - time;
			time = new Date(time);
		}

		if ( this.inDay(dt) ) return 'at ' + time.toLocaleTimeString();
		return 'on ' + time.toLocaleDateString() + ' at ' + time.toLocaleTimeString();


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