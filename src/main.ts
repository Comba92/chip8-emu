import IOBrowser from "./browser"
import Chip8 from "./emulator"

const emu = new Chip8()
const io = new IOBrowser(emu)