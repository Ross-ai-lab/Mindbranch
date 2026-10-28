/* ============================================================================
   Mindbranch — UI, plus the shared site audio
   ========================================================================== */

const KEY = 'mindbranch-v1';
const MUSIC_KEY = 'mindbranch-music-enabled-v1';
const $ = s => document.querySelector(s);
const el = (t, c, h) => { const e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

let A = {};            // answers
let cursor = 0;        // index into the live queue
let view = 'landing';  // landing | quiz | results
let pendingDiff = null;
let pathOpen = false;         // the answer-path panel stays open while editing
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
    const button = event.target instanceof Element ? event.target.closest('button') : null;
    if (button && !button.disabled) playButtonSound(button);
  }, true);
}

function setupSiteMusic() {
  const audio = $('#site-music');
  const toggle = $('#music-toggle');
  audio.volume = 0.18;
  const remember = on => { try { localStorage.setItem(MUSIC_KEY, on ? 'on' : 'off'); } catch (e) {} };
  const paint = on => {
    toggle.textContent = on ? '♫ Music: on' : '♫ Music: off';
    toggle.setAttribute('aria-pressed', String(on));
    toggle.classList.toggle('on', on);
  };
  const start = () => audio.play().then(() => { remember(true); paint(true); }).catch(() => paint(false));
  let wanted = false;
  try { wanted = localStorage.getItem(MUSIC_KEY) === 'on'; } catch (e) {}
  paint(wanted);
  toggle.addEventListener('click', () => { if (audio.paused) start(); else { audio.pause(); remember(false); paint(false); } });
  // Browsers only allow playback after a gesture, so a remembered "on" waits for one.
  if (wanted) {
    const firstGesture = event => {
      document.removeEventListener('pointerdown', firstGesture, true);
      document.removeEventListener('keydown', firstGesture, true);
      if (!toggle.contains(event.target)) start();
    };
    document.addEventListener('pointerdown', firstGesture, true);
    document.addEventListener('keydown', firstGesture, true);
  }
}

/* ------------------------------------------------------------- persistence */
const ITEM = Object.fromEntries([...CONTEXT, ...SCREEN, ...MODULES.flatMap(m => m.items)].map(i => [i.id, i]));

/* Saved and imported answers keep only known questions and allowed values. */
function sanitize(x) {
  const out = {};
  if (!x || typeof x !== 'object' || Array.isArray(x)) return out;
  for (const [id, it] of Object.entries(ITEM)) {
    const v = x[id], allowed = (it.k === 'yn' ? YN : it.opts).map(o => o.v);
    if (it.k === 'multi') { if (Array.isArray(v)) out[id] = [...new Set(v.filter(o => allowed.includes(o)))]; }
    else if (allowed.includes(v)) out[id] = v;
  }
  return out;
}
function save() { try { localStorage.setItem(KEY, JSON.stringify({ A, cursor, view })); } catch (e) {} }
function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (s && s.A && Object.keys(sanitize(s.A)).length) {
      A = sanitize(s.A);
      cursor = Number.isSafeInteger(s.cursor) && s.cursor >= 0 ? s.cursor : 0;
      view = s.view === 'results' ? 'results' : 'quiz';
      return true;
    }
  } catch (e) {}
  return false;
}
function start(answers = {}, next = 'quiz') { A = answers; cursor = 0; view = next; pendingDiff = null; lastQLen = null; save(); render(); }

function labelFor(item, v) {
  if (item.k === 'yn') return ({ yes: 'Yes', no: 'No', unsure: 'Not sure' })[v] || '—';
  if (item.k === 'pick') { const o = item.opts.find(o => o.v === v); return o ? o.t : '—'; }
  const vs = v || [];
  return vs.length ? vs.map(x => (item.opts.find(o => o.v === x) || {}).t).filter(Boolean).join(', ') : 'None of these';
}

/* ===================================================================== VIEW */
let lastView = null;

/* Moving between questions must not jump the page: the uncropped photographs
   are all different heights. Scroll to top only when the view changes; within
   the quiz, keep the question block at the same viewport position. */
