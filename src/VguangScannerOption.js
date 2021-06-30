"use strict"

class VguangScannerOption {
    constructor (options = {}) {
        Object.keys(VguangScannerOption.Fields).forEach(k => {
            const paramStruct = VguangScannerOption.Fields[k];
            if (paramStruct.required) if (options[k] === undefined) throw `VguangScannerOption.fields[${k}] 参数为必选，不能缺省！`;
            if (options[k] !== undefined) paramStruct.check(options[k]);
            this[k] = options[k];
        });
    }
}
VguangScannerOption.Vid = 1317;
VguangScannerOption.Modes = {
    "tx200": {
        pid: 42156,
    },
    "tx400": {
        pid: 42156,
    }
}
VguangScannerOption.Fields = {
    /**
     * 型号 
     */
    mode: {
        required: true,
        type: String,
        check (value) {
            if (!(value in VguangScannerOption.Modes)) throw `mode 只能为VguangScannerOption.modes 中的参数！`;
        }
    },
}

module.exports = VguangScannerOption;