import BrowserIO from "./browser"
import Chip8 from "./emulator"

const emu = new Chip8()
new BrowserIO(emu)