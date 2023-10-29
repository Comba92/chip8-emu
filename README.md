# Chip8 Emulator in Typescript
This is a simple and rudimentary web based Chip8 emulator written in Typescript, for educational porpuoses.
Roms can be loaded or dragged on the web page.
Keys mapping is shown on the web page.

The emulator runs on average at 60fps (so 60 Hz) and executes 5 instructions per frame. Getting Chip8 CPU right clock is tricky, as there is no specification on a precise value, and different games will run better at different clock speeds.
All the tests from [Timendus test suite](https://github.com/Timendus/chip8-test-suite) are ok.


## Building
Install dependencies:
```bash
git clone https://github.com/Comba92/chip8-emu.git
npm i
```

Build and Run:
```bash
npm run build
npm run preview
```

## Resources
Various resources I used.
[awesome-chip-8: collection of resources](https://github.com/tobiasvl/awesome-chip-8)
[Guide to making a Chip8 emulator](https://tobiasvl.github.io/blog/write-a-chip-8-emulator/)
[Chip8 emulator in Rust](https://github.com/aquova/chip8-book)
[Chip8 emulator in Javascript](https://www.taniarascia.com/writing-an-emulator-in-javascript-chip8/)
[wasm-rust-chip8](https://github.com/ColinEberhardt/wasm-rust-chip8)

[Chip8 instruction set reference](http://devernay.free.fr/hacks/chip8/C8TECH10.HTM)
[Chip8 timers clock](https://www.reddit.com/r/EmuDev/comments/7v7flo/duncetier_chip8_question_how_do_i_set_the_timers/)

## Possible Updates
[] - Memory and Registers dump
[] - Roms picker
[] - Dynamically change CPU clock
[] - Settable keys
[] - Better page visuals