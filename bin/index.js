#!/usr/bin/env node

const HID = require("node-hid");
const { Vid } = require("../src/VguangScannerOption");

const devices = HID.devices().filter(item => item.vendorId == Vid)
console.log("微光扫码器列表如下：\n");
devices.forEach((item, index) => {
    console.log(index + 1 + "\n" + JSON.stringify(item, null, 4) + "\n");
});