/* =========================================================
   Nithish & Brundha · Wedding Reception
   Page logic. The 3D world lives in scene.js.
   Edit event times here (IST). Text lives in index.html.
   ========================================================= */
const EVENT = {
  receptionStart: '2026-11-19T18:00:00+05:30',
  receptionEnd: '2026-11-19T21:00:00+05:30',
  weddingDate: '2026-11-20',
  // Set to e.g. ['2026-11-20T06:00:00+05:30', '2026-11-20T07:30:00+05:30'] once the muhurtham time is fixed
  weddingTime: null,
  venue: 'Sri Kumar Mahal, Vijayamangalam, Tamil Nadu',
  mapLink: 'https://maps.app.goo.gl/HsPNduKvxZPVtxWh6',
};

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

/* ---------------- Personal greeting: index.html?to=Ravi%20Family ---------------- */
const guest = new URLSearchParams(location.search).get('to');
if (guest) {
  const p = document.createElement('p');
  p.className = 'lead';
  p.textContent = `Dear ${guest.slice(0, 60)},`;
  $('.gate-panel .kicker').before(p);
}

/* ---------------- Sound: temple bell + tanpura drone ---------------- */
const Sound = {
  ctx: null, master: null, muted: false, track: null, timer: null,
  start() {
    // Optional: drop a "music.mp3" (nadaswaram / veena) next to index.html and it plays instead of the drone.
    this.track = new Audio('music.mp3');
    this.track.loop = true;
    this.track.volume = 0.6;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) {
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.9;
      this.reverb = this.makeReverb();
      this.master.connect(this.ctx.destination);
      this.reverb.connect(this.master);
      this.bell(0.05); this.bell(1.5, 0.7); this.bell(2.9, 0.5);
    }
    this.track.play().catch(() => {
      this.track = null;
      if (this.ctx) setTimeout(() => this.drone(), 3200);
    });
  },
  makeReverb() {
    const c = this.ctx, len = c.sampleRate * 3.2;
    const buf = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
    }
    const conv = c.createConvolver(); conv.buffer = buf;
    const wet = c.createGain(); wet.gain.value = 0.35;
    conv.connect(wet);
    this.revIn = conv;
    return wet;
  },
  out(node, dry = 0.7) {
    const g = this.ctx.createGain(); g.gain.value = dry;
    node.connect(g); g.connect(this.master);
    node.connect(this.revIn);
  },
  bell(at, vol = 1) {
    const c = this.ctx, t = c.currentTime + at, f = 587;
    [[1, 0.5, 4.5], [2.01, 0.28, 3.2], [2.76, 0.22, 2.6], [4.1, 0.12, 1.8], [5.43, 0.1, 1.4], [8.9, 0.05, .8]].forEach(([r, g, d]) => {
      const o = c.createOscillator(), a = c.createGain();
      o.type = 'sine'; o.frequency.value = f * r;
      a.gain.setValueAtTime(0, t);
      a.gain.linearRampToValueAtTime(g * vol * 0.32, t + 0.004);
      a.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(a); this.out(a, 0.8);
      o.start(t); o.stop(t + d + 0.1);
    });
  },
  pluck(freq, t) {
    const c = this.ctx;
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = 6;
    f.frequency.setValueAtTime(3200, t);
    f.frequency.exponentialRampToValueAtTime(700, t + 3.5);
    const a = c.createGain();
    a.gain.setValueAtTime(0, t);
    a.gain.linearRampToValueAtTime(0.05, t + 0.03);
    a.gain.exponentialRampToValueAtTime(0.0001, t + 4.6);
    [0, 1.5, -1.2].forEach((det) => {
      const o = c.createOscillator(); o.type = 'sawtooth';
      o.frequency.value = freq; o.detune.value = det;
      o.connect(f); o.start(t); o.stop(t + 4.8);
    });
    f.connect(a); this.out(a, 0.5);
  },
  drone() {
    if (!this.ctx || this.timer) return;
    const sa = 138.59; // C#3
    const strings = [sa * 1.5, sa * 2, sa * 2, sa]; // Pa, Sa, Sa, low Sa
    let i = 0, next = this.ctx.currentTime + 0.1;
    const tick = () => {
      while (next < this.ctx.currentTime + 1.2) {
        this.pluck(strings[i % 4], next);
        next += i % 4 === 3 ? 1.6 : 1.05;
        i++;
      }
    };
    tick();
    this.timer = setInterval(tick, 400);
  },
  toggle() {
    this.muted = !this.muted;
    if (this.track) this.muted ? this.track.pause() : this.track.play().catch(() => {});
    if (this.ctx) this.muted ? this.ctx.suspend() : this.ctx.resume();
    return this.muted;
  },
};
document.addEventListener('visibilitychange', () => {
  if (Sound.muted) return;
  if (document.hidden) { Sound.ctx && Sound.ctx.suspend(); Sound.track && Sound.track.pause(); }
  else { Sound.ctx && Sound.ctx.resume(); Sound.track && Sound.track.play().catch(() => {}); }
});

