const VguangScanner = require("../src/VguangScanner");

const scanner = new VguangScanner({ mode: "tx200" });

const stack = [];
const _push = stack.push;
stack.push = function (...args) {
    _push.call(stack, ...args);
    if (this.length > 2) this.splice(0, this.length - 2);
}

scanner.on("data", data => {
    if (!stack.includes(data)) {
        scanner.beep();
        stack.push(data);
    } 
    console.log(stack);
});

// scanner.toggleLight(false);

setInterval(() => {
    // scanner.beep();
    // scanner.blinkRed(3, 200);
}, 2000);