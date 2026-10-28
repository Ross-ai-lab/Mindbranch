/* ============================================================================
   Mindbranch — UI
   ========================================================================== */

const KEY = 'mindbranch-v1';
const MUSIC_KEY = 'mindbranch-music-enabled-v1';
const $ = s => document.querySelector(s);
const el = (t, c, h) => { const e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

let A = {};            // answers
let cursor = 0;        // index into the live queue
let view = 'landing';  // landing | quiz | results
let lastRun = null;    // for the flip-an-answer diff
let pendingDiff = null;
let lastQLen = null;         // to notice the queue SHRINKING after an answer
let lastPruned = new Set();  // which modules had already been abandoned

/* ------------------------------------------------------------- site audio */
let sfxCtx = null;

function playButtonSound(button) {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  try {
    if (!sfxCtx) sfxCtx = new AudioContextClass();
    if (sfxCtx.state === 'suspended') sfxCtx.resume().catch(() => {});

    const primary = button.classList.contains('primary');
    const now = sfxCtx.currentTime;
    const osc = sfxCtx.createOscillator();
    const filter = sfxCtx.createBiquadFilter();
    const gain = sfxCtx.createGain();
    const base = primary ? 660 : 500;

    osc.type = primary ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(base, now);
    osc.frequency.exponentialRampToValueAtTime(base * (primary ? 1.16 : 1.08), now + 0.045);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(primary ? 3000 : 2200, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(primary ? 0.055 : 0.035, now + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);

    osc.connect(filter).connect(gain).connect(sfxCtx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  } catch (e) {}
}

function setupClickSounds() {
  document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target : null;
    const button = target ? target.closest('button') : null;
    if (!button || button.disabled) return;
    playButtonSound(button);
  }, true);
}

function setupSiteMusic() {
  const audio = $('#site-music');
  const toggle = $('#music-toggle');
  if (!audio || !toggle) return;
  audio.volume = 0.18;

  const readCookiePreference = () => {
    try {
      const key = encodeURIComponent(MUSIC_KEY) + '=';
      const row = document.cookie.split('; ').find(item => item.startsWith(key));
      return row ? decodeURIComponent(row.slice(key.length)) === 'on' : null;
    } catch (e) { return null; }
  };
  const readPreference = () => {
    const cookieValue = readCookiePreference();
    if (cookieValue !== null) return cookieValue;
    try { return localStorage.getItem(MUSIC_KEY) === 'on'; } catch (e) { return false; }
  };
  const writePreference = value => {
    try { localStorage.setItem(MUSIC_KEY, value ? 'on' : 'off'); } catch (e) {}
    try {
      document.cookie = `${encodeURIComponent(MUSIC_KEY)}=${value ? 'on' : 'off'}; max-age=31536000; path=/; samesite=lax`;
    } catch (e) {}
  };
  const paint = playing => {
    toggle.textContent = playing ? '♫ Music: on' : '♫ Music: off';
    toggle.setAttribute('aria-pressed', String(playing));
    toggle.classList.toggle('on', playing);
  };
  const start = () => audio.play().then(() => { writePreference(true); paint(true); }).catch(() => paint(false));
  const stop = () => { audio.pause(); writePreference(false); paint(false); };

  const wantsMusic = readPreference();
  paint(wantsMusic);
  toggle.addEventListener('click', () => { if (audio.paused) start(); else stop(); });

  if (wantsMusic) {
    const firstGesture = () => {
      start();
      document.removeEventListener('pointerdown', firstGesture, true);
      document.removeEventListener('keydown', firstGesture, true);
    };
    document.addEventListener('pointerdown', firstGesture, true);
    document.addEventListener('keydown', firstGesture, true);
  }
}

/* ------------------------------------------------------------- persistence */
function save() { try { localStorage.setItem(KEY, JSON.stringify({ A, cursor, view })); } catch (e) {} }
function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (s && s.A) { A = s.A; cursor = s.cursor || 0; return true; }
  } catch (e) {}
  return false;
}

/* ------------------------------------------------------------------ answer */
function answered(id) { return A[id] !== undefined && (!Array.isArray(A[id]) || true); }

