import IOBrowser from "./browser"
import Chip8 from "./emulator"

const io = new IOBrowser()
const emu = new Chip8(io)

const uploader = document.getElementById('upload')! as HTMLInputElement
if (uploader.files && uploader.files.length > 0) await loadRom(uploader.files[0])


uploader.addEventListener('change', async (evt) => {
  const target = evt.target as HTMLInputElement
  if (target.files && target.files.length > 0)
    await loadRom(target.files[0])
})

window.addEventListener('dragover', (evt) => {
  evt.stopPropagation();
  evt.preventDefault();
  if (evt.dataTransfer)
    evt.dataTransfer.dropEffect = 'copy';
})

window.addEventListener('drop', async (evt) => {
  evt.stopPropagation()
  evt.preventDefault()
  if (evt.dataTransfer
    && evt.dataTransfer.files.length === 1
    && evt.dataTransfer.files[0].name.endsWith('.ch8')
  ) {
    uploader.files = evt.dataTransfer.files
    await loadRom(uploader.files[0])
  }
})

async function loadRom(file: File) {
  const data = await file.arrayBuffer()
  const rom = new Uint8Array(data)
  
  emu.loadRom(rom)
  for (let i=0; i<500; i++)
    emu.step()
}