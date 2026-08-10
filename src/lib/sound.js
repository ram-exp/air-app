// Tiny Web Audio beep — no audio file assets needed. Plays a short two-tone
// chime, used for Pomodoro session transitions.
let ctx

function getCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function tone(audioCtx, freq, startTime, duration, gain = 0.15) {
  const osc = audioCtx.createOscillator()
  const g = audioCtx.createGain()
  osc.type = 'sine'
  osc.frequency.value = freq
  g.gain.setValueAtTime(0, startTime)
  g.gain.linearRampToValueAtTime(gain, startTime + 0.02)
  g.gain.exponentialRampToValueAtTime(0.001, startTime + duration)
  osc.connect(g)
  g.connect(audioCtx.destination)
  osc.start(startTime)
  osc.stop(startTime + duration)
}

export function playChime(kind = 'focus-done') {
  const audioCtx = getCtx()
  if (!audioCtx) return
  const now = audioCtx.currentTime
  if (kind === 'focus-done') {
    tone(audioCtx, 587.33, now, 0.22) // D5
    tone(audioCtx, 880, now + 0.16, 0.3) // A5
  } else {
    tone(audioCtx, 440, now, 0.2) // A4
    tone(audioCtx, 554.37, now + 0.14, 0.28) // C#5
  }
}

// Short upward blip for a good catch in the arcade minigame.
export function playCatch(comboLevel = 0) {
  const audioCtx = getCtx()
  if (!audioCtx) return
  const now = audioCtx.currentTime
  const base = 660 + Math.min(comboLevel, 8) * 40
  tone(audioCtx, base, now, 0.1, 0.12)
}

// Low buzz for hitting a distraction / losing a life.
export function playHit() {
  const audioCtx = getCtx()
  if (!audioCtx) return
  const now = audioCtx.currentTime
  tone(audioCtx, 180, now, 0.18, 0.16)
  tone(audioCtx, 140, now + 0.08, 0.2, 0.14)
}

// Little fanfare for a new high score.
export function playHighScore() {
  const audioCtx = getCtx()
  if (!audioCtx) return
  const now = audioCtx.currentTime
  tone(audioCtx, 523.25, now, 0.14, 0.14)
  tone(audioCtx, 659.25, now + 0.1, 0.14, 0.14)
  tone(audioCtx, 783.99, now + 0.2, 0.28, 0.16)
}