function labelFor(item, v) {
  if (item.k === 'yn') return ({ yes: 'Yes', no: 'No', unsure: 'Not sure' })[v] || '—';
  if (item.k === 'pick') { const o = (item.opts || []).find(o => o.v === v); return o ? o.t : '—'; }
  if (item.k === 'multi') {
    const vs = v || [];
    if (!vs.length) return 'None of these';
    return vs.map(x => (item.opts.find(o => o.v === x) || {}).t).filter(Boolean).join(', ');
  }
  return String(v);
}

/* All items, flattened, so the path replay can name any answered question. */
function allItems() {
  const m = {};
  CONTEXT.forEach(c => m[c.id] = { item: c, sect: 'Framing' });
  SCREEN.forEach(s => m[s.id] = { item: { id: s.id, k: 'yn', q: s.q }, sect: 'Screening' });
  MODULES.forEach(mod => (mod.items || []).forEach(it => { if (!m[it.id]) m[it.id] = { item: it, sect: mod.name }; }));
  return m;
}
const ITEMS = allItems();

/* ===================================================================== VIEW */
let lastView = null;

/* Moving between questions must NOT jump the page. Two things caused it: the
   unconditional scroll-to-top on every render, and the photographs, which are
   uncropped and therefore all different heights — so the question text sat at a
   different y on every card even without scrolling.

   Fix: only scroll to top when the VIEW changes (landing / quiz / results).
   Within the quiz, measure where the question block sits before the re-render
   and put it back at exactly the same viewport position afterwards, so the text
   you are reading does not move at all while the banner above it changes size. */
function render() {
  const root = $('#app');
  const sameView = lastView === view;
  const anchor = sameView && view === 'quiz' ? document.querySelector('.qmeta') : null;
  const before = anchor ? anchor.getBoundingClientRect().top : null;

  root.innerHTML = '';
  if (view === 'landing') root.appendChild(renderLanding());
  else if (view === 'quiz') root.appendChild(renderQuiz());
  else root.appendChild(renderResults());

  if (before !== null) {
    const now = document.querySelector('.qmeta');
    if (now) {
      const delta = now.getBoundingClientRect().top - before;
      if (delta) window.scrollBy({ top: delta, behavior: 'auto' });
    }
  } else if (!sameView) {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }
  lastView = view;
}

/* -------------------------------------------------------------- landing -- */
function renderLanding() {
  const d = el('div', 'landing');
  d.innerHTML = `
    ${photoBand('hero', null, { eager: true, cls: 'hero' })}
    <h2>A diagnosis is a chain of exclusions, not a score.</h2>
    <p class="lede">This walks the DSM-5-TR differential the way the manual actually structures it: framing gates first, then a symptom screen, then criteria modules, then the precedence rules that decide which of several possible diagnoses survives.</p>

    <div class="warn">
      <h4>Read this first</h4>
      <p>This is a personal hobby build for learning the diagnostic logic. It is <b>not</b> a medical device, not a diagnosis, and not advice. Items are paraphrased screening questions written to DSM-5-TR thresholds, not the manual's own text. Self-report cannot exclude a medical or substance cause, cannot observe you, and cannot take a history from anyone else &mdash; which is exactly why those limits are printed on the result rather than hidden.</p>
    </div>

    <p><b>How it runs</b></p>
    <ol>
      <li><b>Framing.</b> Six questions covering substance, medical, medication and stressor causes, plus the boundary with normality. These are steps 1 to 3 and 5 of the standard six-step framework, and they run <i>before</i> anything else because a positive answer invalidates everything downstream.</li>
      <li><b>Screening.</b> Twenty-five gates. Each yes or "not sure" opens the relevant criteria modules; everything else stays shut, so a typical run is thirty to fifty questions rather than three hundred.</li>
      <li><b>Modules.</b> The opened disorders, evaluated criterion by criterion &mdash; symptom counts, duration floors, distress and impairment.</li>
      <li><b>Differential.</b> ${RULES.length} precedence rules fire in order and demote whatever loses, each printing the reason it lost.</li>
      <li><b>Replay.</b> On the result page, click any answer to change it and watch which diagnoses move and which rules switch on or off. That is the part worth playing with.</li>
    </ol>

    <div class="actions">
      <button class="btn primary" id="go">Begin</button>
      <button class="btn ghost" id="resume">Resume saved run</button>
      <button class="btn ghost" id="imp">Import answers</button>
      <input type="file" id="impf" accept="application/json" hidden>
    </div>

    <details class="credits">
      <summary>Photography &mdash; ${Object.keys(PHOTOS).length} question images</summary>
      <p>Landscape, texture, architecture and still life from Wikimedia Commons.</p>
      <ul>
        ${Object.entries(PHOTOS).map(([k, p]) => `<li>
          <a href="${p.p}" target="_blank" rel="noopener">${esc(p.t)}</a>
        </li>`).join('')}
      </ul>
    </details>
  `;
  const hasSaved = !!localStorage.getItem(KEY);
  d.querySelector('#resume').disabled = !hasSaved;
  d.querySelector('#go').onclick = () => { A = {}; cursor = 0; view = 'quiz'; save(); render(); };
  d.querySelector('#resume').onclick = () => { if (load()) { view = 'quiz'; render(); } };
  d.querySelector('#imp').onclick = () => d.querySelector('#impf').click();
  d.querySelector('#impf').onchange = e => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => { try { A = JSON.parse(r.result); cursor = 0; view = 'results'; lastRun = null; save(); render(); } catch (x) { alert('That file could not be read.'); } };
    r.readAsText(f);
  };
  return d;
}

