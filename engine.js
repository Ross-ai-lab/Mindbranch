/* ============================================================================
   Mindbranch — evaluation engine
   ----------------------------------------------------------------------------
   Pure functions. Given the full answer map it returns the same result every
   time, which is what makes flipping one answer and re-running meaningful.
   ========================================================================== */

const MOD = Object.fromEntries(MODULES.map(m => [m.id, m]));

/* Which modules did the screen open? A "not sure" opens the module too —
   over-opening costs questions, under-opening costs a diagnosis. Adjustment
   disorder, the residual category, is opened by the framing stressor item. */
function openedModules(A) {
  const set = new Set();
  [...CONTEXT, ...SCREEN].forEach(s => {
    if (s.opens && (A[s.id] === 'yes' || A[s.id] === 'unsure')) s.opens.forEach(m => set.add(m));
  });
  return MODULES.filter(m => set.has(m.id)).map(m => m.id);
}

/* ============================================================ PRUNE GROUPS */
/* A prune group is the smallest unit that can be abandoned. Usually one
   module, but modules sharing an item block (Bipolar I and II both run off the
   mania questions) must be judged together — dropping the block because
   Bipolar I is dead would silently take Bipolar II's evidence with it. */
function pruneGroups(open) {
  const by = new Map();
  open.forEach(id => {
    const m = MOD[id];
    const key = m.shared || m.id;
    if (!by.has(key)) by.set(key, { key, mods: [], items: [], seen: new Set() });
    by.get(key).mods.push(m);
  });
  by.forEach(g => g.mods.forEach(m => (m.items || []).forEach(it => {
    if (!g.seen.has(it.id)) { g.seen.add(it.id); g.items.push(it); }
  })));
  return [...by.values()];
}

/* Every value an unanswered item could still take, most-favourable first so
   a live group exits on the first combination. Multi items try only "all
   ticked", which is exact because every multi criterion and near-threshold
   test is a count that only rises as options are ticked.

   yn MUST enumerate all three. "yes" is not universally the helpful answer:
   several criteria are satisfied by a NO (persistent depressive disorder needs
   no two-month gap; adjustment disorder needs the stressor not to have ended
   six months ago). Trying only "yes" would declare those dead and stop asking
   questions that mattered — the exact failure this whole mechanism must not
   have. */
function candidates(it) {
  if (it.k === 'multi') return [(it.opts || []).map(o => o.v)];
  if (it.k === 'yn') return ['yes', 'unsure', 'no'];
  return it.opts.map(o => o.v);
}

/* ------------------------------------------------------------------------
   Items that a PRECEDENCE RULE reads.

   A group can be dead on its own terms and still owe an answer to something
   else: R8 decides binge-eating disorder by reading bulimia's compensatory-
   behaviour answer. Prune bulimia and that question disappears, the rule never
   fires, and binge-eating disorder survives when it should have been excluded.
   Nothing errors — the wrong answer just quietly appears. A 300-case random
   comparison caught it; group boundaries alone would not have.

   Rather than hand-list the dependencies (which is precisely the thing that
   drifts out of step the next time a rule is edited), read them off the rule
   source. A new rule that touches a new item is covered the moment it is
   written, with nothing to remember.
   ------------------------------------------------------------------------ */
const RULE_ITEMS = (() => {
  const s = new Set();
  const dot = /\bA\s*\.\s*([A-Za-z_]\w*)/g;
  const idx = /\bA\s*\[\s*['"]([^'"]+)['"]\s*\]/g;
  RULES.forEach(r => {
    const src = String(r.fire);
    let m;
    while ((m = dot.exec(src))) s.add(m[1]);
    while ((m = idx.exec(src))) s.add(m[1]);
  });
  return s;
})();

/* Largest search this will attempt. The widest real group is Social Anxiety at
   729 combinations; the cap only exists so a future module with many pick items
   degrades to "do not prune" rather than to a slow page. Refusing to prune is
   always safe — it just asks a question it did not have to. */
const COMBO_CAP = 2048;

/* Dead = no completion of the still-unanswered items can bring ANY module in
   the group to met or near. Derived from the criteria themselves, so it cannot
   fall out of step with them. */
function groupDead(g, A, R) {
  const un = g.items.filter(i => A[i.id] === undefined);
  if (!un.length) return false;
  // Owed to a precedence rule, not to this group. Keep asking. Note this is
  // tested against the UNANSWERED items only, so a group still gets pruned for
  // whatever remains once the rule has the answer it needed.
  if (un.some(i => RULE_ITEMS.has(i.id))) return false;
  const ch = un.map(candidates);
  const combos = ch.reduce((n, c) => n * c.length, 1);
  if (combos > COMBO_CAP) return false;
  for (let c = 0; c < combos; c++) {
    const t = Object.assign({}, A);
    let k = c;
    for (let i = 0; i < un.length; i++) {
      t[un[i].id] = ch[i][k % ch[i].length];
      k = Math.floor(k / ch[i].length);
    }
    for (const m of g.mods) {
      const r = evalModule(m, t, R);
      if (r.status === 'met' || r.status === 'near') return false;
    }
  }
  return true;
}

/* buildQueue and evaluate run back to back on the same answers every render, and
   the deadness search is the expensive half (~20 ms in the state where most
   groups are dead and must be enumerated in full). One-entry memo, keyed on the
   whole answer map so it can never serve a stale verdict.

   Only the groups and their deadness are cached. `R` is deliberately NOT —
   evaluate() mutates it (demote, taint, unresolved), so a shared copy would let
   one run's rulings leak into the next. */
