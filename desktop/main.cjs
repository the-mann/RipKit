const { app, BrowserWindow, dialog } = require('electron')
const fs = require('node:fs')
const path = require('node:path')
const { execFileSync } = require('node:child_process')

let server
app.whenReady().then(async () => {
  const root = path.resolve(__dirname, '..')
  const tools = app.isPackaged ? path.join(process.resourcesPath, 'tools') : path.join(root, 'desktop', 'tools')
  const ext = process.platform === 'win32' ? '.exe' : ''
  const data = app.getPath('userData')
  fs.mkdirSync(path.join(data, 'work'), { recursive: true })
  process.chdir(path.join(data, 'work'))
  process.env.PATH = tools + path.delimiter + process.env.PATH
  process.env.RIPKIT_YTDLP = path.join(tools, 'yt-dlp' + ext)
  process.env.RIPKIT_NODE = path.join(tools, 'node' + ext)
  process.env.ALLOW_SERVER_DOWNLOADS = 'true'
  process.env.DOWNLOAD_DIR = path.join(app.getPath('downloads'), 'RipKit')
  process.env.STAGE_DIR = path.join(data, 'staging')
  process.env.ZIP_DIR = path.join(app.getPath('downloads'), 'RipKit', 'ZIPs')
  if (process.argv.includes('--smoke-test')) {
    for (const [name, args] of [['yt-dlp', ['--version']], ['ffmpeg', ['-version']], ['ffprobe', ['-version']], ['node', ['--version']]]) {
      execFileSync(path.join(tools, name + ext), args, { timeout: 30000 })
    }
  }
  const backend = require(path.join(root, 'server.js')).app
  server = backend.listen(0, '127.0.0.1', async () => {
    const url = `http://127.0.0.1:${server.address().port}`
    if (process.argv.includes('--smoke-test')) {
      const response = await fetch(url + '/destination')
      if (!response.ok || !(await response.json()).allowServerDownloads) app.exit(1)
      else { console.log('Desktop smoke test passed'); app.exit(0) }
      return
    }
    const win = new BrowserWindow({ width: 1100, height: 850, webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true } })
    win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
    win.webContents.on('will-navigate', (event, target) => { if (new URL(target).origin !== url) event.preventDefault() })
    win.webContents.session.on('will-download', (_event, item) => {
      item.setSaveDialogOptions({ defaultPath: path.join(app.getPath('downloads'), item.getFilename()) })
    })
    await win.loadURL(url)
  })
  server.on('error', (err) => { dialog.showErrorBox('RipKit could not start', err.message); app.quit() })
}).catch((err) => { dialog.showErrorBox('RipKit could not start', err.message); app.exit(1) })
app.on('window-all-closed', () => app.quit())
app.on('before-quit', () => server?.close())