/* ----------------------------------------------------------------- quiz -- */
function renderQuiz() {
  const queue = buildQueue(A);
  if (cursor >= queue.length) { view = 'results'; lastRun = null; save(); return renderResults(); }
  const step = queue[cursor];
  const it = step.item;

  /* Did that last answer just close a branch? The total question count going
     DOWN is the whole point of the pruning, so it is announced rather than
     left for the user to notice. */
  const run = evaluate(A);
  const nowPruned = new Set(run.pruned.map(r => r.id));
  const fresh = run.pruned.filter(r => !lastPruned.has(r.id));
  const prevLen = lastQLen;
  const shrank = prevLen !== null && queue.length < prevLen;
  lastQLen = queue.length;
  lastPruned = nowPruned;

  /* The note must sit OUTSIDE .qlayout — that is a two-column grid, and a third
     child would be laid out as a grid cell rather than as a banner above it. */
  const outer = el('div');
  const lay = el('div', 'qlayout');

  if (shrank && fresh.length) {
    const gone = prevLen - queue.length;
    const names = [...new Set(fresh.map(r => r.name))];
    const note = el('div', 'pruneNote');
    note.appendChild(el('b', null, `${gone} question${gone === 1 ? '' : 's'} removed`));
    note.appendChild(el('p', null,
      `${esc(names.join(' and '))} ${names.length === 1 ? 'is' : 'are'} already settled — ` +
      `no answer to the remaining questions could have changed it, so they are not worth your time.`));
    if (fresh[0].reason) note.appendChild(el('p', 'sub', esc(fresh[0].reason)));
    outer.appendChild(note);
  }

  /* spine */
  const spine = el('aside', 'spine');
  const sects = [];
  queue.forEach((s, i) => {
    const last = sects[sects.length - 1];
    if (!last || last.name !== s.sect) sects.push({ name: s.sect, from: i, to: i });
    else last.to = i;
  });
  spine.appendChild(el('div', 'lab', 'Path'));
  const ul = el('ul');
  sects.forEach(s => {
    const cls = cursor > s.to ? 'done' : (cursor >= s.from ? 'now' : '');
    ul.appendChild(el('li', cls, esc(s.name)));
  });
  spine.appendChild(ul);
  lay.appendChild(spine);

  /* card */
  const card = el('section', 'qcard');

  /* Chapter banner. Framing and screening have their own; a module question
     takes its DSM chapter, so every disorder in a chapter shares one image and
     the run reads as moving through sections rather than through 148 slides. */
  const chap = step.phase === 'context' ? 'Framing'
             : step.phase === 'screen' ? 'Screening'
             : (MOD[step.mod] || {}).chap || 'Framing';
  card.insertAdjacentHTML('afterbegin', photoBand(it.id, chap, { eager: true }));

  const meta = el('div', 'qmeta');
  meta.appendChild(el('span', 'chip', esc(step.sect)));
  meta.appendChild(el('span', 'count', `${cursor + 1} / ${queue.length}`));
  card.appendChild(meta);
  card.appendChild(el('h2', 'qtext', esc(it.q)));
  if (it.help) card.appendChild(el('p', 'qhelp', esc(it.help)));
  if (it.k === 'multi') card.appendChild(el('p', 'qhint', 'Tick everything that applies. Ticking nothing is a valid answer and is recorded as such.'));

  card.appendChild(buildInput(it, () => { save(); refreshCard(); }));

  const nav = el('div', 'qnav');
  const back = el('button', 'btn ghost', 'Back');
  back.disabled = cursor === 0;
  back.onclick = () => { cursor--; save(); render(); };
  nav.appendChild(back);
  nav.appendChild(el('div', 'spacer'));

  const skip = el('button', 'btn ghost sm', 'Skip');
  skip.title = 'Leaves it unanswered. Anything that depends on it is reported as unresolved rather than guessed.';
  skip.onclick = () => { cursor++; save(); render(); };
  nav.appendChild(skip);

  const next = el('button', 'btn primary', cursor === queue.length - 1 ? 'See result' : 'Next');
  next.id = 'nextbtn';
  next.disabled = !isAnswered(it);
  next.onclick = () => { cursor++; save(); render(); };
  nav.appendChild(next);
  card.appendChild(nav);

  const bar = el('div', 'bar');
  bar.appendChild(el('i')).style.width = Math.round(((cursor) / queue.length) * 100) + '%';
  card.appendChild(bar);

  lay.appendChild(card);
  outer.appendChild(lay);

  function refreshCard() {
    const b = document.querySelector('#nextbtn');
    if (b) b.disabled = !isAnswered(it);
  }
  return outer;
}

