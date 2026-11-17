const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ripkit-override-'))
process.env.STAGE_DIR = path.join(dir, 'stage')
let searched = 0
require.cache[require.resolve('yt-search')] = { exports: async () => { searched++; return { videos: [] } } }
const downloaded = []
let fail = false
const ytdl = require('youtube-dl-exec')
ytdl.exec = (url, opts) => {
  downloaded.push(url)
  if (fail) return Promise.reject(new Error('Test download failed'))
  fs.writeFileSync(opts.output.replace('%(ext)s', 'mp3'), 'replacement audio')
  return Promise.resolve()
}
global.fetch = async () => ({ json: async () => ({ results: [] }) })
const { app, youtubeUrl, applyOverrides } = require('./server')
const http = require('node:http')
function request (port, route, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const r = http.request({ port, path: route, method: data ? 'POST' : 'GET', headers }, res => {
      let text = ''; res.on('data', chunk => { text += chunk }); res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(text) }))
    }); r.on('error', reject); r.end(data)
  })
}
async function main () {
  const link = 'https://youtu.be/_2pbU12cXbs?si=65VGqcNXYxXpmAdU'
  const normalized = 'https://www.youtube.com/watch?v=_2pbU12cXbs'
  assert.equal(youtubeUrl(link), normalized)
  assert.equal(youtubeUrl('https://music.youtube.com/watch?v=_2pbU12cXbs&list=foo'), normalized)
  for (const bad of ['https://example.com/watch?v=_2pbU12cXbs', 'file:///etc/passwd', 'https://youtube.com/playlist?list=foo', 'garbage']) assert.throws(() => youtubeUrl(bad))
  assert.throws(() => applyOverrides([{}], '{"99":"'+link+'"}'))
  const server = app.listen(0)
  await new Promise(resolve => server.once('listening', resolve))
  const port = server.address().port
  async function settled () {
    for (let i = 0; i < 100; i++) {
      const d = (await request(port, '/job')).body
      if (d.job.status !== 'running') return d
      await new Promise(resolve => setTimeout(resolve, 20))
    }
    throw new Error('Job timed out')
  }
  const post = (route, obj) => request(port, route, JSON.stringify(obj), { 'content-type': 'application/json' })
  try {
    const boundary = 'ripkit-test-boundary'
    const data = `--${boundary}\r\nContent-Disposition: form-data; name="csv"; filename="tracks.csv"\r\nContent-Type: text/csv\r\n\r\nTitle,Artist,Album\nMatched,Artist,Record\nUnmatched,Artist,Record\n\r\n--${boundary}\r\nContent-Disposition: form-data; name="overrides"\r\n\r\n${JSON.stringify({0: link})}\r\n--${boundary}--\r\n`
    assert.equal((await request(port, '/upload', data, { 'content-type': `multipart/form-data; boundary=${boundary}` })).status, 202)
    let job = await settled()
    assert.equal(job.tracks[0].status, 'done')
    assert.equal(job.tracks[1].status, 'failed')
    assert.equal(searched, 1, 'Override must bypass search')
    assert.equal(downloaded[0], normalized)
    assert.equal((await post('/tracks/1/retry', {sourceUrl:'https://evil.com'})).status, 400)
    assert.equal((await post('/tracks/1/retry', {sourceUrl:link})).status, 202)
    job = await settled()
    assert.equal(job.tracks[1].status, 'done', 'Unmatched row should be recoverable')
    assert.equal(job.job.result.files, 2)
    fail = true
    assert.equal((await post('/tracks/0/retry', {sourceUrl:link})).status, 202)
    job = await settled()
    assert.equal(job.tracks[0].status, 'done', 'Failed replacement should preserve previous track')
    assert.match(job.tracks[0].detail, /kept previous audio/)
    assert.equal(fs.readFileSync(path.join(dir,'stage',job.job.id,'Matched.mp3'),'utf8'), 'replacement audio')
    console.log('YouTube override and unmatched-track retry checks pass')
  } finally { await new Promise(resolve => server.close(resolve)); fs.rmSync(dir,{recursive:true,force:true}) }
}
main().catch(err=>{console.error(err);process.exitCode=1})
