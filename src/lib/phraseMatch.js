// Normalizes a phrase for loose matching: lowercase, strip accents/punctuation,
// collapse whitespace. "Hei, Jarvis!" and "hei   jarvis" both become "hei jarvis".
export function normalizePhrase(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// True if `transcript` contains any of `phrases` as a substring, after
// normalizing both sides. Empty/blank phrases are ignored.
export function containsAnyPhrase(transcript, phrases) {
  const t = normalizePhrase(transcript)
  if (!t) return false
  return (phrases || []).some((p) => {
    const np = normalizePhrase(p)
    return np && t.includes(np)
  })
}

// Given the assistant's current display name (e.g. "JARVIS" or a renamed
// "Nova"), returns the set of wake phrases the background listener should
// match against. Covers both the Indonesian "hei" and English "hey" forms so
// "Hey Nova" and "Hei Nova" both work regardless of which one is saved as
// the "official" wakeWord string.
export function getWakePhrases(assistantName) {
  const name = (assistantName || '').trim().toLowerCase()
  if (!name) return []
  return [`hei ${name}`, `hey ${name}`]
}

// Splits a comma/newline-separated settings string into a clean phrase list.
export function parsePhraseList(text) {
  return (text || '')
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
}