/* Jump to the first question that still has no answer. Used by the "answer
   them" button when a replay revives a branch that had been abandoned. */
function gotoFirstUnanswered() {
  const q = buildQueue(A);
  const i = q.findIndex(s => A[s.item.id] === undefined);
  if (i < 0) return false;
  cursor = i; view = 'quiz'; lastQLen = q.length; save(); render();
  return true;
}

function isAnswered(it) {
  if (it.k === 'multi') return Array.isArray(A[it.id]);
  return A[it.id] !== undefined;
}

/* Builds the answer control for any item type. `after` runs on every change. */
function buildInput(it, after) {
  const box = el('div', 'opts');
  if (it.k === 'yn') {
    YN.forEach(o => box.appendChild(optBtn(it, o.v, o.t, 'radio', after)));
  } else if (it.k === 'pick') {
    (it.opts || []).forEach(o => box.appendChild(optBtn(it, o.v, o.t, 'radio', after)));
  } else if (it.k === 'multi') {
    (it.opts || []).forEach(o => box.appendChild(optBtn(it, o.v, o.t, 'check', after)));
    const none = el('button', 'opt radio', '<span class="box"></span><span>None of these apply</span>');
    if (Array.isArray(A[it.id]) && A[it.id].length === 0) none.classList.add('on');
    none.onclick = () => { A[it.id] = []; after(); rerenderOpts(box, it); };
    box.appendChild(none);
  }
  return box;
}

function optBtn(it, v, t, kind, after) {
  const b = el('button', 'opt ' + (kind === 'radio' ? 'radio' : ''), `<span class="box"></span><span>${esc(t)}</span>`);
  const on = it.k === 'multi' ? (A[it.id] || []).includes(v) : A[it.id] === v;
  if (on) b.classList.add('on');
  b.dataset.v = v;
  b.onclick = () => {
    if (it.k === 'multi') {
      const cur = Array.isArray(A[it.id]) ? A[it.id].slice() : [];
      const i = cur.indexOf(v);
      if (i >= 0) cur.splice(i, 1); else cur.push(v);
      A[it.id] = cur;
    } else {
      A[it.id] = v;
    }
    after();
    rerenderOpts(b.parentElement, it);
  };
  return b;
}

function rerenderOpts(box, it) {
  [...box.children].forEach(c => {
    const v = c.dataset.v;
    let on;
    if (v === undefined) on = Array.isArray(A[it.id]) && A[it.id].length === 0;      // the "none" button
    else if (it.k === 'multi') on = (A[it.id] || []).includes(v);
    else on = A[it.id] === v;
    c.classList.toggle('on', !!on);
  });
}

