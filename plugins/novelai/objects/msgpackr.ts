import { Packr, addExtension } from "msgpackr";

const extensionIds = [20, 30, 31, 40, 41, 42];

let initialized = false;
let packer: Packr | null = null;

export const testUnpackPack = <T extends Object = Object>(input: string) => {

    if (!initialized) initialize();
    const obj = unpackDocument(input);

    const repack = packDocument(obj as T);

    console.log(`same? ${input === repack}`);

}

export const unpackDocument = <T extends Object = Object>(document: string) => {

    if (!initialized) initialize();

    return packer!.unpack(Buffer.from(document, "base64")) as T;

}

export const packDocument = <T extends Object = Object>(data: T) => {

    if (!initialized) initialize();

    return packer!.pack(data).toString("base64");

}

function initialize() {

    const extList = extensionIds;

    for (let i = extList.length - 1; i >= 0; i--) {

        addExtension({
            type: extList[i],
            read: function (data) {
                return data;
            },
            /*unpack: (pack) => {
                console.log(`decode: ${pack.toString()}`);
                return pack.toString();
            }*/
        })
    }
    initialized = true;

    packer = new Packr({

        bundleStrings: true,
        moreTypes: true
    });


}