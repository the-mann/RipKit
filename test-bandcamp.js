const assert = require('assert')
const { bandcampUrl, bandcampTrackFields, encodeMp3At320k } = require('./server')
const { execFileSync } = require('child_process')
const fs = require('fs')
const os = require('os')
const path = require('path')

assert.equal(
  bandcampUrl('https://artist.bandcamp.com/album/the-record?from=discover'),
  'https://artist.bandcamp.com/album/the-record?from=discover'
)
assert.equal(
  bandcampUrl('https://artist.bandcamp.com/track/the-single'),
  'https://artist.bandcamp.com/track/the-single'
)

for (const invalid of [
  '',
  'https://artist.bandcamp.com/merch/t-shirt',
  'https://example.com/album/the-record',
  'file:///Users/marcusmann/Music/song.mp3'
]) {
  assert.throws(() => bandcampUrl(invalid), /Bandcamp/)
}

console.log('Bandcamp track and album URL validation passes')

assert.deepEqual(bandcampTrackFields({ title: 'Artist - Track', artist: 'Artist', album: 'Album', track_number: 3 }), {
  title: 'Track', artist: 'Artist', album: 'Album', year: '', genre: '', art: '', number: 3
})
console.log('Bandcamp metadata is normalized for YouTube lookup')

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ripkit-bandcamp-'))
const source = path.join(dir, 'source.mp3')
execFileSync('ffmpeg', ['-y', '-v', 'error', '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo', '-t', '0.1', '-b:a', '128k', source])
encodeMp3At320k(source)
const probe = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'a:0', '-show_entries', 'stream=bit_rate', '-of', 'default=noprint_wrappers=1:nokey=1', source], { encoding: 'utf8' })
assert.ok(Number(probe.trim()) >= 319000, `Expected ~320k MP3, got ${probe.trim()}`)
fs.rmSync(dir, { recursive: true, force: true })
console.log('Bandcamp 320 kbps MP3 conversion passes')