function render() {
  const root = $('#app');
  const sameView = lastView === view;
  const anchor = sameView && view === 'quiz' ? $('.qmeta') : null;
  const before = anchor ? anchor.getBoundingClientRect().top : null;

  root.replaceChildren(view === 'landing' ? renderLanding() : view === 'quiz' ? renderQuiz() : renderResults());

  const now = before !== null && $('.qmeta');
  if (now) window.scrollBy({ top: now.getBoundingClientRect().top - before, behavior: 'auto' });
  else if (!sameView) window.scrollTo({ top: 0, behavior: 'auto' });
  lastView = view;
}

/* -------------------------------------------------------------- landing -- */
function renderLanding() {
  const d = el('div', 'landing');
  let saved = false;
  try { saved = !!localStorage.getItem(KEY); } catch (e) {}
  d.innerHTML = `
    ${photoBand('hero', { eager: true, cls: 'hero' })}
    <h2>A diagnosis is a chain of exclusions, not a score.</h2>
    <p class="lede">Framing questions first, then ${SCREEN.length} screening gates. Each yes or "not sure" opens its DSM-5-TR criteria modules, and ${RULES.length} precedence rules decide which diagnoses survive, each printing why. Questions that can no longer change the outcome are skipped. On the result, change any answer to see what moves.</p>
    <div class="actions">
      <button class="btn primary" id="go">${saved ? 'Continue saved run' : 'Begin'}</button>
      ${saved ? '<button class="btn ghost" id="fresh">Start over</button>' : ''}
      <button class="btn ghost" id="imp">Import answers</button>
      <input type="file" id="impf" accept="application/json,.json" hidden>
    </div>
    <p class="msg" role="status"></p>`;
  d.querySelector('#go').onclick = () => { if (!(saved && load())) start(); else render(); };
  if (saved) d.querySelector('#fresh').onclick = () => { if (confirm('Clear every answer and start again?')) start(); };
  d.querySelector('#imp').onclick = () => d.querySelector('#impf').click();
  d.querySelector('#impf').onchange = async e => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const answers = sanitize(JSON.parse(await f.text()));
      if (!Object.keys(answers).length) throw Error();
      start(answers, 'results');
    } catch (x) { d.querySelector('.msg').textContent = 'That file is not a Mindbranch answers file.'; }
  };
  return d;
}

/* ----------------------------------------------------------------- quiz -- */
function renderQuiz() {
  const queue = buildQueue(A);
  if (cursor >= queue.length) { view = 'results'; save(); return renderResults(); }
  const step = queue[cursor];
  const it = step.item;

  /* The queue shrinking after an answer is the pruning made visible. */
  const run = evaluate(A);
  const fresh = run.pruned.filter(r => !lastPruned.has(r.id));
  const gone = lastQLen === null ? 0 : lastQLen - queue.length;
  lastQLen = queue.length;
  lastPruned = new Set(run.pruned.map(r => r.id));

  // The note sits outside .qlayout, a two-column grid.
  const outer = el('div');
  if (gone > 0 && fresh.length) {
    const names = [...new Set(fresh.map(r => r.name))];
    const note = el('div', 'pruneNote');
    note.appendChild(el('b', null, `${plural(gone, 'question')} removed`));
    note.appendChild(el('p', null, `${esc(names.join(' and '))} ${names.length === 1 ? 'is' : 'are'} settled — no remaining answer could change ${names.length === 1 ? 'it' : 'them'}.`));
    if (fresh[0].reason) note.appendChild(el('p', 'sub', esc(fresh[0].reason)));
    outer.appendChild(note);
  }

  const lay = el('div', 'qlayout');
  const spine = el('aside', 'spine');
  const sects = [];
  queue.forEach((s, i) => {
    const last = sects[sects.length - 1];
    if (!last || last.name !== s.sect) sects.push({ name: s.sect, from: i, to: i });
    else last.to = i;
  });
  spine.appendChild(el('div', 'lab', 'Path'));
  const ul = el('ul');
  sects.forEach(s => ul.appendChild(el('li', cursor > s.to ? 'done' : cursor >= s.from ? 'now' : '', esc(s.name))));
  spine.appendChild(ul);
  lay.appendChild(spine);

  const card = el('section', 'qcard');
  card.insertAdjacentHTML('afterbegin', photoBand(it.id, { eager: true }));
  const meta = el('div', 'qmeta');
  meta.appendChild(el('span', 'chip', esc(step.sect)));
  meta.appendChild(el('span', 'count', `${cursor + 1} / ${queue.length}`));
  card.appendChild(meta);
  card.appendChild(el('h2', 'qtext', esc(it.q)));
  if (it.help) card.appendChild(el('p', 'qhelp', esc(it.help)));
  if (it.k === 'multi') card.appendChild(el('p', 'qhint', 'Tick everything that applies, or "None of these apply".'));

  const advance = () => { cursor++; save(); render(); };
  // A single-choice answer moves straight on; a tick-list waits for Next.
  card.appendChild(buildInput(it, A, () => { save(); if (it.k === 'multi') next.disabled = !answered(it, A); else advance(); }));

  const nav = el('div', 'qnav');
  const back = el('button', 'btn ghost', 'Back');
  back.disabled = cursor === 0;
  back.onclick = () => { cursor--; save(); render(); };
  const skip = el('button', 'btn ghost sm', 'Skip');
  skip.title = 'Leaves it unanswered. Anything that depends on it is reported as unresolved rather than guessed.';
  skip.onclick = advance;
  const next = el('button', 'btn primary', cursor === queue.length - 1 ? 'See result' : 'Next');
  next.disabled = !answered(it, A);
  next.onclick = advance;
  nav.append(back, el('div', 'spacer'), skip, next);
  card.appendChild(nav);

  const bar = el('div', 'bar');
  bar.appendChild(el('i')).style.width = Math.round((cursor / queue.length) * 100) + '%';
  card.appendChild(bar);
  lay.appendChild(card);
  outer.appendChild(lay);
  return outer;
}

