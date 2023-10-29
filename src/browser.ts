import Chip8, { DISPLAY_HEIGHT, DISPLAY_WIDTH } from './emulator';

export interface IOInterface {}

const DEFAULT_SCALE = 10
const STEPS_PER_FRAME = 10
/*
  Keys order layout is:
  1 2 3 C     
  4 5 6 D  
  7 8 9 E  
  A 0 B F
  the keys array follows hexadecimal digits order (so 0 key, 1 key, 2 key, ... f key)
*/
const KEYS = ['x', '1', '2', '3', 'q', 'w', 'e', 'a', 's', 'd', 'z', 'c', '4', 'r', 'f', 'v']


export default class IOBrowser implements IOInterface {
  emu: Chip8
  rom: Uint8Array | null = null
  ctx: CanvasRenderingContext2D
  scaling: number;
  running: boolean = true;
  timerID: number | null = null

  constructor(emu: Chip8) {
    this.emu = emu    
    this.scaling = DEFAULT_SCALE
    this.ctx = this.initCanvas()
    this.initRomManager()
    this.initKeyboard()
    this.initUI()
  }

  draw() {
    for (let y=0; y<DISPLAY_HEIGHT; y++) {
      for (let x=0; x<DISPLAY_WIDTH; x++) {
        if (this.emu.display[y * DISPLAY_WIDTH + x] === 1) {
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

  render() {
    for (let i=0; i<STEPS_PER_FRAME; i++) this.emu.step()
    this.emu.tick()
    this.draw()

    this.timerID = window.requestAnimationFrame(() => this.render())
  }

  start() {
    if (!this.rom) return
    this.timerID = window.requestAnimationFrame(() => this.render())
  }

  stop() {
    window.cancelAnimationFrame(this.timerID!)
    this.timerID = null
  }

  isRunning() {
    return this.timerID !== null
  }

  initCanvas() {
    const screen = document.querySelector('canvas')!
    screen.width = DISPLAY_WIDTH *  this.scaling
    screen.height = DISPLAY_HEIGHT * this.scaling
    const ctx = screen.getContext('2d')!
    ctx.fillStyle = 'black'

    return ctx
  }

  initKeyboard() {
    window.addEventListener('keydown', (evt) => {
      const key = evt.key
      this.emu.keys[KEYS.indexOf(key)] = 1
    })

    window.addEventListener('keyup', (evt) => {
      const key = evt.key
      this.emu.keys[KEYS.indexOf(key)] = 0
    })
  }

  initUI() {
    const reset = document.getElementById('reset')
    reset?.addEventListener('click', () => {
      if (this.rom) this.emu.loadRomAndReset(this.rom)
    })

    const pause = document.getElementById('pause')
    pause?.addEventListener('click', (evt) => {
      const target = evt.target as HTMLTextAreaElement
      if (this.isRunning()) {
        target.textContent = 'Unpause ROM'
        this.stop()
      } else {
        target.textContent = 'Pause ROM'
        this.start()
      }
    }) 
  }

  initRomManager() {
    const uploader = document.getElementById('upload') as HTMLInputElement

    // If a file is already uploaded, load the rom instantly
    window.addEventListener('load', async() => {
      if (uploader.files && uploader.files.length > 0) 
        await this.loadRom(uploader.files[0])
    })

    // ROM uploaded by filemanager
    uploader.addEventListener('change', async (evt) => {
      const target = evt.target as HTMLInputElement
      if (target.files && target.files.length > 0)
        await this.loadRom(target.files[0])
    })

    // overwrite drag behaviour, so the browser doesn't ask for the file download
    window.addEventListener('dragover', (evt) => {
      evt.stopPropagation();
      evt.preventDefault();
      if (evt.dataTransfer)
        evt.dataTransfer.dropEffect = 'copy';
    })

    // ROM uploaded by dragging, only works if the file is 1 and ends with .ch8
    window.addEventListener('drop', async (evt) => {
      evt.stopPropagation()
      evt.preventDefault()
      if (evt.dataTransfer
        && evt.dataTransfer.files.length === 1
        && evt.dataTransfer.files[0].name.endsWith('.ch8')
      ) {
        uploader.files = evt.dataTransfer.files
        await this.loadRom(uploader.files[0])
      }
    })
  }

  async loadRom(file: File) {
    const loading = document.getElementById('loading') as HTMLTextAreaElement

    loading.textContent = 'Loading ROM...'
    const data = await file.arrayBuffer()
    const rom = new Uint8Array(data)
    loading.textContent = ''

    this.rom = rom
    this.emu.loadRomAndReset(rom)
    this.start()
  }
}

