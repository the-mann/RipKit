const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { execFileSync } = require('node:child_process')
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ripkit-single-'))
process.env.DOWNLOAD_DIR = dir
process.env.ALLOW_SERVER_DOWNLOADS = 'true'
const sample = path.join(dir, 'sample.mp3')
execFileSync('ffmpeg',['-y','-v','quiet','-f','lavfi','-i','anullsrc=r=44100:cl=stereo','-t','0.1',sample])
let fail = false
let calls = []
const downloader = async () => ({title:'Test / Track',uploader:'Test Artist'})
downloader.exec = (url, opts) => {
  calls.push({url, opts})
  if (fail) return Promise.reject(new Error('Unavailable'))
  fs.copyFileSync(sample,opts.output.replace('%(ext)s','mp3'))
  return Promise.resolve()
}
require.cache[require.resolve('youtube-dl-exec')] = {exports:downloader}
const { app } = require('./server')
async function main () {
  const server = app.listen(0)
  await new Promise(resolve => server.once('listening',resolve))
  const base = `http://localhost:${server.address().port}`
  const post = sourceUrl => fetch(base+'/single',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({sourceUrl,format:'mp3',quality:'0'})})
  async function settled () {
    for(let i=0;i<100;i++) {
      const d=await (await fetch(base+'/single')).json()
      if(d.download.status!=='running') return d.download
      await new Promise(resolve=>setTimeout(resolve,20))
    }
    throw new Error('Timeout')
  }
  try {
    assert.equal((await post('https://example.com')).status,400)
    const link='https://youtu.be/_2pbU12cXbs?si=tracking'
    assert.equal((await post(link)).status,202)
    const first=await settled()
    assert.equal(first.status,'done')
    assert.equal(path.dirname(first.file),path.join(dir,'Catch All'))
    assert.equal(calls[0].url,'https://www.youtube.com/watch?v=_2pbU12cXbs')
    assert.equal((await (await fetch(base+'/job')).json()).job,null,'Must not replace playlist job')
    assert.equal((await post(link)).status,202)
    const second=await settled()
    assert.equal(second.status,'done')
    assert.notEqual(first.file,second.file)
    assert.ok(fs.existsSync(first.file))
    fail=true
    assert.equal((await post(link)).status,202)
    assert.equal((await settled()).status,'failed')
    assert.equal(fs.readdirSync(path.join(dir,'Catch All')).length,2,'Scratch files must be cleaned up')
    console.log('One-off download, metadata, filenames, isolation and failure checks pass')
  } finally {await new Promise(resolve=>server.close(resolve));fs.rmSync(dir,{recursive:true,force:true})}
}
main().catch(err=>{console.error(err);process.exitCode=1})
