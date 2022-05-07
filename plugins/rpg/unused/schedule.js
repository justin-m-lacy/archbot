// NOT CURRENTLY USED
// TODO: REPLACE WITH PRIORITY QUEUE.
class Scheduler {

	constructor() {
		this._queue = [];
	}

	/**
	 * Schedule at a fixed time from now.
	 * @param {number} time 
	 * @param {function} cb 
	 */
	schedIn( time, cb ) {

		let sched = new SchedTime( Date.now() + time, cb );
		let ind = this._queue.findIndex( it=> it.time >= time );
		if ( ind < 0) {
			this._queue.push( sched );
		} else {
			this._queue.splice( ind, 0, sched);
		}

	}

	schedule( time, cb ){

		let sched = new SchedTime( time, cb );
		let ind = this._queue.findIndex( it=> it.time >= time );
		if ( ind < 0) {
			this._queue.push( sched );
		} else {
			this._queue.splice( ind, 0, sched);
		}


	}

	peek() {
		if ( this._queue.length === 0 ) return null;
		return this._queue[0];
	}

	dequeue() { return this._queue.shift(); }

}

class SchedTime {

	get cb() { return this._cb; }

	constructor( time, cb ) {
		this._time = time;
		this._cb = cb;
	}

}