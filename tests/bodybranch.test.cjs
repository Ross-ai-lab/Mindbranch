const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const D = require('../body-data.js');
const E = require('../body-engine.js');
function fixture(areas, answers={}) {
  const a={};
  for(const q of [...D.context,...D.groups.flatMap(g=>g.items)]) {
    if(q.kind==='yn')a[q.id]='no';
    if(q.kind==='multi')a[q.id]=[];
  }
  return {...a,age:'18_39',anatomy:'unknown',duration:'chronic',course:'stable',concerns:areas,...answers};
}
const row = (a,id)=>E.evaluate(a).all.find(r=>r.id===id);

test('catalog ids, clinical links and question references are coherent',()=>{
  const ids=Object.keys(E.byId);
  assert.equal(ids.length,D.context.length+D.groups.reduce((n,g)=>n+g.items.length,0));
  assert.equal(new Set(D.conditions.map(c=>c.id)).size,D.conditions.length);
  assert.ok(D.conditions.length>=90);
  for(const c of D.conditions){assert.ok(D.sources[c.source],c.id);assert.match(D.sources[c.source].url,/^https:\/\//);assert.ok(c.confirm.length>20,c.id);for(const r of [...c.support,...c.against]){assert.ok(E.byId[r.q],c.id+':'+r.q);assert.ok(r.weight>0);const q=E.byId[r.q];if(q.kind!=='yn')assert.ok(q.opts.some(o=>o.v===r.value),c.id+':'+r.q);}}
});
test('no answers and entirely negative symptoms produce no diagnosis shortlist',()=>{
  assert.equal(E.evaluate({}).candidates.length,0);
  assert.equal(E.evaluate(fixture([])).candidates.length,0);
  assert.equal(E.evaluate(fixture(D.domains.map(d=>d.v))).candidates.length,0);
});
test('not sure and missing are never treated as negative answers',()=>{
  const a=fixture(['energy'],{cold:'yes',weight_gain:'yes',tests:['thyroid'],lab_thyroid:'unsure',lab_tpo:'unsure'});
  const r=row(a,'hypothyroid');assert.equal(r.conflicts.length,0);assert.ok(r.unknown.some(e=>e.q==='lab_thyroid'));
  const unknown=E.evaluate({...a,urgent_now:['unsure']});assert.equal(unknown.safetyUnknown,true);assert.ok(unknown.candidates.every(c=>c.band!=='stronger'));
});
test('every emergency branch interrupts the ordinary differential',()=>{
  for(const id of Object.keys(E.emergencyMap)){
    const r=E.evaluate(fixture(['energy'],{urgent_now:[id],fatigue_daily:'yes'}));assert.ok(r.emergencies.length,id);assert.equal(r.candidates.length,0,id);
  }
});
test('child anatomy, age and current symptom gates protect the adult path',()=>{
  assert.equal(E.evaluate(fixture(['reproductive'],{age:'under18'})).scope,'under18');
  const male=E.queue(fixture(['reproductive'],{anatomy:'prostate'}));assert.ok(!male.some(s=>s.item.id==='preg_possible'));
  const privateAnatomy=E.queue(fixture(['reproductive'],{anatomy:'unknown'}));assert.ok(privateAnatomy.some(s=>s.item.id==='preg_possible'));
});
test('branches shrink after a parent no and reopen on yes or uncertainty',()=>{
  const a=fixture(['sleep'],{sleepy:'yes',sleep_attacks:'yes'});
  assert.ok(E.queue(a).some(s=>s.item.id==='cataplexy'));
  a.sleep_attacks='no';assert.ok(!E.queue(a).some(s=>s.item.id==='cataplexy'));
  a.sleep_attacks='unsure';assert.ok(E.queue(a).some(s=>s.item.id==='cataplexy'));
});
test('uncertain anatomy preserves candidates and accepts the retired saved value',()=>{
  assert.equal(E.sanitize({anatomy:'unknown'}).anatomy,'unsure');
  for(const value of ['unsure','unknown']){
    const r=E.evaluate(fixture(['reproductive'],{anatomy:value,pelvic_cycle:'yes',heavy_period:'yes'}));
    assert.ok(r.candidates.some(c=>c.id==='endometriosis'));
  }
});
test('stale answers from closed branches cannot influence ranking',()=>{
  const a=fixture(['skin'],{tests:[],lab_thyroid:'hyper',lab_trab:'positive',heat:'yes',weight_loss:'yes',rash_shape:'hives'});
  const r=E.evaluate(a);assert.ok(!r.all.some(c=>c.id==='graves'));assert.ok(r.inactiveAnswers.includes('lab_thyroid'));
  const b=fixture(['sleep'],{sleep_attacks:'no',cataplexy:'yes'});assert.ok(!row(b,'narcolepsy').matched.some(e=>e.q==='cataplexy'));
});
test('thyroid discordance is not mistaken for active Graves',()=>{
  const a=fixture(['energy','weight'],{heat:'yes',weight_loss:'yes',fatigue_daily:'yes',tests:['thyroid'],lab_thyroid:'discordant',lab_tpo:'negative',lab_trab:'unsure'});
  assert.ok(!E.evaluate(a).candidates.some(c=>c.id==='graves'));
  assert.ok(row(a,'graves').conflicts.some(e=>e.q==='lab_thyroid'));
});
test('normal anti-TPO is not a Graves exclusion',()=>{
  const a=fixture(['energy','weight'],{heat:'yes',weight_loss:'yes',tests:['thyroid'],lab_thyroid:'hyper',lab_tpo:'negative',lab_trab:'positive'});
  const r=row(a,'graves');assert.equal(r.band,'stronger');assert.ok(!r.conflicts.some(e=>e.q==='lab_tpo'));
});
test('a below-range folate result is required for a deficiency candidate',()=>{
  const a=fixture(['energy'],{tongue:'yes',restrictive_diet:'yes',tests:['b12'],lab_b12:'normal',lab_folate:'normal'});
  assert.ok(!E.evaluate(a).candidates.some(c=>c.id==='folate'));
  a.lab_folate='low';assert.ok(E.evaluate(a).candidates.some(c=>c.id==='folate'));
});
test('one crash or short symptom duration cannot produce a strong ME/CFS result',()=>{
  const a=fixture(['energy'],{fatigue_daily:'yes',pem:'yes',unrefreshing:'yes',duration:'days'});
  assert.ok(!E.evaluate(a).candidates.some(c=>c.id==='mecfs'));
  a.duration='chronic';assert.equal(row(a,'mecfs').band,'stronger');
  a.pem='no';assert.ok(!E.evaluate(a).candidates.some(c=>c.id==='mecfs'));
});
test('anemia and hyperthyroidism weaken a primary orthostatic-tachycardia label',()=>{
  const a=fixture(['dizziness'],{upright:'yes',heart_rise:'yes',bp_drop:'no',orthostatic_chronic:'yes',tests:['cbc','thyroid'],lab_hgb:'low',lab_thyroid:'hyper'});
  assert.ok(!E.evaluate(a).candidates.some(c=>c.id==='pots'));assert.equal(row(a,'pots').conflicts.length,2);
});
test('bleeding and nocturnal diarrhea reduce an IBS match and remain urgent clues',()=>{
  const a=fixture(['digestion','bowel'],{pain_bowel:'yes',stool_pattern:'mixed',bowel_chronic:'yes',warning_signs:['stoolblood'],bowel_night:'yes'});
  const r=E.evaluate(a);assert.ok(r.warnings.some(w=>w.id==='stoolblood'));assert.equal(row(a,'ibs').band,'less_supported');assert.ok(r.candidates.some(c=>c.id==='ibd'));
});
test('fever with flank symptoms keeps the same-day pathway regardless of candidate order',()=>{
  const r=E.evaluate(fixture(['urinary'],{urine_fever:'yes',flank:'yes',urine_burn:'yes',urine_urgency:'yes'}));
  assert.ok(r.warnings.some(w=>w.level==='today'&&w.id==='kidney'));assert.ok(r.candidates.some(c=>c.id==='pyelonephritis'));
});
test('focal abdominal symptoms trigger same-day advice rather than a reassuring bowel label',()=>{
  const r=E.evaluate(fixture(['digestion'],{pain_site:'lower_right',abd_fever:'yes',course:'worse'}));
  assert.ok(r.warnings.some(w=>w.id==='abdominal'&&w.level==='today'));assert.equal(r.candidates[0].id,'appendicitis');
});
test('new exertional chest symptoms and visible urinary blood retain their assessment priorities',()=>{
  assert.ok(E.evaluate(fixture(['heart'],{exertional_chest:'yes',duration:'days'})).warnings.some(w=>w.id==='newchest'));
  assert.ok(E.evaluate(fixture(['urinary'],{urine_blood:'yes'})).warnings.some(w=>w.id==='urineblood'));
});
test('the differential ledger distinguishes uncertain celiac negatives and normal-TSH FT4 elevation',()=>{
  const a=fixture(['bowel','weight'],{tests:['celiac','thyroid'],lab_celiac:'uncertain',lab_thyroid:'discordant'});
  const ids=E.evaluate(a).decisions.map(r=>r.id);assert.ok(ids.includes('thyroid_discordance'));assert.ok(ids.includes('celiac_uncertain_negative'));
});
test('marked known diagnoses move out of the new-candidate list without erasing the reasoning',()=>{
  const a=fixture(['skin'],{rash_shape:'hives',knownDiagnoses:['urticaria']});const r=E.evaluate(a);
  assert.ok(r.knownCandidates.some(c=>c.id==='urticaria'));assert.ok(!r.newCandidates.some(c=>c.id==='urticaria'));
});
test('candidate examples reach the expected leading pattern',()=>{
  const examples=[
    ['sleep_apnea',['sleep'],{snore:'yes',apnea:'yes',sleepy:'yes',sleep_opportunity:'yes'}],
    ['asthma',['breathing'],{wheeze:'yes',airway_triggers:'yes',night_cough:'yes'}],
    ['celiac',['bowel'],{bowel_chronic:'yes',greasy_stool:'yes',celiac_family:'yes',tests:['celiac'],lab_celiac:'positive'}],
    ['kidney_stone',['urinary'],{flank:'yes',colic:'yes',urine_blood:'yes'}],
    ['rheumatoid',['joints'],{joint_swollen:'yes',morning_stiff:'yes',small_symmetric:'yes'}],
    ['migraine',['headache'],{head_pulse:'yes',head_nausea:'yes',aura:'yes',course:'episodes'}],
    ['endometriosis',['reproductive'],{anatomy:'uterus',pelvic_cycle:'yes',heavy_period:'yes'}],
    ['graves',['weight'],{heat:'yes',weight_loss:'yes',tests:['thyroid'],lab_thyroid:'hyper',lab_trab:'positive'}],
    ['adrenal',['energy'],{dark_skin:'yes',salt_craving:'yes',weight_loss:'yes',tests:['cortisol'],lab_cortisol:'low',lab_acth:'high'}]
  ];
  for(const [id,areas,answers] of examples){const r=E.evaluate(fixture(areas,answers));assert.equal(r.candidates[0]?.id,id,`${id}: got ${r.candidates.map(c=>c.id).join(', ')}`);}
});
test('all candidates can be elicited and no source reference is orphaned',()=>{
  for(const c of D.conditions){
    const a=fixture(c.domains,{anatomy:c.anatomy||'unknown',duration:'chronic',tests:['thyroid','cbc','iron','b12','glucose','celiac','cortisol']});
    for(const r of c.support){const q=E.byId[r.q];if(r.not)continue;if(q.kind==='multi')a[r.q]=[...(Array.isArray(a[r.q])?a[r.q]:[]),r.value];else a[r.q]=r.value;}
    // Ensure dependent questions are reachable without overriding the target's
    // own evidence value (such as a no on an absent symptom).
    const enable=rule=>{if(!rule)return;if(rule.all)rule.all.forEach(enable);else if(rule.any)enable(rule.any[0]);else if(!rule.not&&(a[rule.q]===undefined||a[rule.q]==='no'))a[rule.q]=rule.value;};
    for(const r of c.support)enable(E.byId[r.q].when);
    const result=row(a,c.id);assert.ok(result,c.id);assert.ok(['possible','stronger'].includes(result.band),`${c.id}: ${result.band} ${result.score}`);
  }
});
test('invalid imported values, duplicate options and unknown ids are sanitized',()=>{
  const result=E.sanitize({urgent_now:['fake','chest','chest'],age:'child',arbitrary:'yes',concerns:['energy','unsure','heart'],fatigue_daily:123});
  assert.deepEqual(result.urgent_now,['chest']);assert.deepEqual(result.concerns,['unsure']);assert.equal(result.age,undefined);assert.equal(result.arbitrary,undefined);
});
test('invalid-only imported safety options become uncertainty, never a clean negative',()=>{
  const clean=E.sanitize({urgent_now:['not-a-supported-option']});assert.deepEqual(clean.urgent_now,['unsure']);assert.equal(E.evaluate(clean).safetyUnknown,true);
});
test('a universal immune-suppression fever warning works without opening the infection branch',()=>{
  const r=E.evaluate(fixture(['skin'],{warning_signs:['immune']}));assert.ok(r.warnings.some(w=>w.id==='immune'&&w.level==='today'));
});
test('bruising and a low platelet count have a supported candidate and assessment advice',()=>{
  const r=E.evaluate(fixture(['bleeding'],{easy_bruising:'yes',blood_loss:'yes',tests:['cbc'],lab_hgb:'normal',lab_platelets:'low'}));assert.ok(r.candidates.some(c=>c.id==='platelet_disorder'));assert.ok(r.warnings.some(w=>w.id==='bruising'));
});
test('replaying an answer produces a meaningful differential change',()=>{
  const a=fixture(['breathing'],{wheeze:'yes',airway_triggers:'yes',night_cough:'yes'});const before=E.evaluate(a);const after=E.evaluate({...a,wheeze:'no',airway_triggers:'no',night_cough:'no'});
  assert.ok(E.diff(before,after).some(c=>c.id==='asthma'&&c.from==='stronger'&&!['stronger','possible'].includes(c.to)));
});
test('existing Mindbranch engine retains deterministic evaluation and its saved-run key',()=>{
  const ctx=vm.createContext({console});vm.runInContext(fs.readFileSync(require.resolve('../data.js'),'utf8'),ctx);vm.runInContext(fs.readFileSync(require.resolve('../engine.js'),'utf8'),ctx);
  assert.equal(vm.runInContext('JSON.stringify(evaluate({})) === JSON.stringify(evaluate({}))',ctx),true);
  assert.match(fs.readFileSync(require.resolve('../app.js'),'utf8'),/const KEY = 'mindbranch-v1'/);
  assert.match(fs.readFileSync(require.resolve('../body-app.js'),'utf8'),/const KEY = 'bodybranch-v1'/);
});
test('mixed answer patterns retain evidence, urgency and ranking invariants',()=>{
  let seed=20261025;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  for(let iteration=0;iteration<300;iteration++){
    const a=fixture(D.domains.filter(()=>random()>.6).map(d=>d.v));
    for(const q of [...D.context,...D.groups.flatMap(g=>g.items)]){
      if(q.kind==='yn')a[q.id]=['yes','no','unsure'][Math.floor(random()*3)];
      else if(q.kind==='pick')a[q.id]=[...q.opts.map(o=>o.v),'unsure'][Math.floor(random()*(q.opts.length+1))];
    }
    a.age='18_39';a.urgent_now=iteration%30===0?['chest']:[];
    const before=JSON.stringify(a),r=E.evaluate(a);
    assert.equal(JSON.stringify(a),before,'evaluation mutated input');
    assert.equal(new Set(r.candidates.map(c=>c.id)).size,r.candidates.length);
    assert.ok(r.candidates.every(c=>c.coreMatches>0));
    if(r.emergencies.length)assert.equal(r.candidates.length,0);
    for(const c of r.candidates)for(const evidence of [...c.matched,...c.conflicts]){
      assert.ok(r.activeIds.includes(evidence.q));
      assert.notEqual(r.answers[evidence.q],'unsure');
    }
  }
});