function answered(it, store) { return it.k === 'multi' ? Array.isArray(store[it.id]) : store[it.id] !== undefined; }

/* The answer control for any item type, writing into `store`. */
function buildInput(it, store, after) {
  const box = el('div', 'opts');
  const paint = () => [...box.children].forEach(c => {
    const v = c.dataset.v, cur = store[it.id];
    c.classList.toggle('on', v === '' ? Array.isArray(cur) && !cur.length : it.k === 'multi' ? (cur || []).includes(v) : cur === v);
  });
  const add = (v, t, radio, pickIt) => {
    const b = el('button', 'opt' + (radio ? ' radio' : ''), `<span class="box"></span><span>${esc(t)}</span>`);
    b.dataset.v = v;
    b.onclick = () => { pickIt(); paint(); after(); };
    box.appendChild(b);
  };
  if (it.k === 'multi') {
    it.opts.forEach(o => add(o.v, o.t, false, () => {
      const cur = Array.isArray(store[it.id]) ? store[it.id] : [];
      store[it.id] = cur.includes(o.v) ? cur.filter(x => x !== o.v) : [...cur, o.v];
    }));
    add('', 'None of these apply', true, () => { store[it.id] = []; });
  } else {
    (it.k === 'yn' ? YN : it.opts).forEach(o => add(o.v, o.t, true, () => { store[it.id] = o.v; }));
  }
  paint();
  return box;
}

