import { DISPLAY_HEIGHT, DISPLAY_WIDTH, IOInterface } from './emulator';

const DEFAULT_SCALE = 10

export default class IOBrowser implements IOInterface {
  ctx: CanvasRenderingContext2D
  scaling: number;
  drawed: number = 0

  constructor() {
    const screen = document.querySelector('canvas')!
    this.scaling = DEFAULT_SCALE
    screen.width = DISPLAY_WIDTH *  this.scaling
    screen.height = DISPLAY_HEIGHT * this.scaling
    this.ctx = screen.getContext('2d')!
    this.ctx.fillStyle = 'black'
  }

  render(framebuffer: Uint8Array) {
    for (let y=0; y<DISPLAY_HEIGHT; y++) {
      for (let x=0; x<DISPLAY_WIDTH; x++) {
        if (framebuffer[y * DISPLAY_WIDTH + x] === 1) {
          this.ctx.fillStyle = 'black'
        } else {
          this.ctx.fillStyle = 'white'
        }

        this.ctx.fillRect(
          x * this.scaling, y * this.scaling,
          this.scaling, this.scaling
        )
      }
    }

    this.ctx.strokeRect(0, 0, DISPLAY_WIDTH*this.scaling, DISPLAY_HEIGHT*this.scaling)
  }
}

