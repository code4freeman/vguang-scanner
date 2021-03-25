const VguangScanner = require("../VguangScanner");

const scanner = new VguangScanner({ mode: "tx200" });

scanner.on("data", data => {
    console.log(data);
});

setInterval(() => {
    scanner.beep();
}, 1000);