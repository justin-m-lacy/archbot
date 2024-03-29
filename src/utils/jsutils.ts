/**
 * @param {*=>boolean} pred - predicate random element must satisfy.
 * @returns {*} - Random element satisfying predicate,
 * or null.
 */
export const randWhere = <T>(arr: T[], pred: (elm: T) => boolean) => {

	const len = arr.length;
	let i = Math.floor(Math.random() * len);
	const start = i;

	do {

		if (pred(arr[i])) return arr[i];

		if (++i >= len) i = 0;

	} while (i != start);

	return null;

}

export const randElm = <T>(arr: T[]) => {
	return arr[Math.floor(Math.random() * (arr.length))];
}

/**
 * Returns a random between [min,max]
 * @param {number} min
 * @param {number} max
 */
export const random = (min: number, max: number) => {
	return min + Math.round(Math.random() * (max - min));
}

/**
 * Quickly removes an element from an array but does
 * not preserve order. Only safe to use in a loop when
 * you are counting down from high index to low.
 * @param {Array} a - array.
 * @param {number} i - index to remove.
 */
export const fastCut = <T>(a: T[], i: number) => { a[i] = a[a.length - 1]; a.pop(); }

// Performs a recursive merge of variables from src to dest.
// Variables from src override variables in dest.
export const recurMerge = (dest: any, src: any) => {

	if (typeof src !== 'object') return dest;
	if (typeof dest !== 'object') return Object.assign({}, src);

	for (const key in src) {

		// src[key] might be falsey. skip inherited props.
		if (!src.hasOwnProperty(key)) {
			continue;
		}

		const newVal = src[key];
		const oldVal = dest[key];
		if (oldVal != null && (typeof oldVal === 'object' && typeof newVal === 'object')) {

			recurMerge(oldVal, newVal);

		} else {
			dest[key] = newVal;
		}

	}

}

// merges all variables of src into dest.
// values from src overwrite dest.
export const merge = (src: any, dest: any) => {

	for (const key in src) {

		if (src.hasOwnProperty(key)) {
			dest[key] = src[key];
		}

	}

}