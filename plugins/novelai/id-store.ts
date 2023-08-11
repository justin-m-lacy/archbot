import { randomBytes } from 'crypto';
const ID_SIZE_BYTES = 21;

const createId = () => {
    return randomBytes(ID_SIZE_BYTES).toString("base64url");
}


export class IdStore {

    private ids = new Set<string>();

    /**
     * 
     * @param ids - known ids.
     */
    constructor(ids?: Iterable<string>) {

        if (ids) this.addIds(ids);
    }

    addIds(ids: Iterable<string>) {
        for (const id of ids) {
            this.ids.add(id);
        }
    }

    /**
     * Add id to list of known ids.
     * @param id 
     */
    addId(id: string) {
        this.ids.add(id);
    }

    newId() {

        let id;
        do {
            id = createId();
        } while (this.ids.has(id));

        this.ids.add(id);
        return id;

    }

}