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
  const itemGroup = Object.fromEntries(D.groups.flatMap(g => g.items.map(q => [q.id,g.id])));
  const emergencyMap = {
    chest:['Acute coronary syndrome / heart attack','Persistent chest symptoms with associated warning features need emergency assessment.'],
    breath:['Severe respiratory illness / pulmonary embolism or other acute lung problem','Severe breathing difficulty is an emergency regardless of the cause.'],
    stroke:['Stroke / transient ischemic attack','Sudden focal neurological loss needs immediate assessment even if it improves.'],
    head:['Subarachnoid hemorrhage or another thunderclap-headache cause','An immediately maximal headache needs emergency investigation.'],
    allergy:['Anaphylaxis','Airway or breathing symptoms after an exposure need emergency treatment.'],
    bleed:['Major gastrointestinal or other bleeding','Significant bleeding with faintness can indicate circulatory compromise.'],
    infection:['Meningitis / sepsis or another serious infection','Fever with confusion, neck stiffness, collapse or a purple rash needs emergency assessment.'],
    abdomen:['Acute abdominal or testicular emergency','Severe sudden abdominal/pelvic or testicular pain requires emergency assessment.'],
    pregnancy:['Ectopic pregnancy / pregnancy-related bleeding','Pregnancy-associated severe pain, faintness or heavy bleeding is an emergency.'],
    metabolic:['Diabetic ketoacidosis or another metabolic emergency','Thirst/urination with vomiting, deep rapid breathing or drowsiness needs urgent emergency testing.'],
    spine:['Cauda equina syndrome / spinal compression','New bladder or bowel dysfunction with saddle numbness or leg weakness needs emergency assessment.']
  };
  function answered(q, a) {
    const v = a[q.id];
    return q.kind === 'multi' ? Array.isArray(v) : typeof v === 'string' && v.length > 0;
  }
  function known(q, a) { return answered(q,a) && a[q.id] !== UNKNOWN && !(Array.isArray(a[q.id]) && a[q.id].includes(UNKNOWN)); }
  function matches(rule, a) {
    if (!rule) return true;
    if (rule.all) return rule.all.every(r => matches(r,a));
    if (rule.any) return rule.any.some(r => matches(r,a));
    const value = a[rule.q];
    return Array.isArray(value) ? value.includes(rule.value) : value === rule.value;
  }
  // An uncertain parent preserves its follow-up. An explicit incompatible
  // parent closes it; answers retained from an older path are then inert.
  function eligible(rule, a) {
    if (!rule) return true;
    if (rule.all) return rule.all.every(r => eligible(r,a));
    if (rule.any) return rule.any.some(r => eligible(r,a));
    if (a[rule.q] === UNKNOWN || (Array.isArray(a[rule.q]) && a[rule.q].includes(UNKNOWN))) return true;
    return matches(rule,a);
  }
  function sanitize(input) {
    const clean = {};
    if (!input || typeof input !== 'object' || Array.isArray(input)) return clean;
    for (const q of allItems) {
      const raw = input[q.id];
      const v = q.id === 'anatomy' && raw === 'unknown' ? UNKNOWN : raw;
      const allowed = q.kind === 'yn' ? ['yes','no',UNKNOWN] : [...(q.opts || []).map(o => o.v),UNKNOWN];
      if (q.kind === 'multi' && Array.isArray(v)) {
        const arr = [...new Set(v.filter(x => typeof x === 'string' && allowed.includes(x)))];
        clean[q.id] = arr.includes(UNKNOWN) || (v.length > 0 && arr.length === 0) ? [UNKNOWN] : arr;
      } else if (typeof v === 'string' && allowed.includes(v)) clean[q.id] = v;
    }
    return clean;
  }
  function emergency(a) {
    const values = Array.isArray(a.urgent_now) ? a.urgent_now : [];
    return values.filter(x => emergencyMap[x]).map(x => ({ id:x, name:emergencyMap[x][0], why:emergencyMap[x][1] }));
  }
  function selection(a) {
    const v = Array.isArray(a.concerns) ? a.concerns : [];
    return v.includes(UNKNOWN) ? D.domains.map(x => x.v) : v;
  }
  function groupOpen(g,a) { return g.domains.some(d => selection(a).includes(d)) && eligible(g.when,a); }
  function queue(input) {
    const a = sanitize(input);
    const out = D.context.map(item => ({item,group:'context',section:'The starting picture'}));
    // Return no speculative downstream path until areas have been selected.
    if (!Array.isArray(a.concerns)) return out;
    for (const g of D.groups) {
      if (!groupOpen(g,a)) continue;
      for (const item of g.items) if (eligible(item.when,a)) out.push({ item,group:g.id,section:g.name });
    }
    return out;
  }
  function active(input) {
    const clean = sanitize(input);
    const q = queue(clean);
    const ids = new Set(q.map(s => s.item.id));
    return Object.fromEntries(Object.entries(clean).filter(([id]) => ids.has(id)));
  }
  function evidence(rule,a) {
    const question = byId[rule.q];
    if (!question || !known(question,a)) return { state:'unknown', ...rule };
    return { state:matches(rule,a) ? 'match' : 'different', ...rule };
  }
  function evaluate(input) {
    const clean = sanitize(input);
    const a = active(clean);
    const q = queue(a);
    const emergencies = emergency(a);
    const safetyUnknown = !known(byId.urgent_now,a);
    const scope = a.age === 'under18' ? 'under18' : 'adult';
    const selected = selection(a);
    const openGroups = D.groups.filter(g => groupOpen(g,a));
    const closedGroups = D.groups.filter(g => !groupOpen(g,a));
    const warnings = D.alerts.filter(w => matches(w.rule,a));
    const decisions = D.differentialRules.filter(r => matches(r.rule,a));
    const unanswered = q.filter(s => !known(s.item,a)).map(s => s.item.id);
    const knownSet = new Set(Array.isArray(input && input.knownDiagnoses) ? input.knownDiagnoses : []);
    const rows = [];
    if (!emergencies.length && scope === 'adult') for (const c of D.conditions) {
      if (!c.domains.some(d => selected.includes(d))) continue;
      if (c.anatomy && a.anatomy && a.anatomy !== UNKNOWN && !c.anatomy.includes(a.anatomy)) continue;
      const support = c.support.map(r => evidence(r,a));
      const against = c.against.map(r => evidence(r,a));
      const matched = support.filter(r => r.state === 'match');
      const conflicts = against.filter(r => r.state === 'match');
      const unknown = support.filter(r => r.state === 'unknown');
      // Demographics and timing can refine a pattern but cannot create one.
      const symptomMatches = matched.filter(r => !['age','duration','course','anatomy'].includes(r.q));
      const coreMatches = matched.filter(r => c.core.includes(r.q));
      const positive = matched.reduce((s,r) => s+r.weight,0);
      const negative = conflicts.reduce((s,r) => s+r.weight,0);
      const score = positive - negative;
      const durationMet = !c.durationFloor || a.duration === c.durationFloor;
      let band = 'insufficient';
      if (symptomMatches.length >= 2 && score >= 3 && coreMatches.length) band = 'possible';
      if (symptomMatches.length >= 3 && score >= 7 && coreMatches.length && durationMet) band = 'stronger';
      if (!durationMet && band === 'stronger') band = 'possible';
      if (negative >= positive && conflicts.length) band = 'less_supported';
      if (negative >= 5 && conflicts.some(r => r.weight >= 3)) band = 'less_supported';
      // One highly specific test can make a candidate worth discussing, but
      // does not turn a single self-reported test into a confirmed diagnosis.
      const labCore = coreMatches.some(r => r.q.startsWith('lab_') && r.weight >= 5);
      if (labCore && score >= 4 && band === 'insufficient') band = 'possible';
      const distinctiveCore = coreMatches.some(r => r.weight >= 5);
      if (distinctiveCore && score >= 5 && band === 'insufficient') band = 'possible';
      if (c.durationFloor && a.duration && a.duration !== UNKNOWN && !durationMet && ['stronger','possible'].includes(band)) band = 'insufficient';
      if (safetyUnknown && band === 'stronger') band = 'possible';
      rows.push({ ...c, score, band, matched, conflicts, unknown,
        symptoms:symptomMatches.length, coreMatches:coreMatches.length,
        durationMet, known:knownSet.has(c.id) });
    }
    const bandOrder = { stronger:3,possible:2,insufficient:1,less_supported:0 };
    rows.sort((x,y) => bandOrder[y.band]-bandOrder[x.band] || y.score-x.score || y.coreMatches-x.coreMatches || x.name.localeCompare(y.name));
    const candidates = rows.filter(r => ['stronger','possible'].includes(r.band));
    return { answers:a, emergencies, safetyUnknown, scope, warnings, decisions, candidates,
      newCandidates:candidates.filter(r => !r.known), knownCandidates:candidates.filter(r => r.known),
      other:rows.filter(r => !['stronger','possible'].includes(r.band)), all:rows,
      unanswered, answered:q.length-unanswered.length, total:q.length,
      openGroups:openGroups.map(g=>g.id), closedGroups:closedGroups.map(g=>g.id),
      activeIds:q.map(s=>s.item.id), inactiveAnswers:Object.keys(clean).filter(id=>!Object.hasOwn(a,id)) };
  }
  function nextMissing(input) {
    const a = active(input);
    const q = queue(a);
    return q.findIndex(s => !answered(s.item,a));
  }
  function label(q,v) {
    if (v === UNKNOWN) return 'Not sure';
    if (q.kind === 'yn') return v === 'yes' ? 'Yes' : v === 'no' ? 'No' : 'Unanswered';
    if (q.kind === 'multi') return Array.isArray(v) ? v.length ? v.map(x=>(q.opts.find(o=>o.v===x)||{}).t || 'Not sure').join('; ') : 'None of these' : 'Unanswered';
    return (q.opts.find(o=>o.v===v)||{}).t || 'Unanswered';
  }
  function diff(before,after) {
    const old = Object.fromEntries(before.all.map(r=>[r.id,r]));
    const current = Object.fromEntries(after.all.map(r=>[r.id,r]));
    return [...new Set([...Object.keys(old),...Object.keys(current)])].flatMap(id => {
      const from = old[id], to = current[id];
      if ((from && from.band) === (to && to.band) && (from && from.score) === (to && to.score)) return [];
      return [{id,name:(to||from).name,from:from ? from.band:'not_open',to:to ? to.band:'not_open'}];
    });
  }
  return { queue,evaluate,sanitize,active,matches,eligible,answered,known,byId,itemGroup,nextMissing,label,diff,emergency,emergencyMap,UNKNOWN };
});
