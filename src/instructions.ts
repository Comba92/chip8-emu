import Chip8, { NUM_KEYS } from "./emulator.ts"
import { DISPLAY_WIDTH, DISPLAY_HEIGHT } from "./emulator.ts"

export interface Operand {
  mask: number, shift: number
}

export interface Instruction {
  name?: string
  description?: string,
  mask: number,
  pattern: number,
  args: Operand[],
  command: (cpu: Chip8, args: number[]) => void
}

export const operandTypes = {
  nnn:  { mask: 0x0fff, shift: 0 },
  kk:   { mask: 0x00ff, shift: 0 },
  n:    { mask: 0x000f, shift: 0 },
  x:    { mask: 0x0f00, shift: 8 },
  y:    { mask: 0x00f0, shift: 4 },
}

function rand() {
  return Math.floor( Math.random() * 255 )
}

export const instructionSet: Instruction[] = [
  { 
    name: '00E0',
    description: 'CLS', 
    mask: 0xffff, pattern: 0x00e0, 
    args: [],
    command: (cpu, _) => cpu.display.fill(0)
  },
  { 
    name: '00EE',
    description: 'RET', 
    mask: 0xffff, pattern: 0x00ee, 
    args: [],
    command: (cpu, _) => {
      cpu.PC = cpu.stack[cpu.SP--]
    }
  },
  { 
    name: '0nnn',
    description: 'SYS addr', 
    mask: 0xf000, pattern: 0x0000,
    args: [operandTypes.nnn],
    command: () => null
  },
  { 
    name: '1nnn',
    description: 'JP addr',
    mask: 0xf000, pattern: 0x1000,
    args: [operandTypes.nnn],
    command: (cpu, args) => cpu.PC = args[0]
  },
  {
    name: '2nnn',
    description: 'CALL addr',
    mask: 0xf000, pattern: 0x2000,
    args: [operandTypes.nnn],
    command: (cpu, args) => {
      cpu.stack[++cpu.SP] = cpu.PC
      cpu.PC = args[0]
    }
  },
  {
    name: '3xkk',
    description: 'SE Vx, byte',
    mask: 0xf000, pattern: 0x3000,
    args: [operandTypes.x, operandTypes.kk],
    command: (cpu, args) => cpu.PC += (cpu.reg[args[0]] === args[1]) ? 2 : 0
  },
  {
    name: '4xkk',
    description: 'SNE Vx, byte',
    mask: 0xf000, pattern: 0x4000,
    args: [operandTypes.x, operandTypes.kk],
    command: (cpu, args) => cpu.PC += (cpu.reg[args[0]] !== args[1]) ? 2 : 0
  },
  {
    name: '5xy0',
    description: 'SE Vx, Vy',
    mask: 0xf000, pattern: 0x5000,
    args: [operandTypes.x, operandTypes.y],
    command: (cpu, args) => cpu.PC += (cpu.reg[args[0]] === cpu.reg[args[1]]) ? 2 : 0
  },
  {
    name: '6xkk',
    description: 'LD Vx, byte',
    mask: 0xf000, pattern: 0x6000,
    args: [operandTypes.x, operandTypes.kk],
    command: (cpu, args) => cpu.reg[args[0]] = args[1]
  },
  {
    name: '7xkk',
    description: 'ADD Vx, Byte',
    mask: 0xf000, pattern: 0x7000,
    args: [operandTypes.x, operandTypes.kk],
    command: (cpu, args) => cpu.reg[args[0]] += args[1]
  },
  {
    name: '8xy0',
    description: 'LD Vx, Vy',
    mask: 0xf00f, pattern: 0x8000,
    args: [operandTypes.x, operandTypes.y],
    command: (cpu, args) => cpu.reg[args[0]] = cpu.reg[args[1]]
  },
  {
    name: '8xy1',
    description: 'OR Vx, Vy',
    mask: 0xf00f, pattern: 0x8001,
    args: [operandTypes.x, operandTypes.y],
    command: (cpu, args) => cpu.reg[args[0]] |= cpu.reg[args[1]]
  },
  {
    name: '8xy2',
    description: 'AND Vx, Vy',
    mask: 0xf00f, pattern: 0x8002,
    args: [operandTypes.x, operandTypes.y],
    command: (cpu, args) => cpu.reg[args[0]] &= cpu.reg[args[1]]
  },
  {
    name: '8xy3',
    description: 'XOR Vx, Vy',
    mask: 0xf00f, pattern: 0x8003,
    args: [operandTypes.x, operandTypes.y],
    command: (cpu, args) => cpu.reg[args[0]] ^= cpu.reg[args[1]]
  },
  {
    name: '8xy4',
    description: 'ADD Vx, Vy',
    mask: 0xf00f, pattern: 0x8004,
    args: [operandTypes.x, operandTypes.y],
    command: (cpu, args) => {
      const vx = cpu.reg[args[0]]
      const vy = cpu.reg[args[1]]

      cpu.reg[args[0]] += vy
      cpu.reg[0xf] = (vx + vy > 255) ? 1 : 0
    }
  },
  {
    name: '8xy5',
    description: 'SUB Vx, Vy',
    mask: 0xf00f, pattern: 0x8005,
    args: [operandTypes.x, operandTypes.y],
    command: (cpu, args) => {
      const vx = cpu.reg[args[0]]
      const vy = cpu.reg[args[1]]

      cpu.reg[args[0]] -= vy
      cpu.reg[0xf] = (vx > vy) ? 1 : 0
    }
  },
  {
    name: '8xy6',
    description: 'SHR Vx, Vy',
    mask: 0xf00f, pattern: 0x8006,
    args: [operandTypes.x, operandTypes.y],
    command: (cpu, args) => {
      const vx = cpu.reg[args[0]]
      const vy = cpu.reg[args[1]]
      
      cpu.reg[args[0]] = vx >> 1
      cpu.reg[0xf] = vx & 0x0001
    }
  },
  {
    name: '8xy7',
    description: 'SUBN Vx, Vy',
    mask: 0xf00f, pattern: 0x8007,
    args: [operandTypes.x, operandTypes.y],
    command: (cpu, args) => {
      const vx = cpu.reg[args[0]]
      const vy = cpu.reg[args[1]]

      cpu.reg[args[0]] = vy - vx
      cpu.reg[0xf] = (vy > vx) ? 1 : 0
    }
  },
  {
    name: '8xyE',
    description: 'SHL Vx, Vy',
    mask: 0xf00f, pattern: 0x800e,
    args: [operandTypes.x, operandTypes.y],
    command: (cpu, args) => {
      const vx = cpu.reg[args[0]]
      const vy = cpu.reg[args[1]]

      cpu.reg[args[0]] = vx << 1
      cpu.reg[0xf] = (vx >> 7) & 0x0001
    }
  },
  {
    name: '9xy0',
    description: 'SNE Vx, Vy',
    mask: 0xf000, pattern: 0x9000,
    args: [operandTypes.x, operandTypes.y],
    command: (cpu, args) => cpu.PC += (cpu.reg[args[0]] !== cpu.reg[args[1]]) ? 2 : 0
  },
  {
    name: 'Annn',
    description: 'LD I, addr',
    mask: 0xf000, pattern: 0xa000,
    args: [operandTypes.nnn],
    command: (cpu, args) => cpu.IR = args[0]
  },
  {
    name: 'Bnnn',
    description: 'JP V0, addr',
    mask: 0xf000, pattern: 0xb000,
    args: [operandTypes.nnn],
    command: (cpu, args) => cpu.PC = args[0] + cpu.reg[0]
  },
  {
    name: 'Cxkk',
    description: 'RND Vx, byte',
    mask: 0xf000, pattern: 0xc000,
    args: [operandTypes.x, operandTypes.kk],
    command: (cpu, args) => cpu.reg[args[0]] = rand() & args[1]
  },
  {
    name: 'Dxyn',
    description: 'DRW Vx, Vy, n',
    mask: 0xf000, pattern: 0xd000,
    args: [operandTypes.x, operandTypes.y, operandTypes.n],
    command: (cpu, args) => {
      const vx  = cpu.reg[args[0]]
      const vy  = cpu.reg[args[1]]
      const n   = args[2]

      let flipped = false
      for (let row=0; row<n; row++) {
        const byte = cpu.ram[cpu.IR + row]

        for (let col=0; col<8; col++) {
          const bit = (byte & (0b1000_0000 >> col))
          if (bit === 0) continue

          const x = (vx + col) % DISPLAY_WIDTH
          const y = (vy + row) % DISPLAY_HEIGHT
          const i = y * DISPLAY_WIDTH + x

          flipped = flipped || (cpu.display[i] === 1 ? true : false)
          cpu.display[i] ^= 1
        }
      }

      cpu.reg[0xf] = Number(flipped)
    }
  },
  {
    name: 'Ex9E',
    description: 'SKP Vx',
    mask: 0xf0ff, pattern: 0xe09e,
    args: [operandTypes.x],
    command: (cpu, args) => cpu.PC += ( cpu.keys[ cpu.reg[args[0]] ] ) ? 2 : 0
  },
  {
    name: 'ExA1',
    description: 'SKNP Vx',
    mask: 0xf0ff, pattern: 0xe0a1,
    args: [operandTypes.x],
    command: (cpu, args) => cpu.PC += ( !cpu.keys[ cpu.reg[args[0]] ] ) ? 2 : 0
  },
  {
    name: 'Fx07',
    description: 'LD Vx, DT',
    mask: 0xf0ff, pattern: 0xf007,
    args: [operandTypes.x],
    command: (cpu, args) => cpu.reg[args[0]] = cpu.DT
  },
  {
    // FIXME: this restarts execution AFTER the key is released. Timers needed
    name: 'Fx0A',
    description: 'LD Vx, K',
    mask: 0xf0ff, pattern: 0xf00a,
    args: [operandTypes.x],
    command: (cpu, args) => {
      let pressed = false
      for (let i = 0; i<NUM_KEYS; i++) {
        if (cpu.keys[i] === 1) {
          cpu.reg[args[0]] = i
          pressed = true
          break
        }
      }

      if (!pressed) cpu.PC -= 2 
    }
  },
  {
    name: 'Fx15',
    description: 'LD DT, Vx',
    mask: 0xf0ff, pattern: 0xf015,
    args: [operandTypes.x],
    command: (cpu, args) => cpu.DT = cpu.reg[args[0]]
  },
  {
    name: 'Fx18',
    description: 'LD ST, Vx',
    mask: 0xf0ff, pattern: 0xf018,
    args: [operandTypes.x],
    command: (cpu, args) => cpu.ST = cpu.reg[args[0]]
  },
  {
    name: 'Fx1E',
    description: 'ADD I, Vx',
    mask: 0xf0ff, pattern: 0xf01e,
    args: [operandTypes.x],
    command: (cpu, args) => cpu.IR += cpu.reg[args[0]]
  },
  {
    name: 'Fx29',
    description: 'LD F, Vx',
    mask: 0xf0ff, pattern: 0xf029,
    args: [operandTypes.x],
    // each font has size 5
    command: (cpu, args) => cpu.IR = cpu.reg[args[0]] * 5
  },
  {
    name: 'Fx33',
    description: 'LD B, Vx',
    mask: 0xf0ff, pattern: 0xf033,
    args: [operandTypes.x],
    command: (cpu, args) => {
      const digits = String(cpu.reg[args[0]])
        .split('')
        .map(d => Number(d))
      cpu.ram[cpu.IR    ] = digits[0] ?? 0
      cpu.ram[cpu.IR + 1] = digits[1] ?? 0
      cpu.ram[cpu.IR + 2] = digits[2] ?? 0
    }
  },
  {
    name: 'Fx55',
    description: 'LD I, Vx',
    mask: 0xf0ff, pattern: 0xf055,
    args: [operandTypes.x],
    command: (cpu, args) => {
      for(let i=0; i<=args[0]; i++) cpu.ram[cpu.IR + i] = cpu.reg[i]
    }
  },
  {
    name: 'Fx65',
    description: 'LD Vx, I',
    mask: 0xf0ff, pattern: 0xf065,
    args: [operandTypes.x], 
    command: (cpu, args) => {
      for (let i = 0; i<=args[0]; i++) cpu.reg[i] = cpu.ram[cpu.IR + i]
    }
  }
]
