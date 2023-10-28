/*
  4K RAM, progam starts at 0x200
  Display is 64x32
  Display Buffer is in RAM at 0xF00
  Stack is at 0xEA0

  16 8bit registers V0, V1, ... VF
  Memory Address Register called I
  Stack instructions, so SP register
  2 Timers, one for delay, another for sound
*/

import { instructionSet, Instruction } from "./instructions.ts";
import fonts from "./fonts.ts";

export const KB = 1024
export const RAM_SIZE = 4 * KB
export const STACK_SIZE = 16
export const NUM_REGISTERS = 16 
export const DISPLAY_WIDTH = 64
export const DISPLAY_HEIGHT = 32
export const NUM_KEYS = 16
export const START_ADDRESS = 0x200

export interface IOInterface {
  render(framebuffer: Uint8Array): void,
  handleInput?(keys: Uint8Array): void,
}

export default class Chip8 {
  ram: Uint8Array;        // 4K RAM
  reg: Uint8Array;        // 16 8bit registers
  stack: Uint16Array;     // Stack has to store addresses, so 16bit

  display: Uint8Array;    // Framebuffer
  keys: Uint8Array;

  PC: number;             // 16bit Program counter
  IR: number = 0;         // 16 bit I register
  SP: number = -1;        // 16 bit stack pointer

  DT: number = 0;         // Delay Timer
  ST: number = 0;         // Sound Timer

  interface: IOInterface;

  constructor(io: IOInterface) {
    this.ram = new Uint8Array(RAM_SIZE)
    this.stack = new Uint16Array(STACK_SIZE)
    this.reg = new Uint8Array(NUM_REGISTERS)

    this.display = new Uint8Array(DISPLAY_HEIGHT * DISPLAY_WIDTH)
    this.keys = new Uint8Array(NUM_KEYS)

    this.PC = START_ADDRESS
    this.loadFonts()
    this.interface = io
  }

  loadFonts() {
    for (let i = 0; i < fonts.length; i++) this.ram[i] = fonts[i]
  }

  loadRom(data: Uint8Array) {
    this.reset()
    for (let i = 0; i < data.length; i++) this.ram[START_ADDRESS + i] = data[i]
  }

  reset() {
    this.ram.fill(0)
    this.reg.fill(0)
    
    this.display.fill(0)
    this.keys.fill(0)

    this.PC = START_ADDRESS
    this.loadFonts()
  }

  step() {
    // 1. Fetch the instruction at the current PC
    // 2. Decode the instruction
    // 3. Execture the instruction
    const op = this.fetch()
    this.PC += 2

    const {inst, args} = this.decode(op)
    this.execute(inst, args)
    
    this.interface.render(this.display)
  }

  run() {
    try {
      while (true) {
        this.step()
      }
    } catch (e) {
      console.log("Execution finished.")
    }
  }

  tick() {
    this.DT -= (this.DT > 0) ? 1 : 0
    this.ST -= (this.ST > 0) ? 1 : 0
  }

  fetch() {
    if (this.PC > RAM_SIZE) {
      this.debug()
      throw new Error('PC out of memory!')
    }

    const higher = this.ram[this.PC] << 8
    const lower = this.ram[this.PC + 1] << 0
    return higher | lower
  }

  decode(opcode: number) {
    /* 
      This could have been done way faster by 
      taking all the bits separately and using them 
      as a hashed key for an Map with all the instructions data
    */

    // Finds what the current instruction is
    const inst = instructionSet.find(i => (opcode & i.mask) === i.pattern)
    if (!inst || inst.name === '0nnn') {
      this.debug()
      throw new Error('Instruction not valid!')
    }

    // Extracts the instructions arguments
    const args = inst.args.map(arg => (opcode & arg.mask) >> arg.shift)

    return { inst, args }
  }

  execute(instruction: Instruction, args: number[]) {
    instruction.command(this, args)
  }

  debug() {
    console.log('Registers: ', this.reg)
    console.log('PC: ', this.PC)
    console.log('RAM: ', this.ram)
    console.log('Framebuffer: ', this.display)
  }
}