/* -------------------------------------------------------------- results -- */
function renderResults() {
  const run = evaluate(A);
  const d = el('div', 'res');

  d.appendChild(el('h2', null, 'Result'));
  d.appendChild(el('p', 'resub',
    `${run.opened.length} module${run.opened.length === 1 ? '' : 's'} opened by the screen &middot; ` +
    `${run.met.length} met full criteria &middot; ${run.near.length} near threshold &middot; ` +
    `${run.ruled.length} ruled out &middot; ${run.pruned.length} abandoned early ` +
    `(${run.skippedCount} question${run.skippedCount === 1 ? '' : 's'} never asked) &middot; ` +
    `${run.ledger.length} differential rule${run.ledger.length === 1 ? '' : 's'} fired`));

  /* what moved since the last run */
  if (pendingDiff) { d.appendChild(renderDiff(pendingDiff)); pendingDiff = null; }

  /* Anything owed an answer comes first, because until it is answered the
     result below is incomplete. This catches both a Skip and a replay that
     brought an abandoned branch back to life. */
  if (run.unresolved.length) {
    const owed = run.unresolved.reduce((n, r) => n + r.pending, 0);
    const p0 = el('section', 'panelbox needs');
    p0.appendChild(el('h3', null, 'Not resolved yet'));
    p0.appendChild(el('p', 'note',
      `${owed} question${owed === 1 ? '' : 's'} ${owed === 1 ? 'is' : 'are'} unanswered on ` +
      `${esc(run.unresolved.map(r => r.name).join(', '))}. ` +
      `These are not scored as negatives — a missing answer is not a no, and reporting it as one would be the ` +
      `worst thing this tool could do. Nothing below counts ${run.unresolved.length === 1 ? 'it' : 'them'} either way.`));
    const go = el('button', 'btn primary', `Answer the ${owed} remaining question${owed === 1 ? '' : 's'}`);
    go.onclick = () => { gotoFirstUnanswered(); };
    p0.appendChild(go);
    d.appendChild(p0);
  }

  /* shortlist */
  const p1 = el('section', 'panelbox');
  p1.appendChild(el('h3', null, 'Shortlist'));
  p1.appendChild(el('p', 'note', 'Ranked by how much of the criteria set survived. Comorbidity is the norm, so more than one entry here is an ordinary result rather than a contradiction.'));
  const short = [...run.met, ...run.near];
  if (!short.length) p1.appendChild(el('p', 'note', 'Nothing reached or approached full criteria. See the ledger below &mdash; that is a legitimate outcome, not a failed run.'));
  appendGrouped(p1, short);
  d.appendChild(p1);

  /* ruled out */
  const p2 = el('section', 'panelbox');
  p2.appendChild(el('h3', null, 'Ruled out, and why'));
  p2.appendChild(el('p', 'note', 'Every module the screen opened that did not survive. The reason given is the first criterion that failed, or the precedence rule that took it.'));
  if (!run.ruled.length) p2.appendChild(el('p', 'note', 'Nothing was ruled out on this run.'));
  appendGrouped(p2, run.ruled);
  d.appendChild(p2);

  /* abandoned early */
  if (run.pruned.length) {
    const p2b = el('section', 'panelbox');
    p2b.appendChild(el('h3', null, 'Abandoned early, and what you were spared'));
    p2b.appendChild(el('p', 'note',
      'The screen opened these, then one answer settled them. The tool checked every possible way you could have ' +
      'answered the rest and none of them changed the outcome, so it stopped asking.'));
    appendGrouped(p2b, run.pruned);
    d.appendChild(p2b);
  }

  /* ledger */
  const p3 = el('section', 'panelbox ledger');
  p3.appendChild(el('h3', null, 'Differential rules that fired'));
  p3.appendChild(el('p', 'note', 'This is the reasoning the tool exists to show. Each rule ran in order against the results above.'));
  if (!run.ledger.length) p3.appendChild(el('p', 'note', 'No precedence rules applied to this pattern of answers.'));
  run.ledger.forEach(l => {
    const w = el('div', 'item');
    w.appendChild(el('h4', null, `${esc(l.title)} <code>${esc(l.id)}</code>`));
    w.appendChild(el('p', null, esc(l.msg)));
    p3.appendChild(w);
  });
  d.appendChild(p3);

  /* path replay */
  const p4 = el('section', 'panelbox path');
  p4.appendChild(el('h3', null, 'Answer path'));
  p4.appendChild(el('p', 'note', 'Every answer that produced the result above. Change one and the whole tree is re-evaluated, with the differences reported at the top.'));
  Object.keys(A).forEach(id => {
    const rec = ITEMS[id];
    if (!rec) return;
    const row = el('div', 'row');
    const q = el('div', 'q', esc(rec.item.q));
    q.appendChild(el('em', null, esc(rec.sect)));
    row.appendChild(q);
    const a = el('div', 'a');
    const btn = el('button', null, esc(labelFor(rec.item, A[id])));
    btn.onclick = () => openEditor(row, rec, id);
    a.appendChild(btn);
    row.appendChild(a);
    p4.appendChild(row);
  });
  d.appendChild(p4);

  const acts = el('div', 'resactions');
  const again = el('button', 'btn ghost', 'Start over');
  again.onclick = () => { if (confirm('Clear every answer and start again?')) { A = {}; cursor = 0; view = 'landing'; lastRun = null; localStorage.removeItem(KEY); render(); } };
  const back = el('button', 'btn ghost', 'Back to the questions');
  back.onclick = () => { view = 'quiz'; cursor = Math.max(0, buildQueue(A).length - 1); save(); render(); };
  const exp = el('button', 'btn ghost', 'Export answers');
  exp.onclick = () => {
    const blob = new Blob([JSON.stringify(A, null, 2)], { type: 'application/json' });
    const u = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = u; a.download = 'mindbranch-answers.json'; a.click();
    URL.revokeObjectURL(u);
  };
  acts.append(back, again, exp);
  d.appendChild(acts);

  d.appendChild(el('div', 'foot',
    'Deterministic: the same answers always produce this same page. Nothing is sent anywhere &mdash; answers live in this browser only. ' +
    'Items are paraphrased to DSM-5-TR thresholds and are not the manual\'s text.'));

  lastRun = run;
  return d;
}