let _memoKey = null, _memoVal = null;
function analysis(A) {
  const k = JSON.stringify(A);
  if (k === _memoKey) return _memoVal;
  const R = baseResults(A);
  const groups = pruneGroups(openedModules(A));
  const dead = new Map(groups.map(g => [g.key, groupDead(g, A, R)]));
  _memoKey = k; _memoVal = { groups, dead };
  return _memoVal;
}

/* Statuses only — what the prune test and any cross-module criterion need.
   Two passes because some criteria read another module's result (Bipolar II
   reads the depressive episode): the first seeds, the second settles. */
function baseResults(A) {
  const open = openedModules(A);
  const R = {};
  open.forEach(id => { R[id] = evalModule(MOD[id], A, R); });
  open.forEach(id => { R[id] = evalModule(MOD[id], A, R); });
  return R;
}

/* The full ordered question list for the current answer state. Recomputed after
   every answer, so opening a module inserts its questions in place — and a
   group proven dead drops its remaining ones, which is why the total can go
   DOWN as you answer. Answered questions are never dropped: the path replay and
   the Back button both need them. */
function buildQueue(A) {
  const q = [];
  CONTEXT.forEach(c => q.push({ phase: 'context', sect: 'Framing', item: c }));
  SCREEN.forEach(s => q.push({ phase: 'screen', sect: 'Screening', item: s }));
  const { groups, dead: deadMap } = analysis(A);
  const emitted = new Set();
  groups.forEach(g => {
    const dead = deadMap.get(g.key);
    g.items.forEach(it => {
      if (emitted.has(it.id)) return;
      emitted.add(it.id);
      if (dead && A[it.id] === undefined) return;
      q.push({ phase: 'module', sect: g.mods[0].name, mod: g.mods[0].id, item: it });
    });
  });
  return q;
}

/* Evaluate one module. Returns status plus every criterion's verdict, so the
   "why" panel can show the whole chain rather than only the first failure. */
function evalModule(m, A, R) {
  const rows = (m.criteria || []).map(c => {
    let pass = false;
    try { pass = !!c.test(A, R); } catch (e) {}
    return { id: c.id, label: c.label, pass, why: pass ? null : safeWhy(c, A) };
  });
  const failed = rows.filter(r => !r.pass);
  let status;
  if (!rows.length) status = 'out';
  else if (!failed.length) status = 'met';
  else if (m.near && safeNear(m, A)) status = 'near';
  else status = 'out';
  return {
    id: m.id, name: m.name, chap: m.chap, blurb: m.blurb,
    referOnly: !!m.referOnly, screenOnly: !!m.screenOnly,
    status, rows,
    reason: failed.length ? failed[0].why : null,
    failedAt: failed.length ? failed[0].id : null,
    severity: m.severity ? m.severity(A) : null,
    taints: []
  };
}

function safeWhy(c, A) { try { return c.why(A); } catch (e) { return 'Could not be evaluated from the answers given.'; } }
function safeNear(m, A) { try { return !!m.near(A); } catch (e) { return false; } }

/* The full run. */
function evaluate(A) {
  const open = openedModules(A);
  const R = baseResults(A);

  /* Mark what was abandoned and what is still owed an answer. A module with
     unanswered questions that is NOT dead has no honest verdict yet — scoring
     it would silently report a missing answer as a negative one. That happens
     after a Skip, and after a replay revives a module that had been pruned. */
  const { groups, dead: deadMap } = analysis(A);
  let skippedCount = 0, pendingCount = 0;
  groups.forEach(g => {
    const owed = g.items.filter(i => A[i.id] === undefined).length;
    if (!owed) return;
    const dead = deadMap.get(g.key);
    // Counted once per group: Bipolar I and II share one set of questions.
    if (dead) skippedCount += owed; else pendingCount += owed;
    g.mods.forEach(m => {
      if (dead) { R[m.id].pruned = true; R[m.id].skipped = owed; }
      else { R[m.id].status = 'unresolved'; R[m.id].pending = owed; }
    });
  });

  const ledger = [];
  const out = {
    demote(id, why) {
      if (!R[id] || R[id].status === 'unresolved') return;
      R[id].status = 'out'; R[id].reason = why; R[id].demoted = true;
    },
    taint(id, why) { if (R[id]) R[id].taints.push(why); }
  };

  RULES.forEach(rule => {
    let msg;
    try { msg = rule.fire(R, A, A, out); } catch (e) { msg = null; }
    if (msg) ledger.push({ id: rule.id, title: rule.title, msg });
  });

  const all = open.map(id => R[id]);
  return {
    results: R, opened: open, ledger,
    met: all.filter(r => r.status === 'met'),
    near: all.filter(r => r.status === 'near'),
    ruled: all.filter(r => r.status === 'out' && !r.pruned),
    pruned: all.filter(r => r.pruned),
    unresolved: all.filter(r => r.status === 'unresolved'),
    skippedCount, pendingCount
  };
}

/* Compare two runs so a flipped answer can report what actually moved. */
function diffRuns(before, after) {
  const changes = [];
  const ids = new Set([...Object.keys(before.results), ...Object.keys(after.results)]);
  ids.forEach(id => {
    const b = before.results[id], a = after.results[id];
    if (!b && a) { changes.push({ id, name: a.name, from: 'not asked', to: a.status }); return; }
    if (b && !a) { changes.push({ id, name: b.name, from: b.status, to: 'not asked' }); return; }
    const bs = b.pruned ? 'abandoned' : b.status;
    const as = a.pruned ? 'abandoned' : a.status;
    if (bs !== as) changes.push({ id, name: a.name, from: bs, to: as, why: a.reason });
  });
  const bl = new Set(before.ledger.map(l => l.id));
  const al = new Set(after.ledger.map(l => l.id));
  return {
    changes,
    rulesOn: after.ledger.filter(l => !bl.has(l.id)),
    rulesOff: before.ledger.filter(l => !al.has(l.id))
  };
}
