"use strict"

const { EventEmitter } = require("events");
const HID = require("node-hid");
const VguangScannerOption = require("./VguangScannerOption");

class VguangScanner extends EventEmitter {
    constructor (options) {
        super();
        this.options = new VguangScannerOption(options);
        this._device = null;
        this._findDevice();
        this._listen();
        // 禁用扫码器自带的扫码后的蜂鸣器、指示灯反馈。
        this._write([0x24, "00000001"]);
        this._write([0x25, 0]);
        process.on("exit", () => {
            this._device.close();
        });
    }

    _error (err) {
        this._device && this._device.close();
        const errorEventName = VguangScanner.Events["ERROR"];
        if (this.listenerCount(errorEventName) > 0) {
            this.emit(errorEventName, err);
        } else {
            throw `[${this.__proto__.constructor.name}] 报错: ${err}`;
        }
    }

    /**
     * 初始化扫码器 
     */
    _findDevice () {
        const 
            { pid } = VguangScannerOption.Modes[this.options.mode],
            vid = VguangScannerOption.Vid;
        try {
            this._device = new HID.HID(vid, pid);
        } catch(err) {
            this._error(err);
        }
        this._device.on("error", this._error.bind(this));
    }

    /**
     * 开始监听扫码器
     */
    _listen () {
        this._device.on("data", chunk => {
            const data = this._parseBytes(chunk).replace("\x00", "");
            if (data) this.emit(VguangScanner.Events["DATA"], data);
        });
    }   

    /**
     * 构造发往扫码器的数据包 
     * 
     * @param  {Array<Number>} bins
     * @return {Array}
     */
    _buildBytes (bins = []) {
        const 
        bytes = [0x00], 
        data = [];
        // 先提取出命令字
        if (bins[0]) bytes.push(bins.shift());
        bins.forEach(item =>{
            if (typeof item === "number") data.push(item);
            if (typeof item === "string") data.push(parseInt(item, 2));
        });
        bytes.push(data.length & 0xff, data.length >> 8 & 0xff);
        bytes.splice(1, 0, 0x55, 0xaa);
        bytes.push(...data);
        bytes.push(getXor(bytes));
        return bytes;
        function getXor (bytes = []) {
            let tmp = 0;
            bytes.forEach(bin => tmp ^= bin);
            return tmp;
        }
    }

    /**
     * 解析扫码器返回的包数据
     * 
     * @param  {Buffer} buf
     * @return {String}
     */
    _parseBytes (buf) {
        const isSuccess = buf.readInt8(3) === 0;
        if (isSuccess) {
            const len = buf.readUInt16LE(4);
            const d = buf.slice(5, 5 + len + 1);
            return d.toString();
        } else {
            return;
        }
    }

    /**
     * 写入数据，只需传入命令字、数据
     * 
     * @param {Array<Number>} bins
     */
    _write (bins = []) {
        const dataBins = this._buildBytes(bins);
        this._device.write(dataBins);
    }

    /**
     * 蜂鸣器
     * 
     * @param {Number} num  (可选) 响几声
     * @param {Number} time (可选) 每一声的持续时间，ms
     * @param {Number} interval (可选) 蜂鸣器间隔时间单位ms
     */
    beep (num = 1, time = 200, interval = 50) {
        this._write([0x04, "00001000", 0xff & num, time / 50, interval / 50, 0]);
    }

    /**
     * 红灯闪，实际测试为红色背景光
     * 
     * @param {Number} num
     * @param {Number} time 
     * @param {Number} interval
     */
    blinkRed (num = 1, time = 200, interval = 50) {
        this._write([0x04, "00000010", 0xff & num, time / 50, interval / 50, 0]);
    }

    /**
     * 绿灯灯闪，实测为面板上的指示灯（电源指示灯旁边那颗）
     * 
     * @param {Number} num
     * @param {Number} time 
     * @param {Number} interval
     */
    blinkGreen (num = 1, time = 200, interval = 50) {
        this._write([0x04, "00000100", 0xff & num, time / 50, interval / 50, 0]);
    }

    /**
     * 开关白色背景灯光
     * 
     * @param {Boolean} is
     */
    toggleLight (is = true) {
        this._write([0x24, "00000000" + (is ? 1 : 0)]);
    }
}
VguangScanner.Events = {
    "DATA": "data",
    "ERROR": "error"
}
VguangScanner.VguangScannerOption = VguangScannerOption;

module.exports = VguangScanner;