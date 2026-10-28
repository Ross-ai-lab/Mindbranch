/* Bodybranch UI, plus the tab routing shared with Mindbranch. */
(function () {
  'use strict';
  const D = window.BodybranchData, E = window.BodybranchEngine;
  const KEY = 'bodybranch-v1';
  const root = document.getElementById('body-app');
  const esc = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const h = (tag,cls,html) => {const node=document.createElement(tag);if(cls)node.className=cls;if(html!==undefined)node.innerHTML=html;return node;};
  const btn = (text,fn,cls='btn') => {const b=h('button',cls,esc(text));b.type='button';b.addEventListener('click',fn);return b;};
  const plural = (n,word) => `${n} ${word}${n===1?'':'s'}`;
  const bandNames = {stronger:'Stronger pattern match',possible:'Possible candidate',insufficient:'Not enough support',less_supported:'Conflicting evidence',not_open:'Branch not open'};
  const fresh = () => ({answers:{},cursor:0,view:'quiz',knownDiagnoses:[]});
  let state = {...fresh(),view:'landing'};
  let mode = 'mindbranch', priorRun = null, editFromResult = false, lastRenderedView = null;
  const envelope = () => JSON.stringify({app:'Bodybranch',version:D.version,...state},null,2);
  function save() {try {localStorage.setItem(KEY,envelope());}catch(e){}}
  /* Saved runs and imports accept only the versioned envelope and known values. */
  function validateRun(value) {
    if (!value || value.app!=='Bodybranch' || value.version!==D.version || !value.answers || typeof value.answers!=='object' || Array.isArray(value.answers)) return null;
    return {answers:E.sanitize(value.answers),
      cursor:Number.isSafeInteger(value.cursor)&&value.cursor>=0?value.cursor:0,
      view:value.view==='results'?'results':'quiz',
      knownDiagnoses:Array.isArray(value.knownDiagnoses)?value.knownDiagnoses.filter(id=>D.conditions.some(c=>c.id===id)):[]};
  }
  function readSaved() {
    try {const run=validateRun(JSON.parse(localStorage.getItem(KEY)||'null'));return run&&Object.keys(run.answers).length?run:null;}catch(e){return null;}
  }
  function evaluate() {return E.evaluate({...state.answers,knownDiagnoses:state.knownDiagnoses});}
  function download(name,content,type) {
    const url=URL.createObjectURL(new Blob([content],{type}));
    const a=h('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function go(view,focus=true) {state.view=view;save();render(focus);}
  function startNew() {
    if(readSaved()&&!confirm('Replace the saved Bodybranch run? Export it first if you want to keep it.'))return;
    state=fresh();priorRun=null;editFromResult=false;go('quiz');
  }
  function bodyArt() {
    return `<svg class="bb-anatomy" viewBox="0 0 460 480" role="img" aria-label="A branching map linking the body’s systems">
      <defs><radialGradient id="bb-wash"><stop stop-color="#fffaf0"/><stop offset="1" stop-color="#e5efdf"/></radialGradient></defs>
      <circle cx="230" cy="240" r="205" fill="url(#bb-wash)"/><g class="bb-orbits" fill="none" stroke="#8ba58d" stroke-width="1"><ellipse cx="230" cy="240" rx="210" ry="125" transform="rotate(-28 230 240)"/><ellipse cx="230" cy="240" rx="150" ry="210" transform="rotate(28 230 240)"/></g>
      <g fill="none" stroke="#416e58" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="230" cy="89" r="30"/><path d="M213 120l-3 18-45 16-19 98 18 7 21-76-4 97 17 128h25l7-113 7 113h25l17-128-4-97 21 76 18-7-19-98-45-16-3-18"/>
      <path d="M230 146v69m-9-54c-29 1-35 19-35 43s13 29 32 20zm18 0c29 1 35 19 35 43s-13 29-32 20z" stroke="#689788"/>
      <path d="M234 200c-15-15-29 0-20 13l20 16 17-18c9-15-7-26-17-11z" fill="#c99972" stroke="#a57951"/>
      <path d="M223 235c-22 6-30 16-20 27 7 8 36 2 43 13 6 10-9 16-33 14m34-61c15 23 12 39-3 46" stroke="#9a864f"/>
      <path d="M230 134v-12M203 93h54M230 62v56" stroke="#97ac90" stroke-width="1"/></g>
      <g class="bb-system-nodes" fill="#fbfff7" stroke="#8ea28a"><circle cx="78" cy="137" r="24"/><circle cx="371" cy="152" r="24"/><circle cx="70" cy="294" r="24"/><circle cx="385" cy="302" r="24"/><circle cx="136" cy="404" r="24"/><circle cx="333" cy="407" r="24"/></g>
      <g fill="none" stroke="#6c8b72" stroke-width="1.5"><path d="M101 141l58 28m189-7-58 18M94 287l84-30m183 38-82-34M153 387l42-62m119 65-52-63" stroke-dasharray="3 5"/><path d="M68 140l7-9 6 9 7-9m275 17h16m-8-8v16M60 294h20m-10-10v20m305-9c12-16 21 9 0 17-21-8-12-33 0-17m-245 107l6 10 8-20m180 8h16l-8 13z"/></g>
    </svg>`;
  }
  /* Moving between questions keeps the question block still; a new view starts at the top. */
  function render(focus=true) {
    const anchor=state.view==='quiz'&&lastRenderedView==='quiz'?root.querySelector('.bb-q-top'):null;
    const anchorTop=anchor?anchor.getBoundingClientRect().top:null;
    const urgent=E.emergency(state.answers);
    if (state.view!=='landing') state.view=urgent.length?'urgent':state.answers.age==='under18'?'scope':state.view;
    root.replaceChildren({landing,urgent:()=>urgentView(urgent),scope:scopeView,results}[state.view]?.()||quiz());
    if(mode!=='bodybranch')return;
    const nextAnchor=anchorTop!==null&&root.querySelector('.bb-q-top');
    if(nextAnchor)window.scrollBy({top:nextAnchor.getBoundingClientRect().top-anchorTop,behavior:'auto'});
    else if(lastRenderedView!==state.view)window.scrollTo({top:0,behavior:'auto'});
    lastRenderedView=state.view;
    if (focus) {const title=root.querySelector('h2');if(title){title.tabIndex=-1;title.focus({preventScroll:true});}}
  }
  function landing() {
    const view=h('section','bb-landing');
    view.innerHTML=`<div class="bb-landing-art">${bodyArt()}</div>
      <div class="bb-landing-copy"><span class="bb-eyebrow">BODYBRANCH · ADULT PHYSICAL HEALTH</span><h2>Follow the clues.<br>Find what fits.</h2>
      <p class="bb-lede">Pick what you feel. Each answer narrows the next questions, building a ranked shortlist of ${D.conditions.length} adult conditions with the evidence for and against each. “Not sure” never counts as a no.</p>
      <div class="bb-start-actions"></div><p class="bb-message" role="status"></p></div>`;
    const actions=view.querySelector('.bb-start-actions'),message=view.querySelector('.bb-message');
    const saved=readSaved();
    if(saved)actions.append(btn('Continue saved run',()=>{state=saved;priorRun=null;render();},'btn primary'));
    actions.append(btn(saved?'Start a new run':'Begin Bodybranch',startNew,saved?'btn ghost':'btn primary'));
    const imp=h('input');imp.type='file';imp.accept='application/json,.json';imp.hidden=true;
    actions.append(btn('Import a run',()=>imp.click(),'btn ghost'),imp);
    imp.addEventListener('change',async()=>{const file=imp.files[0];if(!file)return;try {if(file.size>2_000_000)throw Error('This file is too large for a saved run.');const parsed=validateRun(JSON.parse(await file.text()));if(!parsed)throw Error('Choose a Bodybranch version 1 answers file.');state=parsed;priorRun=null;save();render();}catch(e){message.textContent=e.message||'That saved run could not be read.';}});
    return view;
  }
  function input(q,onChange) {
    const box=h('div','bb-answers');box.dataset.kind=q.kind;box.setAttribute('role','group');box.setAttribute('aria-label',q.q);
    const paint=()=>{for(const button of box.querySelectorAll('button')){const v=button.dataset.value,value=state.answers[q.id];const selected=v==='__none'?Array.isArray(value)&&value.length===0:Array.isArray(value)?value.includes(v):value===v;button.classList.toggle('selected',selected);button.setAttribute('aria-pressed',String(selected));}};
    const options=[...(q.kind==='yn'?[{v:'yes',t:'Yes'},{v:'no',t:'No'}]:q.opts),{v:'unsure',t:'Not sure'},...(q.kind==='multi'?[{v:'__none',t:'None of these'}]:[])];
    for(const option of options) {
      const button=btn(option.t,()=>{
        if(q.kind!=='multi')state.answers[q.id]=option.v;
        else if(option.v==='unsure'||option.v==='__none')state.answers[q.id]=option.v==='unsure'?['unsure']:[];
        else {const old=Array.isArray(state.answers[q.id])?state.answers[q.id].filter(v=>v!=='unsure'):[];state.answers[q.id]=old.includes(option.v)?old.filter(v=>v!==option.v):[...old,option.v];}
        paint();onChange();
      },option.v==='__none'?'bb-answer bb-none':'bb-answer');
      button.dataset.value=option.v;box.append(button);
    }
    paint();return box;
  }
  function quiz() {
    const queue=E.queue(state.answers);
    state.cursor=Math.min(Math.max(0,state.cursor),queue.length);
    if(state.cursor>=queue.length){state.view='results';save();return results();}
    const step=queue[state.cursor],q=step.item;
    const wrapper=h('div','bb-quiz');wrapper.dataset.questionId=q.id;
    const side=h('aside','bb-spine');side.innerHTML='<span class="bb-eyebrow">YOUR BRANCHES</span>';
    const list=h('ol');
    for(const name of new Set(queue.map(s=>s.section))){const last=queue.findLastIndex(s=>s.section===name);list.append(h('li',name===step.section?'now':last<state.cursor?'done':'',esc(name)));}
    side.append(list);
    const card=h('section','bb-qcard');
    const urgentQ=q.id==='urgent_now';
    card.innerHTML=`<div class="bb-q-top"><span class="bb-branch-mark" aria-hidden="true">${branchGlyph(step.group)}</span><span class="chip">${esc(step.section)}</span><span class="bb-counter">${state.cursor+1} / ${queue.length}</span></div><h2>${esc(q.q)}</h2>${q.help?`<p class="bb-qhelp${urgentQ?' bb-emergency-notice':''}">${esc(q.help)}</p>`:''}${q.kind==='multi'?'<p class="bb-small">Choose every answer that applies.</p>':''}`;
    const note=h('p','bb-path-note');note.setAttribute('role','status');
    // Leaving a question: back to the result when editing from it, else to the next one.
    const advance=()=>{
      if(editFromResult){editFromResult=false;go('results');return;}
      const current=E.queue(state.answers);state.cursor=current.findIndex(s=>s.item.id===q.id)+1;
      go(state.cursor>=current.length?'results':'quiz',false);
    };
    card.append(input(q,()=>{
      save();next.disabled=!E.answered(q,state.answers);
      if(E.emergency(state.answers).length){go('urgent');return;}
      // A single choice moves straight on; a multiple choice waits for Next.
      if(q.kind!=='multi'){advance();return;}
      const change=E.queue(state.answers).length-queue.length;
      card.querySelector('.bb-counter').textContent=`${state.cursor+1} / ${queue.length+change}`;
      note.textContent=change<0?`${plural(-change,'follow-up question')} removed by that answer.`:change>0?`${plural(change,'relevant follow-up question')} opened.`:'';
    }));
    card.append(note);
    const nav=h('div','bb-qnav');
    const back=btn('Back',()=>{state.cursor=Math.max(0,state.cursor-1);go('quiz',false);},'btn ghost');back.disabled=state.cursor===0;
    const next=btn(editFromResult?'Re-rank candidates':state.cursor===queue.length-1?'See candidates':'Next',advance,'btn primary');
    next.disabled=!E.answered(q,state.answers);next.dataset.action='next';
    nav.append(back,next);card.append(nav);
    const progress=h('div','bb-progress');progress.setAttribute('aria-label','Question progress');const fill=h('span');fill.style.width=`${100*state.cursor/queue.length}%`;progress.append(fill);card.append(progress);
    if(state.cursor>=5){const early=btn('See candidates so far',()=>go('results'),'bb-text-button');early.dataset.action='early-results';card.append(early);}
    wrapper.append(side,card);return wrapper;
  }
  function branchGlyph(group) {
    const paths={heart:'M3 10C-2 1 11-2 14 5c3-7 16-4 11 5L14 23Z',breathing:'M14 2v17M10 6C3 5 1 13 3 21c2 3 8 2 8-1V7zm8 0c7-1 9 7 7 15-2 3-8 2-8-1V7z',digestion:'M12 1v8c0 5 5 2 9 3 7 3 2 15-8 14-7-1-8-6-6-9',bowel:'M5 3h17v20H5zM9 7h9v4H9v5h9v4',nerves:'M14 1v25M14 6L4 2m10 10L3 8m11 11L3 23M14 6l10-4m-10 10 11-4m-11 11 11 4',headache:'M7 24v-5C-2 10 3 0 14 1c13 0 15 18 5 20v4M10 7l7 5-7 6',skin:'M4 3h20v21H4zM8 9l4 4 5-7 5 9',urinary:'M11 6C3-6-4 22 6 23c7 0 1-12 6-12m4-5c8-12 15 16 5 17-7 0-1-12-6-12',joints:'M6 1l8 9 8-9M4 26l10-11 10 11M10 11h8v5h-8z',sleep:'M20 1C5 1-1 22 16 25c-11 4-19-9-13-17 4-6 11-9 17-7z',nose:'M12 1l-4 15h10m-16-9h5m12 0h6M7 23c4 3 10 3 14 0',general:'M14 1v25M2 14h24M6 6l16 16M22 6 6 22',blood:'M14 1C10 8 3 14 5 20c3 10 20 9 20-2C25 13 18 7 14 1z',infection:'M14 4v20M4 14h20m-17-7 14 14M21 7 7 21',reproductive:'M4 3c-3 9 4 14 10 11 6 3 13-2 10-11M14 14v12',results:'M5 1h17v25H5zM9 7h9m-9 6h9m-9 6h6',dizziness:'M4 10c0-12 24-11 24 1 0 9-18 11-18 2 0-6 11-5 11 0M5 23h17'};
    return `<svg viewBox="0 0 30 30" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="${paths[group]||paths.general}"/></svg>`;
  }
  function urgentView(items) {
    const view=h('section','bb-stop');view.dataset.view='urgent';
    view.innerHTML='<span class="bb-eyebrow">SAFETY BRANCH</span><h2>Get emergency medical help now.</h2><p>The symptoms selected can need time-critical treatment. Contact local emergency services or go to an emergency department. Do not drive yourself.</p><h3>What the reported pattern can raise concern for</h3>';
    const list=h('ul');for(const item of items)list.append(h('li','',`<b>${esc(item.name)}</b><span>${esc(item.why)}</span>`));view.append(list);
    view.append(btn('Review the safety answer',()=>{delete state.answers.urgent_now;state.cursor=0;go('quiz');},'btn ghost'));
    return view;
  }
  function scopeView() {
    const view=h('section','bb-stop bb-scope');view.innerHTML='<span class="bb-eyebrow">ADULT PATH</span><h2>This path starts at age 18.</h2><p>Children and teenagers need different symptom thresholds and assessment pathways. Contact an appropriate pediatric service for this problem.</p>';
    view.append(btn('Review the age answer',()=>{delete state.answers.age;state.cursor=E.queue(state.answers).findIndex(s=>s.item.id==='age');go('quiz');},'btn ghost'));return view;
  }
  function results() {
    const run=evaluate();
    const changes=priorRun?E.diff(priorRun,run):[];priorRun=run;
    const view=h('section','bb-results');view.dataset.view='results';
    view.innerHTML=`<div class="bb-results-heading"><div><span class="bb-eyebrow">BODYBRANCH · YOUR DIFFERENTIAL</span><h2>What fits the answers?</h2><p class="bb-lede">${plural(run.newCandidates.length,'new candidate')} supported by the current pattern, stronger matches first.</p></div><span class="bb-result-symbol" aria-hidden="true">${branchGlyph('results')}</span></div>`;
    if(run.safetyUnknown){const panel=h('div','bb-alert bb-alert-today','<h3>The emergency screen is unresolved</h3><p>Review the first question before relying on a routine shortlist. If a listed emergency symptom may be happening, seek urgent medical advice.</p>');panel.append(btn('Review safety screen',()=>editQuestion('urgent_now'),'btn ghost sm'));view.append(panel);}
    for(const w of run.warnings)view.append(h('div','bb-alert bb-alert-'+w.level,`<span class="bb-alert-label">${w.level==='today'?'Same-day assessment':'Medical assessment needed'}</span><h3>${esc(w.title)}</h3><p>${esc(w.message)}</p>`));
    if(run.unanswered.length){const panel=h('div','bb-pending',`<b>${plural(run.unanswered.length,'answer')} still uncertain or unasked of ${run.total}.</b><p>The list can change when those clues are known. An unknown is never counted as a negative.</p>`);panel.append(btn('Continue narrowing',()=>{state.cursor=E.queue(state.answers).findIndex(s=>!E.known(s.item,state.answers));editFromResult=false;go('quiz');},'btn ghost sm'));view.append(panel);}
    if(changes.length){const change=h('section','bb-changes','<h3>What the changed answer did</h3>');const ul=h('ul');for(const c of changes.slice(0,12))ul.append(h('li','',`<b>${esc(c.name)}</b>: ${esc(bandNames[c.from])} → ${esc(bandNames[c.to])}`));change.append(ul);view.append(change);}
    view.append(h('p','bb-ranking-note','The order compares supporting clues, conflicting clues and characteristic features. It is not a percentage risk, the list is not exhaustive, and several conditions can coexist.'));
    if(run.decisions.length){const ledger=h('section','bb-ledger','<h3>Differential rules that changed the picture</h3>');for(const decision of run.decisions)ledger.append(h('div','bb-ledger-rule',`<b>${esc(decision.title)}</b><p>${esc(decision.message)}</p>`));view.append(ledger);}
    if(!run.newCandidates.length){const empty=h('div','bb-empty','<h3>No new candidate has enough support yet.</h3><p>This is not proof that nothing is wrong. Add missing clues, revisit the symptom areas, or take persistent symptoms for clinical assessment.</p>');empty.append(btn('Review symptom areas',()=>editQuestion('concerns'),'btn ghost sm'));view.append(empty);}
    const grid=h('div','bb-candidates');run.newCandidates.forEach((row,i)=>grid.append(candidateCard(row,i+1,run)));view.append(grid);
    if(run.knownCandidates.length){const section=h('section','bb-known','<h3>Already diagnosed</h3><p class="bb-small">These matches stay in the reasoning, below new explanations.</p>');run.knownCandidates.forEach(row=>section.append(candidateCard(row,null,run)));view.append(section);}
    if(run.other.length){const considered=h('details','bb-considered',`<summary>Other considered candidates · ${run.other.length}</summary><p class="bb-small">Too few supporting clues or important conflicting evidence. Not medically ruled out.</p>`);
      for(const row of run.other){const detail=h('details','bb-other-row',`<summary>${esc(row.name)} <span>${esc(bandNames[row.band])}</span></summary>`);detail.append(evidenceView(row,run));considered.append(detail);}view.append(considered);}
    const path=h('details','bb-path','<summary>Review or change the answer path</summary>');
    for(const id of run.activeIds){const q=E.byId[id];if(!E.answered(q,state.answers))continue;const line=h('div','bb-path-row');line.append(h('span','',esc(q.q)),btn(E.label(q,state.answers[id]),()=>editQuestion(id),'bb-answer-link'));path.append(line);}view.append(path);
    const actions=h('div','bb-result-actions');
    actions.append(btn('Save discussion summary',()=>download('bodybranch-summary.txt',summaryText(run),'text/plain'),'btn primary'),btn('Print',()=>window.print(),'btn ghost'),btn('Export answers',()=>download('bodybranch-answers.json',envelope(),'application/json'),'btn ghost'),btn('Start a new run',startNew,'btn ghost'));
    view.append(actions);
    return view;
  }
  function candidateCard(row,rank,run) {
    const card=h('article','bb-dx bb-'+row.band);card.dataset.conditionId=row.id;
    card.innerHTML=`<div class="bb-dx-heading">${rank?`<span class="bb-rank">${rank}</span>`:''}<div><span class="bb-band">${esc(bandNames[row.band])}</span><h3>${esc(row.name)}</h3></div></div><p>${esc(row.summary)}</p>`;
    card.append(evidenceView(row,run));
    const known=h('label','bb-known-control');const box=h('input');box.type='checkbox';box.checked=row.known;box.setAttribute('aria-label','Already diagnosed: '+row.name);
    box.addEventListener('change',()=>{state.knownDiagnoses=box.checked?[...new Set([...state.knownDiagnoses,row.id])]:state.knownDiagnoses.filter(id=>id!==row.id);save();render(false);});
    known.append(box,h('span','','Already diagnosed'));card.append(known);
    return card;
  }
  function evidenceView(row,run) {
    const div=h('div','bb-evidence');
    for(const [title,list,cls] of [['Supports',row.matched,'supports'],['Weakens',row.conflicts,'conflicts']])if(list.length){const section=h('div','bb-evidence-'+cls);section.append(h('h4','',title));const ul=h('ul');for(const item of list)ul.append(h('li','',esc(item.label)));section.append(ul);div.append(section);}
    if(!row.matched.length)div.append(h('p','bb-small','No supporting feature has been established on this path.'));
    if(!row.durationMet)div.append(h('p','bb-evidence-warning','The required duration has not been established.'));
    // Only clues on the current path: answering them cannot silently widen the chosen areas.
    const missing=row.unknown.filter(item=>run.activeIds.includes(item.q)).slice(0,4);
    if(missing.length){div.append(h('h4','','Clues still missing'));const ul=h('ul');for(const item of missing){const li=h('li');li.append(btn(E.byId[item.q].q,()=>editQuestion(item.q),'bb-evidence-question'));ul.append(li);}div.append(ul);}
    div.append(h('div','bb-confirm',`<b>What would distinguish or confirm it</b><p>${esc(row.confirm)}</p>`));
    const s=D.sources[row.source],link=h('a','bb-source',esc(s.title));link.href=s.url;link.target='_blank';link.rel='noopener noreferrer';div.append(link);
    return div;
  }
  function editQuestion(id) {state.cursor=Math.max(0,E.queue(state.answers).findIndex(s=>s.item.id===id));editFromResult=true;go('quiz');}
  function summaryText(run) {
    const lines=['BODYBRANCH — DISCUSSION SUMMARY',new Date().toISOString().slice(0,10),'Adult symptom-pattern shortlist; ranks are not disease probabilities.',''];
    if(run.warnings.length){lines.push('ASSESSMENT PRIORITIES');run.warnings.forEach(w=>lines.push(`${w.title}: ${w.message}`));lines.push('');}
    for(const [i,c] of run.candidates.entries()){lines.push(`${i+1}. ${c.name}${c.known?' [already diagnosed]':''}`,bandNames[c.band]);c.matched.forEach(r=>lines.push('+ '+r.label));c.conflicts.forEach(r=>lines.push('− '+r.label));lines.push('To distinguish/confirm: '+c.confirm,D.sources[c.source].url,'');}
    lines.push(`${plural(run.unanswered.length,'answer')} uncertain or unasked.`,'','ANSWER PATH');for(const id of run.activeIds){const q=E.byId[id];lines.push(q.q+' — '+E.label(q,state.answers[id]));}return lines.join('\n');
  }
  /* Two tabs share one shell: the header title, the start-screen button and the URL hash follow the tab. */
  function switchMode(next,writeHash=false) {
    mode=next==='bodybranch'?'bodybranch':'mindbranch';
    const body=mode==='bodybranch';document.getElementById('app').hidden=body;root.hidden=!body;
    document.body.dataset.workspace=mode;
    document.querySelector('.top h1').innerHTML=body?'Body<span>branch</span>':'Mind<span>branch</span>';
    document.querySelector('.top .sub').textContent=body?'Physical symptoms, narrowed one question at a time':'DSM-5-TR criteria logic, walked one question at a time';
    document.title=body?'Bodybranch':'Mindbranch';
    for(const button of document.querySelectorAll('[data-workspace-tab]')){const on=button.dataset.workspaceTab===mode;button.setAttribute('aria-selected',String(on));button.tabIndex=on?0:-1;}
    if(writeHash)history.replaceState(null,'',body?'#bodybranch':'#mindbranch');
    if(body){lastRenderedView=null;render(false);}
  }
  document.getElementById('restart').addEventListener('click',()=>{if(mode==='bodybranch'){state.view='landing';render();}else window.mindHome();});
  document.querySelectorAll('[data-workspace-tab]').forEach(button=>{
    button.addEventListener('click',()=>switchMode(button.dataset.workspaceTab,true));
    button.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const tabs=[...document.querySelectorAll('[data-workspace-tab]')];const next=event.key==='Home'?tabs[0]:event.key==='End'?tabs[tabs.length-1]:tabs.find(t=>t!==button);switchMode(next.dataset.workspaceTab,true);next.focus();});
  });
  window.addEventListener('hashchange',()=>switchMode(location.hash==='#bodybranch'?'bodybranch':'mindbranch'));
  // Reload returns straight to a saved run.
  state=readSaved()||state;
  switchMode(location.hash==='#bodybranch'?'bodybranch':'mindbranch');
})();
