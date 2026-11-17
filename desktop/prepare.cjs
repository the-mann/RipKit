const fs = require('node:fs')
const path = require('node:path')
const { execFileSync } = require('node:child_process')
const os = require('node:os')

async function main () {
  const dir = path.join(__dirname, 'tools')
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, 'yt-dlp.conf'), '--js-runtimes node\n')
  const windows = process.platform === 'win32'
  const ext = windows ? '.exe' : ''
  const asset = windows ? 'yt-dlp.exe' : 'yt-dlp_macos'
  const response = await fetch(`https://github.com/yt-dlp/yt-dlp/releases/latest/download/${asset}`)
  if (!response.ok) throw new Error(`yt-dlp download: ${response.status}`)
  fs.writeFileSync(path.join(dir, 'yt-dlp' + ext), Buffer.from(await response.arrayBuffer()))
  fs.copyFileSync(require('ffmpeg-static'), path.join(dir, 'ffmpeg' + ext))
  fs.copyFileSync(require('@ffprobe-installer/ffprobe').path, path.join(dir, 'ffprobe' + ext))
  // Ship a real Node executable for yt-dlp's JavaScript challenge runtime.
  const version = process.versions.node
  const archive = `node-v${version}-${windows ? 'win' : 'darwin'}-${process.arch}`
  const suffix = windows ? '.zip' : '.tar.gz'
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'ripkit-node-'))
  const download = await fetch(`https://nodejs.org/dist/v${version}/${archive}${suffix}`)
  if (!download.ok) throw new Error(`Node download: ${download.status}`)
  const file = path.join(temp, archive + suffix)
  fs.writeFileSync(file, Buffer.from(await download.arrayBuffer()))
  if (windows) execFileSync('tar', ['-xf', file, '-C', temp])
  else execFileSync('tar', ['-xzf', file, '-C', temp])
  fs.copyFileSync(path.join(temp, archive, windows ? 'node.exe' : 'bin/node'), path.join(dir, 'node' + ext))
  if (!windows) for (const name of ['yt-dlp', 'ffmpeg', 'ffprobe', 'node']) fs.chmodSync(path.join(dir, name), 0o755)
  fs.rmSync(temp, { recursive: true, force: true })
}
main().catch((err) => { console.error(err); process.exit(1) })
