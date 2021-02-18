"use strict"

const { EventEmitter } = require("events");
const usb = require("usb");
const VguangScannerOption = require("./VguangScannerOption");
const { platform } = require("os");

class VguangScanner extends EventEmitter {
    constructor (options) {
        super();
        this.options = new VguangScannerOption(options);
        this._outEdps = [];
        this._inEdps  = [];
        this._findDevice();
        this._listen();
        // 禁用扫码器自带的扫码后的蜂鸣器、指示灯反馈。
        this._write([0x24, "00000001"]);
        this._write([0x25, 0]);
    }

    _findDevice () {
        const { vid } = VguangScannerOption.Modes[this.options.mode];
        const device = 
        usb.getDeviceList()
        .filter(d =>{
            return d.configDescriptor && d.configDescriptor.interfaces.filter(ifa => {
                return ifa.filter(conf => {
                    return conf.bInterfaceClass === 0x03; // HID设备
                }).length;
            }).length;
        })
        .filter(d => d.deviceDescriptor.idVendor === vid)[0];
        if (!device) {
            const errorEventName = VguangScanner.Events["error"], msg = `Device mode ${this.options.mode} not found！`;
            if (this.listenerCount(errorEventName)) return this.emit(errorEventName, msg);
            else throw msg;
        }
        device.open();
        device.interfaces.forEach(ifa => {
            if (platform() !== "win32" && ifa.isKernelDriverActive()) {
                ifa.detachKernelDriver();
            }
            ifa.claim();
            ifa.endpoints.forEach(edp => {
                if (edp.direction === "in") {
                    this._inEdps.push(edp);
                } else {
                    this._outEdps.push(edp);
                }
            });
        });
    }

    /**
     * 写入数据，只需传入命令字、数据
     * 
     * @param {Array<Number>} bins
     */
    _write (bins = []) {
        const buf = buildBytes(bins);
        this._outEdps.forEach(outEdp => outEdp.transfer(buf));
        function buildBytes (bins = []) {
            const 
            // 先提取出命令字
            bytes = bins[0] ? [bins.shift()] : [], 
            data = [];
            bins.forEach(item =>{
                if (typeof item === "number") data.push(item);
                if (typeof item === "string") data.push(parseInt(item, 2));
            });
            bytes.push(data.length & 0xff, data.length >> 8 & 0xff);
            bytes.unshift(0x55, 0xaa);
            bytes.push(...data);
            bytes.push(getXor(bytes));
            return Buffer.from(bytes);
            function getXor (bytes = []) {
                let tmp = 0;
                bytes.forEach(bin => tmp ^= bin);
                return tmp;
            }
        }
    }

    _listen () {
        this._inEdps.forEach(inEdp => {
            inEdp.on("data", data => {
                const code = parseBytes(data);
                code && /\w+/.test(code) && this.emit(VguangScanner.Events["data"], code);
            });
            inEdp.startPoll();
        });
        function parseBytes (buf) {
            const isSuccess = buf.readInt8(3) === 0;
            if (isSuccess) {
                const len = buf.readUInt16LE(4);
                const d = buf.slice(5, 5 + len + 1);
                return d.toString();
            } else {
                return;
            }
        }
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
    "data": "data",
    "error": "error"
}
VguangScanner.VguangScannerOption = VguangScannerOption;

module.exports = VguangScanner;