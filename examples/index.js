const VguangScanner = require("../src/VguangScanner");

const scanner = new VguangScanner({ mode: "tx200" });

let is = true;

scanner.on("data", data => {
    if (is) {
        is = false;
        console.log(data);
        scanner.beep(1);
        setTimeout(() => is = true, 800);
    }
});