function renderDiff(dif) {
  const d = el('div', 'diff');
  d.appendChild(el('h4', null, 'What that change did'));
  if (!dif.changes.length && !dif.rulesOn.length && !dif.rulesOff.length) {
    d.appendChild(el('p', 'none', 'Nothing moved. The answer feeds a criterion that was not the deciding one on this path &mdash; worth knowing, because it means the diagnosis did not hinge on it.'));
    return d;
  }
  const ul = el('ul');
  const state = {
    met: 'criteria met', near: 'near threshold', out: 'ruled out',
    abandoned: 'abandoned early', unresolved: 'now unanswered', 'not asked': 'not asked'
  };
  dif.changes.forEach(c => {
    ul.appendChild(el('li', null,
      `<b>${esc(c.name)}</b>: ${esc(state[c.from] || c.from)} &rarr; ${esc(state[c.to] || c.to)}.${c.why ? ' ' + esc(c.why) : ''}`));
  });
  dif.rulesOn.forEach(r => ul.appendChild(el('li', null, `Rule switched <b>on</b>: ${esc(r.title)}.`)));
  dif.rulesOff.forEach(r => ul.appendChild(el('li', null, `Rule switched <b>off</b>: ${esc(r.title)}.`)));
  d.appendChild(ul);
  return d;
}

function openEditor(row, rec, id) {
  const existing = row.parentElement.querySelector('.editor');
  if (existing) existing.remove();
  const ed = el('div', 'editor');
  if (rec.item.help) ed.appendChild(el('p', 'qhelp', esc(rec.item.help)));
  ed.appendChild(buildInput(rec.item, () => {}));
  const bar = el('div', 'qnav');
  bar.appendChild(el('div', 'spacer'));
  const cancel = el('button', 'btn ghost sm', 'Cancel');
  cancel.onclick = () => { ed.remove(); };
  const apply = el('button', 'btn primary sm', 'Re-run the tree');
  apply.onclick = () => {
    const before = lastRun || evaluate(A);
    save();
    const after = evaluate(A);
    pendingDiff = diffRuns(before, after);
    render();
  };
  bar.append(cancel, apply);
  ed.appendChild(bar);
  row.after(ed);
}

