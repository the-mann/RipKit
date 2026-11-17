import { useEffect, useState } from 'react'

const captions = [
  'Right-click the playlist name in Rekordbox’s left sidebar.',
  'Choose “Export a playlist to a file”.',
  'Choose “Export a playlist to a file (*.txt)”.',
  'Save the TXT file, then drag it into RipKit.'
]

export default function ExportWalkthrough () {
  const [playing, setPlaying] = useState(false)
  const [step, setStep] = useState(0)
  useEffect(() => {
    if (!playing) return
    const timer = setTimeout(() => {
      if (step === captions.length - 1) setPlaying(false)
      else setStep(step + 1)
    }, 2600)
    return () => clearTimeout(timer)
  }, [playing, step])
  const start = () => { setStep(0); setPlaying(true) }
  return (
    <figure className='export-demo'>
      <div className={`export-demo__screen step-${step}`}>
        <img src='/guide/rekordbox.png' alt='Rekordbox with a playlist selected in the left sidebar' />
        <div className='export-demo__focus' />
        <svg className='export-demo__cursor' viewBox='0 0 24 32' aria-hidden='true'><path d='M2 2v23l6-6 5 11 4-2-5-10h9Z' fill='white' stroke='#111' strokeWidth='1.7' strokeLinejoin='round'/></svg>
        {step >= 1 && step < 3 && <div className='export-demo__menu' aria-hidden='true'>
          <div className='rb-menu-row rb-menu-muted'>Export Playlist <span>▶</span></div>
          <div className='rb-menu-row rb-menu-muted'>Import Playlist</div>
          <div className='rb-menu-rule' />
          <div className='rb-menu-row'>Create New Playlist</div>
          <div className='rb-menu-row'>Create New Intelligent Playlist</div>
          <div className='rb-menu-row'>Create New Folder</div>
          <div className='rb-menu-row'>Delete Playlist</div>
          <div className='rb-menu-rule' />
          <div className='rb-menu-row'>Renumber Track Order</div>
          <div className='rb-menu-row rb-menu-selected'>Export a playlist to a file <span>▶</span>
            {step >= 2 && <div className='export-demo__submenu'>
              <div className='rb-menu-row rb-menu-selected'>Export a playlist to a file (*.txt)</div>
              <div className='rb-menu-row'>Export a playlist to a file for music apps (*.m3u8)</div>
            </div>}
          </div>
        </div>}
        {step === 3 && <div className='export-demo__file' aria-hidden='true'><div className='rb-save-title'>Export a playlist to a file</div><label>Save As: <span>playlist.txt</span></label><div className='rb-save-footer'><span>TXT playlist</span><b>Save</b></div></div>}
        {!playing && <button type='button' className='export-demo__play' onClick={start} aria-label='Play Rekordbox TXT export walkthrough'>▶ <span>{step === 3 ? 'Replay guide' : 'Watch how to export'}</span></button>}
      </div>
      <figcaption>
        <span aria-live='polite'>{step + 1} / 4 · {captions[step]}</span>
        <button type='button' onClick={() => step === 3 && !playing ? start() : setPlaying(!playing)}>{playing ? 'Pause' : step === 3 ? 'Replay' : 'Play'}</button>
      </figcaption>
      <div className='export-demo__steps' aria-label='Walkthrough steps'>
        {captions.map((caption, index) => <button type='button' key={caption} aria-label={caption} aria-pressed={step === index} onClick={() => { setStep(index); setPlaying(false) }}>{index + 1}</button>)}
      </div>
      <small>Illustrated guide · Menus are demonstrated over a Rekordbox screenshot.</small>
    </figure>
  )
}
