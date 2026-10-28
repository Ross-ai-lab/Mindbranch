const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
// The Mindbranch scripts are browser globals; run them in one shared context.
const M = vm.createContext({});
for (const f of ['data.js', 'engine.js']) vm.runInContext(fs.readFileSync(require.resolve('../' + f), 'utf8'), M);
vm.runInContext('Object.assign(globalThis, { CONTEXT, SCREEN, MODULES, RULES, RULE_ITEMS, MOD, buildQueue, evaluate, evalModule, diffRuns, openedModules })', M);
const { CONTEXT, SCREEN, MODULES, RULES, RULE_ITEMS, buildQueue, evaluate, evalModule, diffRuns, openedModules } = M;
const ids = A => buildQueue(A).map(s => s.item.id);
// Framing all no, every screen no, then the listed overrides.
const base = (over = {}) => {
  const A = {};
  CONTEXT.forEach(c => { A[c.id] = c.k === 'yn' ? 'no' : c.opts[0].v; });
  SCREEN.forEach(s => { A[s.id] = 'no'; });
  return Object.assign(A, over);
};
const status = (A, id) => evaluate(A).results[id];
// Answer every queued question with `pick(item)` until the queue is exhausted.
const complete = (A, pick) => { for (let s; (s = buildQueue(A).find(s => A[s.item.id] === undefined));) A[s.item.id] = pick(s.item); return A; };

