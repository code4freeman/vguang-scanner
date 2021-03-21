#!/usr/bin/env node

const { Vid } = require("../VguangScannerOption");
const usb = require("usb");

const ds = findScanner();
console.log("找到微光扫码设备：\n" + ds.map(({ deviceDescriptor: d }) => `VID: ${d.idVendor} PID: ${d.idProduct}`).join("\n") + "\n"); 

function findScanner () {
    let ds = usb.getDeviceList().filter(device => {
        return device.configDescriptor && device.configDescriptor.interfaces.filter(interface => {
            return interface.filter(conf => {
                return conf.bInterfaceClass === 0x03;
            }).length;
        }).length;
    });
    if (ds.length === 0) {
        console.log("没有找到任何HID扫码器设备！");
        process.exit();
    }
    ds = ds.filter(d => d.deviceDescriptor.idVendor === Vid);
    if (ds.length === 0) {
        console.log("没有找到微光品牌扫码设备！");
        process.exit();
    }
    return ds;
}