/* Pure Bodybranch evaluation. Unknown and skipped answers are not negatives.
   Only questions reachable on the current path may contribute evidence. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./body-data.js'));
  else root.BodybranchEngine = factory(root.BodybranchData);
})(globalThis, function (D) {
  'use strict';
  const UNKNOWN = 'unsure';
  const allItems = [...D.context, ...D.groups.flatMap(g => g.items)];
  const byId = Object.fromEntries(allItems.map(q => [q.id, q]));
  const emergencies = Object.fromEntries(byId.urgent_now.opts.map(o => [o.v, o]));
  const BANDS = { stronger:3, possible:2, insufficient:1, less_supported:0 };
  const CONCERNS = D.context.indexOf(byId.concerns);
  const leaves = rule => !rule ? [] : rule.all || rule.any ? (rule.all || rule.any).flatMap(leaves) : [rule.q];
  // Questions an alert reads are always asked once their branch is open.
  const alertItems = D.alerts.flatMap(w => leaves(w.rule));
  const unsure = v => v === UNKNOWN || (Array.isArray(v) && v.includes(UNKNOWN));

  function answered(q, a) {
    const v = a[q.id];
    return q.kind === 'multi' ? Array.isArray(v) : typeof v === 'string' && v.length > 0;
  }
  function known(q, a) { return answered(q,a) && !unsure(a[q.id]); }
  function matches(rule, a) {
    if (!rule) return true;
    if (rule.all) return rule.all.every(r => matches(r,a));
    if (rule.any) return rule.any.some(r => matches(r,a));
    const value = a[rule.q];
    const hit = Array.isArray(value) ? value.includes(rule.value) : value === rule.value;
    return rule.not ? !hit : hit;
  }
  // An uncertain parent preserves its follow-up. An explicit incompatible
  // parent closes it; answers retained from an older path are then inert.
  function eligible(rule, a) {
    if (!rule) return true;
    if (rule.all) return rule.all.every(r => eligible(r,a));
    if (rule.any) return rule.any.some(r => eligible(r,a));
    return unsure(a[rule.q]) || matches(rule,a);
  }
  function sanitize(input) {
    const clean = {};
    if (!input || typeof input !== 'object' || Array.isArray(input)) return clean;
    for (const q of allItems) {
      const raw = input[q.id];
      const v = q.id === 'anatomy' && raw === 'unknown' ? UNKNOWN : raw;   // retired saved value
      const allowed = q.kind === 'yn' ? ['yes','no',UNKNOWN] : [...q.opts.map(o => o.v),UNKNOWN];
      if (q.kind === 'multi' && Array.isArray(v)) {
        const arr = [...new Set(v.filter(x => allowed.includes(x)))];
        clean[q.id] = arr.includes(UNKNOWN) || (v.length > 0 && arr.length === 0) ? [UNKNOWN] : arr;
      } else if (q.kind !== 'multi' && allowed.includes(v)) clean[q.id] = v;
    }
    return clean;
  }
  function emergency(a) {
    return (Array.isArray(a.urgent_now) ? a.urgent_now : []).filter(x => emergencies[x]).map(x => emergencies[x]);
  }
  function selection(a) {
    const v = Array.isArray(a.concerns) ? a.concerns : [];
    return v.includes(UNKNOWN) ? D.domains.map(x => x.v) : v;
  }
  // Candidates kept in play by the selected areas and anatomy; only these are ranked.
  function inPlay(a) {
    const selected = selection(a);
    return D.conditions.filter(c => c.domains.some(d => selected.includes(d)) &&
      !(c.anatomy && a.anatomy && a.anatomy !== UNKNOWN && c.anatomy !== a.anatomy));
  }
  function groupOpen(g,a) { return g.domains.some(d => selection(a).includes(d)) && eligible(g.when,a); }
  /* The ordered path. A question in an open branch is asked only when a
     candidate in play or an alert reads it, or it gates one that is asked:
     nothing else can change the result. Gates read only answers already on
     the path, so a hidden parent's stale answer cannot keep a grandchild
     open. Parents precede their children. */
  function queue(input) {
    const a = sanitize(input);
    const step = (item,group,section) => ({ item,group,section });
    // No speculative downstream path until the areas have been chosen.
    if (!Array.isArray(a.concerns)) return D.context.slice(0, CONCERNS + 1).map(q => step(q,'context','The starting picture'));
    const cands = inPlay(a);
    const open = D.groups.filter(g => groupOpen(g,a));
    const askable = [...D.context, ...open.flatMap(g => g.items)];
    const need = new Set(['urgent_now', 'age', 'concerns', ...alertItems, ...open.flatMap(g => leaves(g.when)),
      ...cands.flatMap(c => [...c.support, ...c.against].map(r => r.q)), ...(cands.some(c => c.anatomy) ? ['anatomy'] : [])]);
    for (const q of [...askable].reverse()) if (need.has(q.id)) leaves(q.when).forEach(p => need.add(p));
    const reach = {}, out = [];
    for (const q of D.context) if (need.has(q.id)) { out.push(step(q,'context','The starting picture')); reach[q.id] = a[q.id]; }
    for (const g of open) for (const q of g.items) {
      if (!need.has(q.id) || !eligible(q.when,reach)) continue;
      out.push(step(q,g.id,g.name)); reach[q.id] = a[q.id];
    }
    return out;
  }
  function active(input) {
    const clean = sanitize(input);
    const ids = new Set(queue(clean).map(s => s.item.id));
    return Object.fromEntries(Object.entries(clean).filter(([id]) => ids.has(id)));
  }
  function evidence(rules,a,state) {
    return rules.filter(r => (!known(byId[r.q],a) ? 'unknown' : matches(r,a) ? 'match' : 'different') === state);
  }
  function rank(c, a, safetyUnknown) {
    const matched = evidence(c.support,a,'match'), conflicts = evidence(c.against,a,'match');
    // Demographics and timing can refine a pattern but cannot create one.
    const symptoms = matched.filter(r => !['age','duration','course','anatomy'].includes(r.q)).length;
    const core = matched.filter(r => c.core.includes(r.q));
    const positive = matched.reduce((s,r) => s+r.weight,0);
    const negative = conflicts.reduce((s,r) => s+r.weight,0);
    const score = positive - negative;
    const durationMet = !c.durationFloor || a.duration === c.durationFloor;
    let band = 'insufficient';
    if (core.length && symptoms >= 2 && score >= 3) band = 'possible';
    if (core.length && symptoms >= 3 && score >= 7 && durationMet && !safetyUnknown) band = 'stronger';
    if ((conflicts.length && negative >= positive) || (negative >= 5 && conflicts.some(r => r.weight >= 3))) band = 'less_supported';
    // One highly specific test or feature makes a candidate worth discussing,
    // but a single self-reported clue never becomes a stronger match.
    if (band === 'insufficient' && core.some(r => r.weight >= 5 && score >= (r.q.startsWith('lab_') ? 4 : 5))) band = 'possible';
    // A known duration below the candidate's floor keeps it off the shortlist.
    if (band === 'possible' && !durationMet && known(byId.duration,a)) band = 'insufficient';
    return { ...c, score, band, matched, conflicts, unknown:evidence(c.support,a,'unknown'),
      symptoms, coreMatches:core.length, durationMet };
  }
  function evaluate(input) {
    const clean = sanitize(input);
    const a = active(clean);
    const q = queue(a);
    const urgent = emergency(a);
    const safetyUnknown = !known(byId.urgent_now,a);
    const scope = a.age === 'under18' ? 'under18' : 'adult';
    const knownSet = new Set(Array.isArray(input && input.knownDiagnoses) ? input.knownDiagnoses : []);
    const rows = urgent.length || scope !== 'adult' ? [] : inPlay(a)
      .map(c => ({ ...rank(c,a,safetyUnknown), known:knownSet.has(c.id) }))
      .sort((x,y) => BANDS[y.band]-BANDS[x.band] || y.score-x.score || y.coreMatches-x.coreMatches || x.name.localeCompare(y.name));
    const candidates = rows.filter(r => BANDS[r.band] >= 2);
    const unanswered = q.filter(s => !known(s.item,a)).map(s => s.item.id);
    const asked = new Set(q.map(s => s.group));
    return { answers:a, emergencies:urgent, safetyUnknown, scope,
      warnings:D.alerts.filter(w => matches(w.rule,a)), decisions:D.differentialRules.filter(r => matches(r.rule,a)),
      candidates, newCandidates:candidates.filter(r => !r.known), knownCandidates:candidates.filter(r => r.known),
      other:rows.filter(r => BANDS[r.band] < 2), all:rows,
      unanswered, answered:q.length-unanswered.length, total:q.length,
      openGroups:D.groups.filter(g => asked.has(g.id)).map(g => g.id), closedGroups:D.groups.filter(g => !asked.has(g.id)).map(g => g.id),
      activeIds:q.map(s => s.item.id), inactiveAnswers:Object.keys(clean).filter(id => !Object.hasOwn(a,id)) };
  }
  function label(q,v) {
    if (v === UNKNOWN) return 'Not sure';
    if (q.kind === 'yn') return v === 'yes' ? 'Yes' : v === 'no' ? 'No' : 'Unanswered';
    if (q.kind === 'multi') return !Array.isArray(v) ? 'Unanswered' : v.length ? v.map(x => (q.opts.find(o => o.v === x) || {}).t || 'Not sure').join('; ') : 'None of these';
    return (q.opts.find(o => o.v === v) || {}).t || 'Unanswered';
  }
  // Only a changed band is a meaningful change; score drift inside a band is not.
  function diff(before,after) {
    const find = (run,id) => run.all.find(r => r.id === id);
    const band = (run,id) => (find(run,id) || {}).band || 'not_open';
    return [...new Set([...before.all,...after.all].map(r => r.id))].filter(id => band(before,id) !== band(after,id))
      .map(id => ({ id, name:(find(after,id) || find(before,id)).name, from:band(before,id), to:band(after,id) }));
  }
  return { queue,evaluate,sanitize,active,matches,eligible,answered,known,byId,label,diff,emergency,emergencies,UNKNOWN };
});