test('every id a criterion, near test or rule reads exists', () => {
  const known = new Set([...CONTEXT, ...SCREEN, ...MODULES.flatMap(m => m.items || [])].map(i => i.id));
  const reads = src => [...src.matchAll(/\b(?:n|yes|notNo|is|has)\(a, '([a-z_]+)'|\b[aA]\.([a-z_]+)\b/g)].map(m => m[1] || m[2]);
  for (const m of MODULES) for (const f of [...m.criteria.map(c => c.test), m.near, m.severity].filter(Boolean))
    for (const id of reads(String(f))) assert.ok(known.has(id), `${m.id} reads missing item ${id}`);
  for (const r of RULES) for (const id of reads(String(r.fire))) assert.ok(known.has(id) || ['status'].includes(id), `${r.id} reads missing item ${id}`);
  assert.equal(new Set([...known]).size, [...CONTEXT, ...SCREEN, ...MODULES.flatMap(m => m.items || [])].filter((i, n, all) => all.findIndex(j => j.id === i.id) === n).length);
});

test('evaluation is deterministic and never mutates the answers', () => {
  const A = complete(base({ s_dep: 'yes', s_gad: 'unsure' }), it => it.k === 'yn' ? 'yes' : it.k === 'multi' ? it.opts.map(o => o.v) : it.opts[0].v);
  const before = JSON.stringify(A);
  assert.equal(JSON.stringify(evaluate(A)), JSON.stringify(evaluate(A)));
  assert.equal(JSON.stringify(A), before);
});

test('a yes or not-sure screen opens its modules and a no keeps them shut', () => {
  assert.deepEqual([...openedModules(base({ s_pan: 'yes' }))], ['panic']);
  assert.deepEqual([...openedModules(base({ s_man: 'unsure' }))], ['manic', 'hypo']);
  assert.deepEqual([...openedModules(base({ c_stress: 'yes' }))], ['adjust']);
  assert.deepEqual([...openedModules(base())], []);
});

test('framing and screen answers are asked once, never again inside a module', () => {
  const A = base({ s_dep: 'yes', s_anh: 'yes', s_pdd: 'yes', s_pan: 'yes', s_gad: 'yes', s_eat_b: 'yes', s_hoard: 'yes', c_stress: 'yes' });
  const q = ids(A);
  assert.equal(new Set(q).size, q.length);
  const texts = buildQueue(A).map(s => s.item.q);
  assert.equal(new Set(texts).size, texts.length, 'two questions share the same wording');
});

test('a criterion fed by a screen keeps the strictness it had', () => {
  // Two years of low mood must be a yes to be met; not sure stays near, never a no.
  const A = complete(base({ s_pdd: 'unsure' }), it => it.k === 'yn' ? (it.id === 'pdd_gap' ? 'no' : 'yes') : it.opts.map(o => o.v));
  assert.equal(status(A, 'pdd').status, 'near');
  A.s_pdd = 'yes'; assert.equal(status(A, 'pdd').status, 'met');
  // Panic's recurrent-attack criterion accepted not sure before, and still does.
  const P = base({ s_pan: 'unsure', pan_sx: ['hea', 'swe', 'tre', 'bre'], pan_cue: 'a', pan_wor: 'a' });
  assert.equal(status(P, 'panic').status, 'met');
});

test('a group is abandoned only when no completion could meet or approach criteria', () => {
  const A = base({ s_ptsd: 'yes', pt_eve: 'e' });
  assert.ok(evaluate(A).pruned.some(r => r.id === 'ptsd'));
  assert.ok(!ids(A).includes('pt_aro'));
  A.pt_eve = 'a';
  assert.ok(ids(A).includes('pt_aro'));
});

test('every possible completion of an abandoned group really is out', () => {
  // Brute-force the pruning claim on small groups with random answered prefixes.
  let seed = 7;
  const rnd = n => { seed = (Math.imul(seed, 1103515245) + 12345) >>> 0; return seed % n; };
  const value = it => it.k === 'yn' ? ['yes', 'no', 'unsure'][rnd(3)] : it.k === 'pick' ? it.opts[rnd(it.opts.length)].v : it.opts.filter(() => rnd(2)).map(o => o.v);
  for (const m of MODULES.filter(m => m.items.length && m.items.length <= 4 && !m.shared)) {
    const gate = [...CONTEXT, ...SCREEN].find(s => (s.opens || []).includes(m.id));
    for (let k = 0; k < 40; k++) {
      const A = base({ [gate.id]: ['yes', 'unsure'][rnd(2)] });
      m.items.slice(0, 1 + rnd(m.items.length - 1)).forEach(it => { A[it.id] = value(it); });
      if (!evaluate(A).pruned.some(r => r.id === m.id)) continue;
      for (let t = 0; t < 60; t++) {
        const B = { ...A };
        m.items.forEach(it => { if (B[it.id] === undefined) B[it.id] = value(it); });
        const r = evalModule(m, B, {});
        assert.ok(!['met', 'near'].includes(r.status), `${m.id} was abandoned but ${JSON.stringify(B)} reaches ${r.status}`);
      }
    }
  }
});

test('regression: alcohol near-threshold does not fall as criteria are ticked', () => {
  // Skipping the criteria list and denying impairment used to abandon the module,
  // although ticking one criterion would have made it near threshold.
  const A = base({ s_aud: 'yes', au_imp: 'no' });
  assert.ok(!evaluate(A).pruned.some(r => r.id === 'aud'));
  assert.equal(status(A, 'aud').status, 'unresolved');
  A.au_c = ['more']; assert.equal(status(A, 'aud').status, 'near');
});

test('an unanswered item read by a precedence rule is never pruned', () => {
  for (const id of ['bn_com', 'ps_moo', 'gad_foc', 'pan_cue', 'bdd_wgt', 'ad_ons']) assert.ok(RULE_ITEMS.has(id), id);
  // Panic cannot meet criteria with no attack symptoms, but R6 still needs the cue answer.
  const A = base({ s_pan: 'yes', pan_sx: [] });
  assert.ok(ids(A).includes('pan_cue'));
  assert.ok(!evaluate(A).pruned.some(r => r.id === 'panic'));
});

test('shared question groups are pruned together and counted once', () => {
  const A = base({ s_man: 'yes', man_mood: 'd', man_dur: 'a' });
  const run = evaluate(A);
  assert.ok(run.pruned.some(r => r.id === 'manic') && run.pruned.some(r => r.id === 'hypo'));
  assert.equal(run.skippedCount, 2, 'man_sx and man_imp, once for both bipolar modules');
});

test('a skipped or revived question leaves its module unresolved rather than scored', () => {
  const A = base({ s_soc: 'yes', soc_sit: ['con'] });
  assert.equal(status(A, 'sad').status, 'unresolved');
  assert.ok(evaluate(A).pendingCount > 0);
  const B = base({ s_pan: 'no' }); assert.equal(status(B, 'panic'), undefined);
  B.s_pan = 'yes'; assert.equal(status(B, 'panic').status, 'unresolved');
});

test('precedence rules demote the loser and explain it', () => {
  const all = it => it.k === 'yn' ? (['bdd_wgt', 'ps_moo', 'ps_sub', 'pdd_gap', 'cyc_gap', 'adj_end'].includes(it.id) ? 'no' : 'yes') : it.k === 'multi' ? it.opts.map(o => o.v) : it.opts[0].v;
  const A = complete(base({ s_dep: 'yes', s_man: 'yes', man_dur: 'c' }), all);
  const run = evaluate(A);
  assert.equal(run.results.manic.status, 'met');
  assert.equal(run.results.mde.status, 'out'); assert.ok(run.results.mde.demoted);
  assert.ok(run.ledger.some(l => l.id === 'R1'));
  const flipped = evaluate({ ...A, man_imp: 'b' });
  const d = diffRuns(run, flipped);
  assert.ok(d.changes.some(c => c.id === 'hypo' && c.to === 'met'));
  assert.ok(d.rulesOn.some(r => r.id === 'R2'));
});

test('a substance or medical framing answer taints the results instead of hiding them', () => {
  const A = complete(base({ c_sub: 'yes', s_ins: 'yes' }), it => it.k === 'yn' ? 'yes' : it.opts.map(o => o.v));
  const r = status(A, 'insomnia');
  assert.equal(r.status, 'met');
  assert.ok(r.taints.length);
});
