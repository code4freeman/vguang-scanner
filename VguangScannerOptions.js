"use strict"

class VguangScannerOptions {
    constructor (options = {}) {
        Object.keys(VguangScannerOptions.Fields).forEach(k => {
            const paramStruct = VguangScannerOptions.Fields[k];
            if (paramStruct.required) if (options[k] === undefined) throw `VguangScannerOptions.fields[${k}] 参数为必选，不能缺省！`;
            if (options[k] !== undefined) paramStruct.check(options[k]);
            this[k] = options[k];
        });
    }
}
VguangScannerOptions.Modes = {
    "tx200": {
        vid: 1317,
    }
}
VguangScannerOptions.Fields = {
    /**
     * 型号 
     */
    mode: {
        required: true,
        type: String,
        check (value) {
            if (!(value in VguangScannerOptions.Modes)) throw `mode 只能为VguangScannerOptions.modes 中的参数！`;
        }
    },
}

module.exports = VguangScannerOptions;