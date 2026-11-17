const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')
const { parseCsv } = require('./server')
async function main () {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'ripkit-playlists-'))
  try {
    const tsv = '#\tArtwork\tTrack Title\tArtist\tAlbum\tGenre\tDate Added\r\n1\t\tBjörk, "Live"\tDJ Test\tAlbum\tTechno\t2026-10-31\r\n\r\n'
    const le = Buffer.concat([Buffer.from([255, 254]), Buffer.from(tsv, 'utf16le')])
    const cases = [le, Buffer.concat([Buffer.from([254, 255]), Buffer.from(tsv, 'utf16le').swap16()]), Buffer.from('\uFEFF' + tsv)]
    for (const [i, bytes] of cases.entries()) {
      const file = path.join(dir, `${i}.txt`)
      await fs.writeFile(file, bytes)
      const tracks = await parseCsv(file)
      assert.equal(tracks.length, 1)
      assert.equal(tracks[0].title, 'Björk, "Live"')
      assert.equal(tracks[0].artist, 'DJ Test')
      assert.equal(tracks[0].genre, 'Techno')
      assert.equal(tracks[0].year, '')
    }
    const file = path.join(dir, 'playlist.csv')
    await fs.writeFile(file, '\uFEFFTitle,Artist,Album\n"Hello, World",Test,Record\n')
    assert.equal((await parseCsv(file))[0].title, 'Hello, World')
    await fs.writeFile(file, Buffer.from([255, 254, 9, 0]))
    assert.deepEqual(await parseCsv(file), [])
    console.log('Playlist encoding, column mapping, blank export and CSV regression checks pass')
  } finally { await fs.rm(dir, { recursive: true, force: true }) }
}
main().catch(err => { console.error(err); process.exitCode = 1 })