/* Photographs are keyed by QUESTION, so a chapter header on the results page
   has no image of its own. It borrows the chapter's first question — the one
   that opened the branch — which is the only repeat anywhere in the build and
   is a section header rather than a question. */
const CHAP_LEAD = (() => {
  const m = { 'Framing': CONTEXT[0].id, 'Screening': SCREEN[0].id };
  MODULES.forEach(mod => {
    if (!m[mod.chap] && (mod.items || []).length) m[mod.chap] = mod.items[0].id;
  });
  return m;
})();

/* Every result section — shortlist, ruled out, abandoned — is grouped under its
   chapter with that chapter's photograph, so all three read the same way the
   run itself did rather than as three undifferentiated lists. */
function appendGrouped(panel, list) {
  groupByChapter(list).forEach(g => {
    const h = el('div', 'chaphead');
    h.innerHTML = photoBand(CHAP_LEAD[g.chap], g.chap, { cls: 'chapband' });
    h.appendChild(el('span', 'chaplabel', esc(g.chap)));
    panel.appendChild(h);
    g.items.forEach(r => panel.appendChild(dxCard(r)));
  });
}

/* Preserves the order the modules came in, but collects each chapter's
   diagnoses together under one header. */
function groupByChapter(list) {
  const out = [];
  list.forEach(r => {
    let g = out.find(x => x.chap === r.chap);
    if (!g) out.push(g = { chap: r.chap, items: [] });
    g.items.push(r);
  });
  return out;
}

/* Renders one diagnosis card, with its criterion-by-criterion breakdown. */
function dxCard(r) {
  const cls = 'dx ' + r.status;
  const c = el('article', cls);
  const hd = el('div', 'hd');
  hd.appendChild(el('span', 'nm', esc(r.name)));
  const tags = {
    met: 'Criteria met', near: 'Near threshold', unresolved: 'Unanswered',
    out: r.pruned ? `Settled — ${r.skipped} question${r.skipped === 1 ? '' : 's'} skipped`
       : r.demoted ? 'Excluded by a rule' : 'Ruled out'
  };
  hd.appendChild(el('span', 'tag', esc(tags[r.status])));
  hd.appendChild(el('span', 'chapname', esc(r.chap)));
  c.appendChild(hd);

  if (r.status !== 'out' && r.blurb) c.appendChild(el('p', 'blurb', esc(r.blurb)));
  if (r.severity) c.appendChild(el('p', 'sev', 'Severity: ' + esc(r.severity)));
  if (r.referOnly && r.status !== 'out') c.appendChild(el('p', 'why', 'Reported as features present only. This branch is not finished by a self-report tool.'));
  if (r.screenOnly && r.status !== 'out') c.appendChild(el('p', 'why', 'A positive screen, not a diagnosis. No personality disorder is ever output here.'));
  if (r.reason) c.appendChild(el('p', 'why', esc(r.reason)));
  (r.taints || []).forEach(t => c.appendChild(el('p', 'taint', esc(t))));

  const crit = el('div', 'crit');
  r.rows.forEach(row => {
    const w = el('div', 'row ' + (row.pass ? 'ok' : 'no'));
    w.appendChild(el('span', 'mk', row.pass ? '✓' : '✗'));
    const lb = el('span', 'lb');
    lb.appendChild(el('b', null, esc(row.id) + '. ' + esc(row.label)));
    if (!row.pass && row.why) lb.appendChild(el('i', null, esc(row.why)));
    w.appendChild(lb);
    crit.appendChild(w);
  });
  c.appendChild(crit);

  const tg = el('button', 'btn ghost sm toggle', 'Show every criterion');
  tg.onclick = () => {
    c.classList.toggle('open');
    tg.textContent = c.classList.contains('open') ? 'Hide criteria' : 'Show every criterion';
  };
  c.appendChild(tg);
  return c;
}

/* ==================================================================== boot */
document.addEventListener('DOMContentLoaded', () => {
  $('#restart').onclick = () => { view = 'landing'; render(); };
  setupClickSounds();
  setupSiteMusic();
  render();
});
