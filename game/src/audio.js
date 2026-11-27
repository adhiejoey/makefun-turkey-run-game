// All sound is synthesised with WebAudio: no audio files, no network, and the
// whole soundtrack is a few dozen lines of oscillators. The context is created
// lazily on the first user gesture, so a silent page load stays silent.
export function createSound() {
  let ctx = null;
  let muted = false;
  try {
    muted = window.localStorage.getItem('gobble-and-gone.muted') === '1';
  } catch {
    muted = false;
  }

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type, vol, slideTo) {
    if (muted) return;
    const ac = ensure();
    if (!ac) return;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    const now = ac.currentTime;
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), now + dur);
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    osc.connect(gain).connect(ac.destination);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  }

  function noise(dur, vol, low) {
    if (muted) return;
    const ac = ensure();
    if (!ac) return;
    const len = Math.floor(ac.sampleRate * dur);
    const buffer = ac.createBuffer(1, len, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ac.createBufferSource();
    src.buffer = buffer;
    const filter = ac.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = low || 900;
    const gain = ac.createGain();
    gain.gain.value = vol;
    src.connect(filter).connect(gain).connect(ac.destination);
    src.start();
  }

  return {
    get muted() {
      return muted;
    },
    toggleMute() {
      muted = !muted;
      try {
        window.localStorage.setItem('gobble-and-gone.muted', muted ? '1' : '0');
      } catch {
        // storage off: mute lasts this visit only
      }
      return muted;
    },
    unlock() {
      ensure();
    },
    // The turkey's signature: three quick descending gobbles.
    gobble() {
      tone(320, 0.09, 'sawtooth', 0.12, 180);
      setTimeout(() => tone(300, 0.09, 'sawtooth', 0.12, 170), 90);
      setTimeout(() => tone(260, 0.16, 'sawtooth', 0.14, 120), 180);
    },
    jump() {
      tone(280, 0.18, 'sine', 0.16, 620);
    },
    slide() {
      noise(0.16, 0.1, 500);
    },
    corn() {
      tone(880, 0.07, 'triangle', 0.14);
      setTimeout(() => tone(1318, 0.1, 'triangle', 0.14), 70);
    },
    feather() {
      [660, 880, 1100, 1320].forEach((f, i) => setTimeout(() => tone(f, 0.1, 'triangle', 0.13), i * 60));
    },
    dodge() {
      tone(520, 0.08, 'square', 0.07, 780);
    },
    hide() {
      tone(180, 0.25, 'sine', 0.1, 90);
    },
    hit() {
      noise(0.22, 0.22, 700);
      tone(140, 0.3, 'sawtooth', 0.18, 55);
    },
    caught() {
      [392, 370, 349, 311].forEach((f, i) => setTimeout(() => tone(f, 0.28, 'sawtooth', 0.14), i * 180));
    },
    escaped() {
      [523, 659, 784, 1047, 1319].forEach((f, i) => setTimeout(() => tone(f, 0.22, 'triangle', 0.15), i * 110));
    },
    click() {
      tone(700, 0.05, 'square', 0.08);
    },
    dash() {
      noise(0.14, 0.08, 2400);
    },
  };
}
