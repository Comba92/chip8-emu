import Chip8, { CPU_CLOCK, DISPLAY_HEIGHT, DISPLAY_WIDTH, TIMERS_CLOCK } from './emulator';

const DEFAULT_SCALE = 10
/*
  Keys order layout is:
  1 2 3 C     
  4 5 6 D  
  7 8 9 E  
  A 0 B F
  the keys array follows hexadecimal digits order (so 0 key, 1 key, 2 key, ... f key)
*/
const KEYS = ['x', '1', '2', '3', 'q', 'w', 'e', 'a', 's', 'd', 'z', 'c', '4', 'r', 'f', 'v']


export default class BrowserIO {
  emu: Chip8
  rom: Uint8Array | null = null
  canvas: CanvasRenderingContext2D
  scaling: number;
  frameID: number | null = null
  cpuDelay: number = 0
  timerDelay: number = 0
  sounds: OscillatorNode[] = []

  constructor(emu: Chip8) {
    this.emu = emu    
    this.scaling = DEFAULT_SCALE
    this.canvas = this.initCanvas()
    this.initRomManager()
    this.initKeyboard()
    this.initDOM()
  }

  draw() {
    for (let y=0; y<DISPLAY_HEIGHT; y++) {
      for (let x=0; x<DISPLAY_WIDTH; x++) {
        if (this.emu.display[y * DISPLAY_WIDTH + x] === 1) {
          this.canvas.fillStyle = 'black'
        } else {
          this.canvas.fillStyle = 'white'
        }

        this.canvas.fillRect(
          x * this.scaling, y * this.scaling,
          this.scaling, this.scaling
        )
      }
    }

    this.canvas.strokeRect(0, 0, DISPLAY_WIDTH*this.scaling, DISPLAY_HEIGHT*this.scaling)
  }

  loop(previousFrameTime: DOMHighResTimeStamp) {
    const currentFrameTime = performance.now()
    const dt = currentFrameTime - previousFrameTime

    this.timerDelay += dt
    if (this.timerDelay >= 1000 / TIMERS_CLOCK) {
      this.timerDelay -= 1000 / TIMERS_CLOCK
      this.emu.tick()
      if (this.emu.ST === 1) this.beep()
    }

    this.cpuDelay += dt
    if (this.cpuDelay >= 1000 / CPU_CLOCK) {
      this.cpuDelay -= 1000 / CPU_CLOCK
      this.emu.step()
      this.draw()
    }

    this.frameID = window.requestAnimationFrame(() => this.loop(currentFrameTime))
  }

  start() {
    this.frameID = window.requestAnimationFrame(() => this.loop(0))
  }

  stop() {
    window.cancelAnimationFrame(this.frameID!)
    this.frameID = null
  }

  beep() {
    const audio = new AudioContext()
    const oscillator = audio.createOscillator()
    const gain = audio.createGain()
    oscillator.type = 'triangle'
    oscillator.frequency.value = 400;
    gain.gain.value = 0.3
    oscillator.connect(gain)
    gain.connect(audio.destination)
    oscillator.start();

    setTimeout(function () {
      oscillator.stop();
    }, 250);
  }

  isRunning() {
    return this.frameID !== null
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



  initDOM() {
    const reset = document.getElementById('reset')
    reset?.addEventListener('click', () => {
      if (this.rom) this.emu.bootRom(this.rom)
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
    this.emu.bootRom(rom)
    this.start()
  }
}

