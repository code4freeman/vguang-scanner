const VguangScanner = require("../index");

const scanner = new VguangScanner({ mode: "tx200" });

// scanner.beep(10);
// scanner.blinkGreen(10, 1000)
// scanner.toggleLight(false);
setTimeout(() => {
    scanner.toggleLight(true);
}, 2000);
scanner.on("data", code => {
    console.log("数据：");
    console.log(code);
    scanner.beep(1);
});