/* -------------------------------------------------------------- results -- */
function renderResults() {
  const run = evaluate(A);
  const d = el('div', 'res');

  d.appendChild(el('h2', null, 'Result'));
  d.appendChild(el('p', 'resub',
    `${plural(run.opened.length, 'module')} opened &middot; ${run.met.length} met &middot; ${run.near.length} near threshold &middot; ` +
    `${run.ruled.length} ruled out &middot; ` + (run.pruned.length ? `${run.pruned.length} settled early (${plural(run.skippedCount, 'question')} not needed) &middot; ` : '') +
    `${plural(run.ledger.length, 'rule')} fired`));

  if (pendingDiff) { d.appendChild(renderDiff(pendingDiff)); pendingDiff = null; }

  /* Anything owed an answer comes first: a missing answer is not a no. This
     catches both a Skip and a replay that revived an abandoned branch. */
  if (run.unresolved.length) {
    const owed = run.pendingCount;
    const p0 = el('section', 'panelbox needs');
    p0.appendChild(el('h3', null, 'Not resolved yet'));
    p0.appendChild(el('p', 'note', `${esc(run.unresolved.map(r => r.name).join(', '))} still ${owed === 1 ? 'needs one answer' : `needs ${owed} answers`}. Unanswered is never scored as no.`));
    const go = el('button', 'btn primary', `Answer ${owed === 1 ? 'it' : `the ${owed}`}`);
    go.onclick = () => { cursor = buildQueue(A).findIndex(s => A[s.item.id] === undefined); view = 'quiz'; save(); render(); };
    p0.appendChild(go);
    d.appendChild(p0);
  }

  const panel = (title, note, list, cls = '') => {
    const p = el('section', 'panelbox ' + cls);
    p.appendChild(el('h3', null, title));
    p.appendChild(el('p', 'note', note));
    appendGrouped(p, list);
    d.appendChild(p);
  };
  const short = [...run.met, ...run.near];
  panel('Shortlist', short.length ? 'Comorbidity is the norm, so more than one entry is an ordinary result.'
    : 'Nothing reached or approached full criteria. That is a legitimate outcome, not a failed run.', short);
  if (run.ruled.length) panel('Ruled out, and why', 'The first criterion that failed, or the precedence rule that excluded it.', run.ruled);
  if (run.pruned.length) panel('Settled early', 'Every possible answer to the remaining questions was checked; none changed the outcome, so they were not asked.', run.pruned);

  const p3 = el('section', 'panelbox ledger');
  p3.appendChild(el('h3', null, 'Differential rules that fired'));
  if (!run.ledger.length) p3.appendChild(el('p', 'note', 'No precedence rule applied to these answers.'));
  run.ledger.forEach(l => {
    const w = el('div', 'item');
    w.appendChild(el('h4', null, `${esc(l.title)} <code>${esc(l.id)}</code>`));
    w.appendChild(el('p', null, esc(l.msg)));
    p3.appendChild(w);
  });
  d.appendChild(p3);

  /* Answers on the current path, collapsed like Bodybranch's. Change one to re-run the tree. */
  const p4 = el('details', 'panelbox path');
  p4.open = pathOpen;
  p4.ontoggle = () => { pathOpen = p4.open; };
  p4.appendChild(el('summary', null, 'Review or change the answer path'));
  p4.appendChild(el('p', 'note', 'Change any answer and the whole tree is re-evaluated, with the differences shown at the top.'));
  buildQueue(A).filter(s => answered(s.item, A)).forEach(s => {
    const row = el('div', 'row');
    const q = el('div', 'q', esc(s.item.q));
    q.appendChild(el('em', null, esc(s.sect)));
    const a = el('div', 'a');
    const btn = el('button', null, esc(labelFor(s.item, A[s.item.id])));
    btn.onclick = () => openEditor(row, s.item);
    a.appendChild(btn);
    row.append(q, a);
    p4.appendChild(row);
  });
  d.appendChild(p4);

  const acts = el('div', 'resactions');
  const back = el('button', 'btn ghost', 'Back to the questions');
  back.onclick = () => { view = 'quiz'; cursor = Math.max(0, buildQueue(A).length - 1); save(); render(); };
  const again = el('button', 'btn ghost', 'Start over');
  again.onclick = () => { if (confirm('Clear every answer and start again?')) start(); };
  const exp = el('button', 'btn ghost', 'Export answers');
  exp.onclick = () => {
    const u = URL.createObjectURL(new Blob([JSON.stringify(A, null, 2)], { type: 'application/json' }));
    const a = el('a'); a.href = u; a.download = 'mindbranch-answers.json'; a.click();
    setTimeout(() => URL.revokeObjectURL(u), 1000);
  };
  acts.append(back, again, exp);
  d.appendChild(acts);
  return d;
}

