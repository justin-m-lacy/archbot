import { Item } from './item';

export type ItemPicker<T = Item> = string | number | T;
export type ItemIndex = string | number;

type SimpleItem = {
    name: string,
    type: string,
    attach?: string,
    toString(): string
}
export default class Container<T extends SimpleItem = Item> {

    /**
     * @property items
     */
    get items() { return this._items; }
    set items(v) { this._items = v; }

    /**
     * @property {number} length
     */
    get length() { return this._items.length; }

    protected _items: T[] = [];
    protected type?: string;

    constructor() {
    }

    toJSON() { return { items: this._items }; }

    /**
     * Removes and returns random item from inventory.
     * @returns random item from Inventory, or null.
     */
    randItem() {

        let len = this._items.length;
        if (len === 0) return null;

        let ind = Math.floor(len * Math.random());
        return this._items.splice(ind, 1)[0];

    }

    /**
     * @returns {string} list of all items in inventory.
    */
    getMenu() {

        let len = this._items.length;
        if (len === 0) return '';

        let it = this._items[0];
        let list = '1) ' + `${it}`;
        if (it.attach) list += '\t[img]';

        for (let i = 1; i < len; i++) {
            it = this._items[i];
            list += '\n' + (i + 1) + ') ' + it.name;
            if (it.attach) list += '\t[img]';

        }

        return list;

    }

    /**
     * Retrieve item by name or index.
     * @param  start
     * @returns  Item found, or null on failure.
     */
    get(start?: ItemIndex,): T | null {

        /// 0 is also not allowed because indices are 1-based.
        if (!start) return null;

        if (typeof start === 'string') {
            let num = parseInt(start);
            if (Number.isNaN(num)) {
                return this.findItem(start);
            } else {
                start = num;
            }
        } else if (Number.isNaN(start)) {
            /// initial index passed was NaN.
            return null;
        }


        start--;
        if (start >= 0 && start < this._items.length) return this._items[start];


        return null;

    }

    /**
     *
     * @param {number} start - start number of items to take.
     * @param end number of items to take.
     * @returns {T[]|null} - Range of items found.
     */
    takeRange(start: ItemIndex, end: ItemIndex) {

        if (typeof start === 'string') {
            start = parseInt(start);
        }
        if (typeof end === 'string') {
            end = parseInt(end);
        }
        if (isNaN(start) || isNaN(end)) return null;

        if (--start < 0) start = 0;
        if (end > this._items.length) { end = this._items.length; }

        return this._items.splice(start, end - start);

    }

    /**
     * Attempts to remove an item by name or index.
     * @param {number|string|Item} which
     * @returns {T|null} item removed, or null if none found.
     */
    take(which?: number | string | T): T | T[] | null {

        if (which === null || which === undefined) return null;

        if (typeof which === 'object') {

            let ind = this._items.indexOf(which);
            if (ind >= 0) return this._items.splice(ind, 1)[0];
            return null;

        }

        if (typeof which === 'string') {

            if (Number.isNaN(which)) {

                which = which.toLowerCase();
                for (let i = this._items.length - 1; i >= 0; i--) {

                    if (this._items[i]?.name.toLowerCase() === which) return this._items.splice(i, 1)[0];

                }
                return null;

            } else {
                which = parseInt(which);
            }

        }

        which--;
        if (which >= 0 && which < this._items.length) return this._items.splice(which, 1)[0];

        return null;

    }

    /**
     *
     * @param {string} name
     */
    findItem(name: string) {

        name = name.toLowerCase();
        for (let i = this._items.length - 1; i >= 0; i--) {

            var it = this._items[i];
            if (it && it.name && it.name.toLowerCase() === name) return this._items[i];

        }
        return null;
    }

    /**
     *
     * @param it
     * @returns starting 1-index where items were added.
     */
    add(it?: T | T[] | (T | null | undefined)[] | null) {

        if (Array.isArray(it)) {
            let ind = this._items.length + 1;

            it = it.filter(v => v != null);
            this._items = this._items.concat(it as T[]);
            return ind;
        }

        if (it != null) {
            this._items.push(it);
            return this._items.length;
        }
        return -1;

    }

    /**
     * Remove all items matching predicate; returns the list of items removed.
     * @param {*} p
     */
    removeWhere(p: (it: T) => boolean) {

        let r = [];

        for (let i = this._items.length - 1; i >= 0; i--) {
            if (p(this._items[i])) r.push(this._items.splice(i, 1)[0]);
        }

        return r;

    }

    /**
     * Apply function to each item in inventory.
     * @param {function} f
     */
    forEach(f: (it: T) => void) {

        for (let i = this._items.length - 1; i >= 0; i--) {
            f(this._items[i]);
        }

    }

}