/* ---------------- Opening: doors swing, camera flies in ---------------- */
const gate = $('#gate');
let opened = false;
function openGate() {
  if (opened) return;
  opened = true;
  Sound.start();
  window.World && World.open();
  gate.classList.add('open');
  document.body.classList.add('playing');
  setTimeout(() => {
    document.body.classList.remove('locked');
    gate.classList.add('gone');
    $('#sound').hidden = false;
  }, 3600);
}
gate.addEventListener('click', openGate);
gate.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openGate(); } });

$('#sound').addEventListener('click', (e) => {
  const muted = Sound.toggle();
  e.currentTarget.classList.toggle('muted', muted);
  e.currentTarget.setAttribute('aria-label', muted ? 'Play music' : 'Mute music');
});

/* ---------------- Scroll drives the 3D camera ---------------- */
function onScroll() {
  const max = document.documentElement.scrollHeight - innerHeight;
  window.World && World.setProgress(max > 0 ? scrollY / max : 0);
}
addEventListener('scroll', onScroll, { passive: true });
addEventListener('resize', onScroll);

/* ---------------- Scroll reveals ---------------- */
const io = new IntersectionObserver((entries) => {
  entries.forEach((en) => {
    if (!en.isIntersecting) return;
    en.target.classList.add('in');
    io.unobserve(en.target);
  });
}, { threshold: 0.2 });
$$('.reveal').forEach((n) => io.observe(n));

/* ---------------- Countdown ---------------- */
(function countdown() {
  const end = new Date(EVENT.receptionStart).getTime();
  const units = { d: $('[data-u=d]'), h: $('[data-u=h]'), m: $('[data-u=m]'), s: $('[data-u=s]') };
  const pad = (n) => String(n).padStart(2, '0');
  const tick = () => {
    const diff = Math.max(0, end - Date.now());
    if (diff === 0) {
      $('#clock').hidden = true;
      $('.clock-done').hidden = false;
      return clearInterval(t);
    }
    const s = Math.floor(diff / 1000);
    units.d.textContent = pad(Math.floor(s / 86400));
    units.h.textContent = pad(Math.floor((s % 86400) / 3600));
    units.m.textContent = pad(Math.floor((s % 3600) / 60));
    units.s.textContent = pad(s % 60);
  };
  const t = setInterval(tick, 1000);
  tick();
})();

/* ---------------- Calendar links ---------------- */
(function calendar() {
  const utc = (iso) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const day = (d, add = 0) => { const x = new Date(d + 'T00:00:00Z'); x.setUTCDate(x.getUTCDate() + add); return x.toISOString().slice(0, 10).replace(/-/g, ''); };
  const events = {
    reception: {
      title: 'Nithish & Brundha · Wedding Reception',
      start: utc(EVENT.receptionStart), end: utc(EVENT.receptionEnd), allDay: false,
    },
    wedding: EVENT.weddingTime
      ? { title: 'Nithish & Brundha · Muhurtham', start: utc(EVENT.weddingTime[0]), end: utc(EVENT.weddingTime[1]), allDay: false }
      : { title: 'Nithish & Brundha · Muhurtham', start: day(EVENT.weddingDate), end: day(EVENT.weddingDate, 1), allDay: true },
  };
  const details = `You are warmly invited. Directions: ${EVENT.mapLink}`;
  for (const [key, ev] of Object.entries(events)) {
    const g = $(`[data-cal=${key}-g]`);
    g.href = 'https://calendar.google.com/calendar/render?action=TEMPLATE' +
      `&text=${encodeURIComponent(ev.title)}&dates=${ev.start}/${ev.end}` +
      `&location=${encodeURIComponent(EVENT.venue)}&details=${encodeURIComponent(details)}`;
    $(`[data-cal=${key}-ics]`).addEventListener('click', (e) => {
      e.preventDefault();
      const dt = ev.allDay ? `DTSTART;VALUE=DATE:${ev.start}\r\nDTEND;VALUE=DATE:${ev.end}` : `DTSTART:${ev.start}\r\nDTEND:${ev.end}`;
      const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//NithishBrundha//Invite//EN', 'BEGIN:VEVENT',
        `UID:${key}-nithish-brundha-2026@invite`, `DTSTAMP:${utc(new Date().toISOString())}`, dt,
        `SUMMARY:${ev.title}`, `LOCATION:${EVENT.venue.replace(/,/g, '\\,')}`, `DESCRIPTION:${details}`,
        'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
      a.download = `nithish-brundha-${key}.ics`;
      document.body.appendChild(a); a.click(); a.remove();
    });
  }
})();

/* ---------------- Share ---------------- */
$('#share').addEventListener('click', async () => {
  const url = location.href.split('?')[0];
  const text = 'You are invited to the Wedding Reception of V.R. Nithish & A. Brundha · 19 Nov 2026, 6 PM · Sri Kumar Mahal, Vijayamangalam';
  if (navigator.share) {
    try { await navigator.share({ title: 'Nithish & Brundha', text, url }); } catch (_) {}
  } else {
    open(`https://wa.me/?text=${encodeURIComponent(text + '\n' + url)}`, '_blank', 'noopener');
  }
});