function renderDiff(dif) {
  const d = el('div', 'diff');
  d.appendChild(el('h4', null, 'What that change did'));
  if (!dif.changes.length && !dif.rulesOn.length && !dif.rulesOff.length) {
    d.appendChild(el('p', 'none', 'Nothing moved: no result hinged on that answer.'));
    return d;
  }
  const ul = el('ul');
  const state = { met: 'criteria met', near: 'near threshold', out: 'ruled out', abandoned: 'settled early', unresolved: 'now unanswered', 'not asked': 'not asked' };
  dif.changes.forEach(c => ul.appendChild(el('li', null,
    `<b>${esc(c.name)}</b>: ${esc(state[c.from])} &rarr; ${esc(state[c.to])}.${c.why ? ' ' + esc(c.why) : ''}`)));
  dif.rulesOn.forEach(r => ul.appendChild(el('li', null, `Rule switched <b>on</b>: ${esc(r.title)}.`)));
  dif.rulesOff.forEach(r => ul.appendChild(el('li', null, `Rule switched <b>off</b>: ${esc(r.title)}.`)));
  d.appendChild(ul);
  return d;
}

/* Edits a draft, so Cancel really discards. A single choice re-runs at once. */
function openEditor(row, item) {
  const existing = row.parentElement.querySelector('.editor');
  if (existing) existing.remove();
  const draft = { ...A };
  const ed = el('div', 'editor');
  const apply = () => { const before = evaluate(A); A = draft; save(); pendingDiff = diffRuns(before, evaluate(A)); render(); };
  if (item.help) ed.appendChild(el('p', 'qhelp', esc(item.help)));
  ed.appendChild(buildInput(item, draft, () => { if (item.k !== 'multi') apply(); }));
  const bar = el('div', 'qnav');
  const cancel = el('button', 'btn ghost sm', 'Cancel');
  cancel.onclick = () => ed.remove();
  bar.append(el('div', 'spacer'), cancel);
  if (item.k === 'multi') {
    const go = el('button', 'btn primary sm', 'Re-run the tree');
    go.onclick = apply;
    bar.appendChild(go);
  }
  ed.appendChild(bar);
  row.after(ed);
}

/* A chapter header on the results page borrows the photograph of the
   chapter's first question. */
const CHAP_LEAD = {};
MODULES.forEach(m => { if (!CHAP_LEAD[m.chap] && m.items.length) CHAP_LEAD[m.chap] = m.items[0].id; });

/* Each result section groups its diagnoses under their chapter, in module order. */
function appendGrouped(panel, list) {
  const chapters = [...new Set(list.map(r => r.chap))];
  chapters.forEach(chap => {
    const h = el('div', 'chaphead', photoBand(CHAP_LEAD[chap], { cls: 'chapband' }));
    h.appendChild(el('span', 'chaplabel', esc(chap)));
    panel.appendChild(h);
    list.filter(r => r.chap === chap).forEach(r => panel.appendChild(dxCard(r)));
  });
}

/* One diagnosis card, with its criterion-by-criterion breakdown. */
function dxCard(r) {
  const c = el('article', 'dx ' + r.status);
  const hd = el('div', 'hd');
  hd.appendChild(el('span', 'nm', esc(r.name)));
  const tags = {
    met: 'Criteria met', near: 'Near threshold', unresolved: 'Unanswered',
    out: r.pruned ? `Settled — ${plural(r.skipped, 'question')} not needed` : r.demoted ? 'Excluded by a rule' : 'Ruled out'
  };
  hd.appendChild(el('span', 'tag', esc(tags[r.status])));
  c.appendChild(hd);

  if (r.status !== 'out' && r.blurb) c.appendChild(el('p', 'blurb', esc(r.blurb)));
  if (r.severity) c.appendChild(el('p', 'sev', 'Severity: ' + esc(r.severity)));
  if (r.referOnly && r.status !== 'out') c.appendChild(el('p', 'why', 'Reported as features present only. This branch is not finished by a self-report tool.'));
  if (r.screenOnly && r.status !== 'out') c.appendChild(el('p', 'why', 'A positive screen, not a diagnosis. No personality disorder is ever output here.'));
  if (r.reason) c.appendChild(el('p', 'why', esc(r.reason)));
  r.taints.forEach(t => c.appendChild(el('p', 'taint', esc(t))));

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
  tg.onclick = () => { tg.textContent = c.classList.toggle('open') ? 'Hide criteria' : 'Show every criterion'; };
  c.appendChild(tg);
  return c;
}

/* ==================================================================== boot */
/* Reload returns straight to a saved run; the header button opens the start screen. */
function mindHome() { view = 'landing'; render(); }
setupClickSounds();
setupSiteMusic();
load();
render();
