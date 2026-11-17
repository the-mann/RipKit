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
        <div className='export-demo__cursor' aria-hidden='true'>➤</div>
        {step >= 1 && <div className='export-demo__menu' aria-hidden='true'>
          <div>Export a playlist to a file <span>▸</span></div>
          {step >= 2 && <div className='export-demo__submenu'>Export a playlist to a file (*.txt)</div>}
        </div>}
        {step === 3 && <div className='export-demo__file' aria-hidden='true'>▤ playlist.txt <span>↓ Drop into RipKit</span></div>}
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
