import { Unpackr, addExtension } from "msgpackr";

let initialized = false;
let unpacker: Unpackr | null = null;

export const unpackDocument = <T extends Object = Object>(document: string) => {

    if (!initialized) initialize([20, 30, 31, 40, 41, 42]);

    return unpacker!.unpack(Buffer.from(document, "base64")) as T;

}



function initialize(extList: number[]) {

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

    unpacker = new Unpackr({

        bundleStrings: true,
        moreTypes: true
    });


}