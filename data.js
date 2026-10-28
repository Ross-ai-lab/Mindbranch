/* ============================================================================
   Mindbranch — clinical data
   ----------------------------------------------------------------------------
   Every item is written in first-person self-report language, in our own words.
   These are paraphrased screening items built to the manual's thresholds.

   Structure:
     CONTEXT  — First's steps 1-3 (substance / medical / medication / stressor)
     SCREEN   — gate questions; a yes or a "not sure" opens modules
     MODULES  — per-disorder criteria sets
     RULES    — the precedence engine (the part that debunks differentials)
   ========================================================================== */

/* ---------------------------------------------------------------- helpers */
const has = (a, id, v) => (a[id] || []).includes(v);
const n = (a, id) => (a[id] || []).length;
const is = (a, id, v) => a[id] === v;
const yes = (a, id) => a[id] === 'yes';
const notNo = (a, id) => a[id] === 'yes' || a[id] === 'unsure';
/* Depression's two gatekeeper symptoms are the two depression screens. */
const core = a => yes(a, 's_dep') + yes(a, 's_anh');

const YN = [
  { v: 'yes', t: 'Yes' },
  { v: 'no', t: 'No' },
  { v: 'unsure', t: 'Not sure' }
];

/* ================================================================ CONTEXT */
/* First's six-step framework, steps 1-3. These run BEFORE the tree, and an
   "I'm not sure" is recorded as an unknown that taints the result rather than
   being quietly dropped. */

const CONTEXT = [
  {
    id: 'c_sub', k: 'yn',
    q: 'Over the period you will be describing, were you drinking heavily, using drugs, or coming off either?',
    help: 'Step 2 of the differential. Substance use and withdrawal can produce almost every symptom in this tool. A yes does not stop anything, but it flags every mood, anxiety and psychosis result as needing a substance-induced disorder ruled out first.'
  },
  {
    id: 'c_med', k: 'yn',
    q: 'Do you have, or might you have, a physical condition that could be causing this?',
    help: 'Step 3. Thyroid disease, anaemia, sleep apnoea, head injury, chronic pain, neurological conditions, long infections. This is the exclusion a self-report tool is worst at, which is exactly why it is asked out loud instead of assumed away.'
  },
  {
    id: 'c_rx', k: 'yn',
    q: 'Did you start, stop, or change a medication around the time this began?',
    help: 'Steroids, hormonal contraceptives, isotretinoin, beta blockers, stimulants, antidepressants and withdrawal from any of them all belong here.'
  },
  {
    id: 'c_stress', k: 'yn', opens: ['adjust'],
    q: 'Did an identifiable stressful event happen in the three months before this started?',
    help: 'A move, a loss, a breakup, a job change, an illness. This decides whether adjustment disorder is even on the table at the end.'
  },
  {
    id: 'c_norm', k: 'pick',
    q: 'Honestly — is what you are describing worse than what most people go through in the same situation?',
    help: 'Step 5: the boundary with normality. Distress that fits its cause and passes is not a disorder, and a tool that never asks this diagnoses everybody.',
    opts: [
      { v: 'a', t: 'Yes, clearly out of proportion or lasting far too long' },
      { v: 'b', t: 'Hard to say' },
      { v: 'c', t: 'No, it is probably a normal reaction to what happened' }
    ]
  }
];

/* ================================================================= SCREEN */
/* MINI-style gates. Answering yes or "not sure" queues the listed modules. */

const SCREEN = [
  { id: 's_dep', k: 'yn', opens: ['mde'], q: 'Has there been a stretch of two weeks or more when you felt down, empty or hopeless nearly every day?' },
  { id: 's_anh', k: 'yn', opens: ['mde'], q: 'Has there been a stretch of two weeks or more when almost nothing gave you pleasure or interest any more?' },
  { id: 's_pdd', k: 'yn', opens: ['pdd'], q: 'Have you felt low more days than not for two years or longer?' },
  { id: 's_man', k: 'yn', opens: ['manic', 'hypo'], q: 'Has there been a period of days when you felt unusually high, wired, or unusually irritable, with far more energy than normal?' },
  { id: 's_cyc', k: 'yn', opens: ['cyclo'], q: 'Over two years or more, have your moods swung up and down repeatedly without ever reaching a full high or a full depression?' },
  { id: 's_pan', k: 'yn', opens: ['panic'], q: 'Have you had sudden rushes of intense fear or physical alarm that peaked within a few minutes?' },
  { id: 's_ago', k: 'yn', opens: ['agora'], q: 'Do you avoid transport, crowds, queues, shops or being far from home because escape or help might be hard?' },
  { id: 's_soc', k: 'yn', opens: ['sad'], q: 'Do social or performance situations frighten you because you might be judged, embarrassed or seen to be anxious?' },
  { id: 's_gad', k: 'yn', opens: ['gad'], q: 'Do you worry excessively about several different things, more days than not, and find it hard to stop?' },
  { id: 's_pho', k: 'yn', opens: ['phobia'], q: 'Is there a specific thing, animal or situation that reliably frightens you far more than it should?' },
  { id: 's_ocd', k: 'yn', opens: ['ocd'], q: 'Do unwanted thoughts keep forcing their way in, or do you feel driven to repeat actions like checking, washing, counting or ordering?' },
  { id: 's_bdd', k: 'yn', opens: ['bdd'], q: 'Are you preoccupied with something about your appearance that other people say is slight or cannot see?' },
  { id: 's_hoard', k: 'yn', opens: ['hoard'], q: 'Do you find it very hard to part with possessions, to the point that rooms can no longer be used as intended?' },
  { id: 's_bfrb', k: 'yn', opens: ['bfrb'], q: 'Do you repeatedly pull out your hair or pick at your skin, enough to cause damage?' },
  { id: 's_ptsd', k: 'yn', opens: ['ptsd'], q: 'Have you experienced or witnessed something involving death, serious injury or sexual violence that still intrudes on you?' },
  { id: 's_ssd', k: 'yn', opens: ['ssd', 'iad'], q: 'Do physical symptoms, or the fear of being seriously ill, take up a large amount of your attention?' },
  { id: 's_dpdr', k: 'yn', opens: ['dpdr'], q: 'Do you have episodes of feeling detached from yourself, or of the world seeming unreal or dreamlike?' },
  { id: 's_aud', k: 'yn', opens: ['aud'], q: 'Has your drinking caused problems, or been harder to control than you wanted?' },
  { id: 's_sud', k: 'yn', opens: ['sud'], q: 'Has your use of any other substance caused problems, or been harder to control than you wanted?' },
  { id: 's_eat_r', k: 'yn', opens: ['an'], q: 'Do you restrict what you eat, and is your weight low or falling, with a strong fear of gaining?' },
  { id: 's_eat_b', k: 'yn', opens: ['bn', 'bed'], q: 'Do you have episodes of eating an unusually large amount with a sense of being out of control?' },
  { id: 's_ins', k: 'yn', opens: ['insomnia'], q: 'Do you regularly struggle to fall asleep, stay asleep, or wake far too early?' },
  { id: 's_adhd', k: 'yn', opens: ['adhd'], q: 'Have inattention, restlessness or impulsivity been a lifelong problem for you across most areas of life?' },
  { id: 's_psy', k: 'yn', opens: ['psych'], q: 'Have you heard or seen things others did not, or held beliefs that others insisted were not true?' },
  { id: 's_pp', k: 'yn', opens: ['pp'], q: 'Since your late teens, have the same problems with relationships, identity or emotional control repeated across most of your life?' }
];

/* ================================================================ MODULES */
/* status: 'met' | 'near' | 'out' (the engine adds 'unresolved')
   Each criterion carries its own failure sentence — that sentence is the whole
   point of the tool, so it is written to explain the rule, not just report it. */

const MODULES = [

  /* ------------------------------------------------------------ MOOD ---- */
  {
    id: 'mde', name: 'Major Depressive Disorder', chap: 'Depressive',
    blurb: 'A depressive episode is gated by two symptoms, not by how many you have in total.',
    items: [
      {
        id: 'mde_sx', k: 'multi',
        q: 'Over those same two weeks, which of these also happened?',
        opts: [
          { v: 'app', t: 'My appetite or weight changed noticeably without trying' },
          { v: 'sle', t: 'I slept far too little or far too much, nearly every night' },
          { v: 'psy', t: 'I was visibly slowed down or restless — enough that others could see it' },
          { v: 'fat', t: 'I was exhausted or had no energy nearly every day' },
          { v: 'wor', t: 'I felt worthless, or guilty out of all proportion' },
          { v: 'con', t: 'I could not concentrate or make decisions' },
          { v: 'dea', t: 'I had repeated thoughts of death, or of ending my life' }
        ]
      },
      { id: 'mde_dur', k: 'yn', q: 'Did that cluster last at least two full weeks, present nearly every day?' },
      { id: 'mde_imp', k: 'yn', q: 'Did it cause real distress, or clearly interfere with work, study, relationships or daily life?' }
    ],
    criteria: [
      {
        id: 'A', label: 'At least one core symptom',
        test: a => core(a) >= 1,
        why: () => 'Neither persistent low mood nor loss of interest was present nearly every day. Both are gatekeeper symptoms — without one of them, the other seven cannot add up to a depressive episode no matter how many are ticked.'
      },
      {
        id: 'B', label: 'Five or more symptoms in total',
        test: a => core(a) + n(a, 'mde_sx') >= 5,
        why: a => `Only ${core(a) + n(a, 'mde_sx')} of the 9 symptoms were present. The threshold is 5. This is a counting criterion, not a severity judgement — four severe symptoms do not qualify and five mild ones do.`
      },
      {
        id: 'C', label: 'Two weeks, nearly every day',
        test: a => yes(a, 'mde_dur'),
        why: a => a.mde_dur === 'unsure'
          ? 'The two-week duration could not be confirmed. Depression is defined by persistence, so an unconfirmed duration leaves the episode unproven.'
          : 'The cluster did not last two full weeks nearly every day. Shorter low periods, however intense, are not a depressive episode.'
      },
      {
        id: 'D', label: 'Distress or impairment',
        test: a => notNo(a, 'mde_imp'),
        why: () => 'The symptoms did not cause significant distress or interfere with functioning. This is the boundary with normality, and it is a real criterion rather than a formality.'
      }
    ],
    near: a => core(a) + n(a, 'mde_sx') >= 3 && notNo(a, 'mde_dur')
  },

  {
    id: 'pdd', name: 'Persistent Depressive Disorder', chap: 'Depressive',
    blurb: 'Lower intensity, far longer duration. Defined by the two-year floor.',
    items: [
      {
        id: 'pdd_sx', k: 'multi',
        q: 'Across those years, which of these have been present while you were low?',
        opts: [
          { v: 'app', t: 'Poor appetite, or overeating' },
          { v: 'sle', t: 'Sleeping too little or too much' },
          { v: 'ene', t: 'Low energy or constant tiredness' },
          { v: 'est', t: 'Low self-esteem' },
          { v: 'con', t: 'Poor concentration or difficulty deciding' },
          { v: 'hop', t: 'Hopelessness' }
        ]
      },
      { id: 'pdd_gap', k: 'yn', q: 'Across those two years, were you ever free of it for more than two months at a stretch?' },
      { id: 'pdd_imp', k: 'yn', q: 'Has it caused significant distress or impairment?' }
    ],
    criteria: [
      {
        id: 'A', label: 'Two years of depressed mood',
        test: a => yes(a, 's_pdd'),
        why: () => 'The two-year floor was not met. Under two years this is a depressive episode, not a persistent depressive disorder — the duration is the whole distinction between them.'
      },
      {
        id: 'B', label: 'Two or more accompanying symptoms',
        test: a => n(a, 'pdd_sx') >= 2,
        why: a => `Only ${n(a, 'pdd_sx')} of the 6 accompanying symptoms were present; 2 are required.`
      },
      {
        id: 'C', label: 'Never symptom-free for more than two months',
        test: a => a.pdd_gap === 'no' || a.pdd_gap === 'unsure',
        why: () => 'There was a gap of more than two months without symptoms. That breaks the continuity the diagnosis rests on, and points instead to recurrent separate episodes.'
      },
      { id: 'D', label: 'Distress or impairment', test: a => notNo(a, 'pdd_imp'), why: () => 'No significant distress or impairment was reported.' }
    ],
    near: a => notNo(a, 's_pdd') && n(a, 'pdd_sx') >= 1
  },

  {
    id: 'manic', name: 'Bipolar I Disorder', chap: 'Bipolar',
    blurb: 'Decided by one manic episode, ever. Current mood is irrelevant to it.',
    shared: 'mania',
    items: [
      {
        id: 'man_mood', k: 'pick',
        q: 'During that high period, which best describes the mood?',
        opts: [
          { v: 'a', t: 'Abnormally elevated, expansive, or euphoric' },
          { v: 'b', t: 'Mainly irritable, not high' },
          { v: 'c', t: 'Both at different points' },
          { v: 'd', t: 'Neither really fits' }
        ],
        help: 'This changes the symptom threshold later: an irritable-only mood requires four extra symptoms instead of three.'
      },
      {
        id: 'man_dur', k: 'pick',
        q: 'How long did the longest such period last?',
        opts: [
          { v: 'a', t: 'Less than 4 days' },
          { v: 'b', t: '4 to 6 days' },
          { v: 'c', t: '7 days or more' },
          { v: 'd', t: 'Any length, but I was hospitalised for it' }
        ]
      },
      {
        id: 'man_sx', k: 'multi',
        q: 'During that period, which of these were present to a noticeable degree?',
        opts: [
          { v: 'gra', t: 'Inflated self-esteem or grandiosity' },
          { v: 'sle', t: 'Much less need for sleep — rested after three hours' },
          { v: 'tal', t: 'Far more talkative, or pressure to keep talking' },
          { v: 'rac', t: 'Racing thoughts, or ideas jumping one to the next' },
          { v: 'dis', t: 'Easily pulled off course by unimportant things' },
          { v: 'act', t: 'A big increase in activity, or physical agitation' },
          { v: 'ris', t: 'Risky things with painful potential — spending, sex, driving, business' }
        ]
      },
      {
        id: 'man_imp', k: 'pick',
        q: 'How much did that period disrupt things?',
        opts: [
          { v: 'a', t: 'Severely — it damaged work or relationships, or involved hospital or psychosis' },
          { v: 'b', t: 'It was an obvious change others noticed, but it did not wreck anything' },
          { v: 'c', t: 'Barely noticeable to anyone else' }
        ],
        help: 'This single answer is what separates Bipolar I from Bipolar II. Severity, not symptom count, is the dividing line.'
      }
    ],
    criteria: [
      {
        id: 'A', label: 'Elevated, expansive or irritable mood',
        test: a => ['a', 'b', 'c'].includes(a.man_mood),
        why: () => 'No distinct period of abnormally elevated, expansive or irritable mood was described.'
      },
      {
        id: 'B', label: 'Increased energy or activity alongside it',
        test: a => notNo(a, 's_man'),
        why: () => 'The mood change was not accompanied by a clear, persistent increase in energy or goal-directed activity. Since DSM-5 this is a required part of the episode, not an optional feature — mood alone is not enough.'
      },
      {
        id: 'C', label: 'Seven days, or hospitalisation',
        test: a => ['c', 'd'].includes(a.man_dur),
        why: a => a.man_dur === 'b'
          ? 'The period lasted 4 to 6 days. That is the hypomania window — mania requires a full week unless hospitalisation cut it short. This exact answer is why the tool checked hypomania separately.'
          : 'The period lasted under four days, which is short of both mania and hypomania.'
      },
      {
        id: 'D', label: 'Enough additional symptoms',
        test: a => n(a, 'man_sx') >= (a.man_mood === 'b' ? 4 : 3),
        why: a => `${n(a, 'man_sx')} additional symptoms were present; ${a.man_mood === 'b' ? '4 are required because the mood was irritable rather than elevated' : '3 are required'}.`
      },
      {
        id: 'E', label: 'Marked impairment, hospitalisation or psychosis',
        test: a => a.man_imp === 'a',
        why: a => a.man_imp === 'b'
          ? 'The episode was visible to others but did not cause marked impairment, hospitalisation or psychosis. That is the definition of hypomania rather than mania, so the answer routes to Bipolar II instead.'
          : 'The change was not noticeable enough to others to qualify as an episode at all.'
      }
    ],
    near: a => ['a', 'b', 'c'].includes(a.man_mood) && n(a, 'man_sx') >= 2
  },

  {
    id: 'hypo', name: 'Bipolar II Disorder', chap: 'Bipolar',
    blurb: 'One hypomanic episode plus one depressive episode. Both halves are required.',
    shared: 'mania',
    items: [],
    criteria: [
      {
        id: 'A', label: 'Hypomanic episode: mood plus energy',
        test: a => ['a', 'b', 'c'].includes(a.man_mood) && notNo(a, 's_man'),
        why: () => 'No distinct period of elevated or irritable mood with increased energy was described.'
      },
      {
        id: 'B', label: 'Lasting at least four days',
        test: a => ['b', 'c'].includes(a.man_dur),
        why: () => 'The high period lasted under four days. Four consecutive days is the floor for hypomania.'
      },
      {
        id: 'C', label: 'Enough additional symptoms',
        test: a => n(a, 'man_sx') >= (a.man_mood === 'b' ? 4 : 3),
        why: a => `${n(a, 'man_sx')} additional symptoms were present; ${a.man_mood === 'b' ? '4 are required for an irritable-only mood' : '3 are required'}.`
      },
      {
        id: 'D', label: 'Noticeable to others but not severely impairing',
        test: a => ['a', 'b'].includes(a.man_imp),
        why: () => 'The change was not observable by others. Hypomania must be an unambiguous change that other people can see — a private sense of feeling good does not qualify.'
      },
      {
        id: 'E', label: 'A depressive episode has also occurred',
        test: (a, r) => r.mde && (r.mde.status === 'met' || r.mde.status === 'near' || r.mde.demoted),
        why: () => 'No major depressive episode was established. Bipolar II is not "mild bipolar" — it requires both a hypomanic episode and, separately, a full depressive episode. Hypomania on its own is unspecified bipolar, not Bipolar II.'
      },
      {
        id: 'F', label: 'No manic episode has ever occurred',
        test: (a, r) => !(r.manic && r.manic.status === 'met'),
        why: () => 'A full manic episode was established, and Bipolar II requires that one has never occurred. A single manic episode anywhere in a lifetime makes the diagnosis Bipolar I permanently — it is not upgraded and downgraded as episodes come and go.'
      }
    ],
    near: a => ['b', 'c'].includes(a.man_dur) && n(a, 'man_sx') >= 2
  },

  {
    id: 'cyclo', name: 'Cyclothymic Disorder', chap: 'Bipolar',
    blurb: 'Two years of swings that never reach full episodes in either direction.',
    items: [
      { id: 'cyc_gap', k: 'yn', q: 'Across those two years, were you free of symptoms for more than two months at a stretch?' },
      { id: 'cyc_imp', k: 'yn', q: 'Has it caused significant distress or impairment?' }
    ],
    criteria: [
      { id: 'A', label: 'Two years of alternating symptoms', test: a => yes(a, 's_cyc'), why: () => 'The two-year pattern of alternating high and low periods was not met.' },
      { id: 'B', label: 'Never reaching full episode criteria', test: a => notNo(a, 's_cyc'), why: () => 'The periods reached full episode level. Once a full hypomanic or depressive episode occurs, the diagnosis moves to bipolar or depressive disorder and cyclothymia no longer applies.' },
      { id: 'C', label: 'No symptom-free gap over two months', test: a => a.cyc_gap === 'no' || a.cyc_gap === 'unsure', why: () => 'There was a symptom-free stretch of more than two months, which breaks the required continuity.' },
      { id: 'D', label: 'Distress or impairment', test: a => notNo(a, 'cyc_imp'), why: () => 'No significant distress or impairment was reported.' }
    ],
    near: a => notNo(a, 's_cyc')
  },

  /* --------------------------------------------------------- ANXIETY ---- */
  {
    id: 'panic', name: 'Panic Disorder', chap: 'Anxiety',
    blurb: 'Panic attacks alone are not a disorder. The month of worry afterwards is.',
    items: [
      {
        id: 'pan_sx', k: 'multi',
        q: 'During those surges, which of these occurred?',
        opts: [
          { v: 'hea', t: 'Pounding or racing heart' }, { v: 'swe', t: 'Sweating' },
          { v: 'tre', t: 'Trembling or shaking' }, { v: 'bre', t: 'Shortness of breath' },
          { v: 'cho', t: 'Feeling of choking' }, { v: 'che', t: 'Chest pain or tightness' },
          { v: 'nau', t: 'Nausea or stomach distress' }, { v: 'diz', t: 'Dizzy, faint or unsteady' },
          { v: 'chi', t: 'Chills or heat sensations' }, { v: 'num', t: 'Numbness or tingling' },
          { v: 'unr', t: 'Unreality, or detachment from yourself' },
          { v: 'con', t: 'Fear of losing control or going mad' }, { v: 'die', t: 'Fear of dying' }
        ]
      },
      {
        id: 'pan_cue', k: 'pick',
        q: 'Did at least some of them come out of the blue, with no trigger?',
        opts: [
          { v: 'a', t: 'Yes, some arrived with no warning or cause' },
          { v: 'b', t: 'No — every one followed a specific trigger I can name' },
          { v: 'c', t: 'I am not sure' }
        ],
        help: 'This is the branch point. Attacks that are always cued belong to whatever causes them — a phobia, social anxiety, PTSD — and are recorded as a specifier there rather than as panic disorder.'
      },
      {
        id: 'pan_wor', k: 'pick',
        q: 'In the month after an attack, what happened?',
        opts: [
          { v: 'a', t: 'I worried persistently about more attacks, or changed my behaviour to avoid them' },
          { v: 'b', t: 'I was shaken for a few days, then it faded' },
          { v: 'c', t: 'Neither' }
        ]
      }
    ],
    criteria: [
      { id: 'A', label: 'Recurrent panic attacks', test: a => notNo(a, 's_pan'), why: () => 'No recurrent abrupt surges of fear peaking within minutes were described.' },
      { id: 'B', label: 'Four or more attack symptoms', test: a => n(a, 'pan_sx') >= 4, why: a => `Only ${n(a, 'pan_sx')} of the 13 attack symptoms were present; 4 are required for the surge to count as a panic attack rather than an anxiety spike.` },
      { id: 'C', label: 'At least some attacks unexpected', test: a => ['a', 'c'].includes(a.pan_cue), why: () => 'Every attack was triggered by an identifiable cue. Panic disorder requires at least some unexpected attacks; fully cued attacks belong to the disorder that supplies the cue.' },
      { id: 'D', label: 'A month of anticipatory worry or avoidance', test: a => a.pan_wor === 'a', why: () => 'The month of persistent worry about further attacks, or of behaviour change to avoid them, was absent. Panic attacks by themselves are common and are not a disorder — this consequence is what makes it one.' }
    ],
    near: a => notNo(a, 's_pan') && n(a, 'pan_sx') >= 2
  },

  {
    id: 'agora', name: 'Agoraphobia', chap: 'Anxiety',
    blurb: 'Two or more situation types, feared for the same specific reason.',
    items: [
      {
        id: 'ago_sit', k: 'multi',
        q: 'Which of these frighten or are avoided by you?',
        opts: [
          { v: 'tra', t: 'Public transport' }, { v: 'ope', t: 'Open spaces — car parks, bridges, markets' },
          { v: 'enc', t: 'Enclosed places — shops, cinemas, lifts' },
          { v: 'que', t: 'Queues or crowds' }, { v: 'alo', t: 'Being outside the home alone' }
        ]
      },
      { id: 'ago_alw', k: 'yn', q: 'Do those situations almost always provoke fear, rather than occasionally?' },
      { id: 'ago_dur', k: 'yn', q: 'Has this lasted six months or more?' },
      { id: 'ago_imp', k: 'yn', q: 'Does it cause significant distress or restrict your life?' }
    ],
    criteria: [
      { id: 'A', label: 'Two or more situation types', test: a => n(a, 'ago_sit') >= 2, why: a => `${n(a, 'ago_sit')} of the 5 situation types were endorsed; 2 are required. A single feared situation is a specific phobia, not agoraphobia.` },
      { id: 'B', label: 'Feared for escape or help reasons', test: a => notNo(a, 's_ago'), why: () => 'The situations were not feared because escape would be hard or help unavailable. That specific reason is what defines agoraphobia — without it the avoidance belongs to another disorder.' },
      { id: 'C', label: 'Fear is near-invariable', test: a => notNo(a, 'ago_alw'), why: () => 'The situations did not almost always provoke fear.' },
      { id: 'D', label: 'Six months or more', test: a => notNo(a, 'ago_dur'), why: () => 'The six-month duration was not met. Every anxiety disorder in this chapter carries that floor, to keep transient fear out.' },
      { id: 'E', label: 'Distress or impairment', test: a => notNo(a, 'ago_imp'), why: () => 'No significant distress or restriction was reported.' }
    ],
    near: a => n(a, 'ago_sit') >= 1 && notNo(a, 's_ago')
  },

  {
    id: 'sad', name: 'Social Anxiety Disorder', chap: 'Anxiety',
    blurb: 'The fear must be of scrutiny specifically, not of the situation.',
    items: [
      {
        id: 'soc_sit', k: 'multi',
        q: 'Which social situations provoke marked fear?',
        opts: [
          { v: 'con', t: 'Ordinary conversations' }, { v: 'new', t: 'Meeting unfamiliar people' },
          { v: 'obs', t: 'Being observed — eating, drinking, writing in front of others' },
          { v: 'per', t: 'Performing or speaking to a group' }
        ]
      },
      { id: 'soc_alw', k: 'yn', q: 'Do those situations almost always provoke the fear?' },
      { id: 'soc_avo', k: 'yn', q: 'Do you avoid them, or endure them with intense discomfort?' },
      { id: 'soc_out', k: 'yn', q: 'Is the fear out of proportion to any real threat in the situation?' },
      { id: 'soc_dur', k: 'yn', q: 'Has it lasted six months or more?' },
      { id: 'soc_imp', k: 'yn', q: 'Does it cause significant distress or impairment?' }
    ],
    criteria: [
      { id: 'A', label: 'Fear of one or more social situations', test: a => n(a, 'soc_sit') >= 1, why: () => 'No social situation was identified as provoking marked fear.' },
      { id: 'B', label: 'Fear is specifically of scrutiny', test: a => notNo(a, 's_soc'), why: () => 'The fear was not of negative evaluation or visible anxiety. Avoiding people for other reasons — low mood, exhaustion, sensory overload, paranoia — is not social anxiety disorder, and this is the single most common misattribution in the chapter.' },
      { id: 'C', label: 'Near-invariable and avoided', test: a => notNo(a, 'soc_alw') && notNo(a, 'soc_avo'), why: () => 'The situations were not almost always feared, or were not avoided or endured with intense distress.' },
      { id: 'D', label: 'Out of proportion', test: a => notNo(a, 'soc_out'), why: () => 'The fear was proportionate to the actual threat. Realistic apprehension in a genuinely hostile setting is not a disorder.' },
      { id: 'E', label: 'Six months or more', test: a => notNo(a, 'soc_dur'), why: () => 'The six-month duration was not met.' },
      { id: 'F', label: 'Distress or impairment', test: a => notNo(a, 'soc_imp'), why: () => 'No significant distress or impairment was reported.' }
    ],
    near: a => n(a, 'soc_sit') >= 1 && notNo(a, 's_soc')
  },

  {
    id: 'gad', name: 'Generalized Anxiety Disorder', chap: 'Anxiety',
    blurb: 'The residual worry diagnosis — it only applies when the worry is not owned by something else.',
    items: [
      { id: 'gad_dur', k: 'yn', q: 'Has that been going on for six months or more?' },
      {
        id: 'gad_sx', k: 'multi',
        q: 'Which of these have accompanied the worry, more days than not?',
        opts: [
          { v: 'res', t: 'Restlessness, or feeling keyed up' }, { v: 'fat', t: 'Tiring easily' },
          { v: 'con', t: 'Concentration going, or mind going blank' }, { v: 'irr', t: 'Irritability' },
          { v: 'mus', t: 'Muscle tension' }, { v: 'sle', t: 'Disturbed or unsatisfying sleep' }
        ]
      },
      {
        id: 'gad_foc', k: 'pick',
        q: 'What is the worry mostly about?',
        opts: [
          { v: 'a', t: 'Many different everyday things — work, money, health, family, small matters' },
          { v: 'b', t: 'Almost entirely one thing — having another panic attack' },
          { v: 'c', t: 'Almost entirely one thing — being judged in social situations' },
          { v: 'd', t: 'Almost entirely one thing — contamination, harm, or something being wrong' },
          { v: 'e', t: 'Almost entirely one thing — having a serious illness' },
          { v: 'f', t: 'Almost entirely one thing — my weight or shape' }
        ],
        help: 'This is the exclusion criterion that most self-report tools skip. GAD is not diagnosed when the worry is confined to the concerns of another disorder — that worry is already counted there, and counting it twice invents a second diagnosis out of one problem.'
      },
      { id: 'gad_imp', k: 'yn', q: 'Does it cause significant distress or impairment?' }
    ],
    criteria: [
      { id: 'A', label: 'Excessive worry about several things', test: a => notNo(a, 's_gad'), why: () => 'Excessive worry across a number of different domains was not described.' },
      { id: 'B', label: 'Six months, more days than not', test: a => notNo(a, 'gad_dur'), why: () => 'The six-month duration was not met.' },
      { id: 'C', label: 'Difficult to control', test: a => notNo(a, 's_gad'), why: () => 'The worry was controllable. Ordinary worry that can be set aside is not GAD however unpleasant it is.' },
      { id: 'D', label: 'Three or more physical symptoms', test: a => n(a, 'gad_sx') >= 3, why: a => `Only ${n(a, 'gad_sx')} of the 6 accompanying symptoms were present; 3 are required in adults.` },
      { id: 'E', label: 'Distress or impairment', test: a => notNo(a, 'gad_imp'), why: () => 'No significant distress or impairment was reported.' }
    ],
    near: a => notNo(a, 's_gad') && n(a, 'gad_sx') >= 1
  },

  {
    id: 'phobia', name: 'Specific Phobia', chap: 'Anxiety',
    blurb: 'One object or situation, immediate fear, six months.',
    items: [
      {
        id: 'pho_obj', k: 'multi',
        q: 'Which of these does the fear centre on?',
        opts: [
          { v: 'ani', t: 'Animals or insects' }, { v: 'nat', t: 'Heights, storms, water' },
          { v: 'blo', t: 'Blood, injections, injury' }, { v: 'sit', t: 'Flying, lifts, enclosed places' },
          { v: 'oth', t: 'Something else specific' }
        ]
      },
      { id: 'pho_avo', k: 'yn', q: 'Do you avoid it, or endure it with intense fear?' },
      { id: 'pho_dur', k: 'yn', q: 'Has it lasted six months or more?' },
      { id: 'pho_imp', k: 'yn', q: 'Does it cause significant distress or impairment?' }
    ],
    criteria: [
      { id: 'A', label: 'A specific feared object or situation', test: a => n(a, 'pho_obj') >= 1, why: () => 'No specific object or situation was identified.' },
      { id: 'B', label: 'Immediate, near-invariable fear', test: a => notNo(a, 's_pho'), why: () => 'The fear was not immediate and near-invariable on encountering the object.' },
      { id: 'C', label: 'Avoided or endured with intense fear', test: a => notNo(a, 'pho_avo'), why: () => 'The situation was neither avoided nor endured with intense fear.' },
      { id: 'D', label: 'Out of proportion', test: a => notNo(a, 's_pho'), why: () => 'The fear was proportionate to the real danger, which is caution rather than phobia.' },
      { id: 'E', label: 'Six months or more', test: a => notNo(a, 'pho_dur'), why: () => 'The six-month duration was not met.' },
      { id: 'F', label: 'Distress or impairment', test: a => notNo(a, 'pho_imp'), why: () => 'The fear did not cause significant distress or impairment. Most specific fears never reach this bar, which is why phobia is far rarer than fear.' }
    ],
    near: a => n(a, 'pho_obj') >= 1 && notNo(a, 's_pho')
  },

  /* -------------------------------------------------- OCD AND RELATED --- */
  {
    id: 'ocd', name: 'Obsessive-Compulsive Disorder', chap: 'Obsessive-Compulsive',
    blurb: 'Obsessions, compulsions, or both — plus a time or impairment threshold.',
    items: [
      { id: 'ocd_obs', k: 'yn', q: 'Do unwanted, intrusive thoughts, images or urges keep returning and cause marked distress?' },
      { id: 'ocd_com', k: 'yn', q: 'Do you feel driven to perform repeated behaviours or mental acts — checking, washing, counting, ordering, repeating, praying?' },
      { id: 'ocd_lnk', k: 'yn', q: 'Are those acts aimed at reducing distress or preventing something bad, rather than being enjoyable in themselves?', help: 'This separates compulsions from habits and from behaviours that are pleasurable, such as gambling or substance use.' },
      {
        id: 'ocd_tim', k: 'pick',
        q: 'Roughly how much of a normal day do the thoughts and acts take up?',
        opts: [
          { v: 'a', t: 'More than an hour on most days' },
          { v: 'b', t: 'Fifteen minutes to an hour' },
          { v: 'c', t: 'Less than that' }
        ]
      },
      { id: 'ocd_imp', k: 'yn', q: 'Do they cause significant distress or interfere with your life?' }
    ],
    criteria: [
      { id: 'A', label: 'Obsessions or compulsions present', test: a => notNo(a, 'ocd_obs') || notNo(a, 'ocd_com'), why: () => 'Neither recurrent intrusive thoughts nor driven repetitive acts were described.' },
      { id: 'B', label: 'Compulsions serve to reduce distress', test: a => a.ocd_com !== 'yes' || notNo(a, 'ocd_lnk'), why: () => 'The repetitive behaviours were not aimed at reducing distress or preventing harm. Behaviours performed for pleasure or reward are not compulsions, however repetitive they are.' },
      { id: 'C', label: 'Over an hour a day, or clear impairment', test: a => a.ocd_tim === 'a' || notNo(a, 'ocd_imp'), why: () => 'The symptoms neither consumed more than an hour a day nor caused significant distress or impairment. Either one satisfies the criterion; neither was met.' }
    ],
    near: a => notNo(a, 'ocd_obs') || notNo(a, 'ocd_com')
  },

  {
    id: 'bdd', name: 'Body Dysmorphic Disorder', chap: 'Obsessive-Compulsive',
    items: [
      { id: 'bdd_beh', k: 'yn', q: 'Do you perform repetitive behaviours about it — mirror checking, grooming, skin picking, seeking reassurance, comparing yourself?' },
      { id: 'bdd_wgt', k: 'yn', q: 'Is the concern entirely about being fat, or about your weight?', help: 'If the answer is yes, this is routed to the eating-disorder branch instead. The two look identical from outside and are not the same diagnosis.' },
      { id: 'bdd_imp', k: 'yn', q: 'Does it cause significant distress or impairment?' }
    ],
    criteria: [
      { id: 'A', label: 'Preoccupation with a perceived flaw', test: a => notNo(a, 's_bdd'), why: () => 'No preoccupation with a perceived appearance flaw was described.' },
      { id: 'B', label: 'Repetitive behaviours or mental acts', test: a => notNo(a, 'bdd_beh'), why: () => 'No repetitive checking, grooming, comparing or reassurance-seeking was reported. Dissatisfaction with appearance without these behaviours is not this disorder.' },
      { id: 'C', label: 'Distress or impairment', test: a => notNo(a, 'bdd_imp'), why: () => 'No significant distress or impairment was reported.' }
    ],
    near: a => notNo(a, 's_bdd')
  },

  {
    id: 'hoard', name: 'Hoarding Disorder', chap: 'Obsessive-Compulsive',
    items: [
      { id: 'ho_nee', k: 'yn', q: 'Is that because of a felt need to keep them, and distress at the thought of discarding them?' },
      { id: 'ho_imp', k: 'yn', q: 'Does it cause significant distress or impairment, including an unsafe environment?' }
    ],
    criteria: [
      { id: 'A', label: 'Persistent difficulty discarding', test: a => notNo(a, 's_hoard'), why: () => 'Persistent difficulty parting with possessions was not described.' },
      { id: 'B', label: 'Driven by perceived need and distress', test: a => notNo(a, 'ho_nee'), why: () => 'The difficulty was not driven by a felt need to save or by distress at discarding.' },
      { id: 'C', label: 'Living areas congested', test: a => notNo(a, 's_hoard'), why: () => 'Living areas were not so cluttered as to be unusable. This is the criterion that separates hoarding disorder from ordinary clutter or collecting, and it is the one most often assumed rather than checked.' },
      { id: 'D', label: 'Distress or impairment', test: a => notNo(a, 'ho_imp'), why: () => 'No significant distress, impairment or safety problem was reported.' }
    ],
    near: a => notNo(a, 's_hoard')
  },

  {
    id: 'bfrb', name: 'Hair-Pulling / Skin-Picking Disorder', chap: 'Obsessive-Compulsive',
    items: [
      { id: 'bf_try', k: 'yn', q: 'Have you repeatedly tried to stop or cut down?' },
      { id: 'bf_imp', k: 'yn', q: 'Does it cause significant distress or impairment?' }
    ],
    criteria: [
      { id: 'A', label: 'Recurrent pulling or picking', test: a => notNo(a, 's_bfrb'), why: () => 'Neither recurrent hair pulling nor skin picking was described.' },
      { id: 'B', label: 'Resulting hair loss or lesions', test: a => notNo(a, 's_bfrb'), why: () => 'No resulting hair loss or skin lesions were reported. The visible consequence is part of the definition.' },
      { id: 'C', label: 'Repeated attempts to stop', test: a => notNo(a, 'bf_try'), why: () => 'No repeated attempts to stop or reduce were reported.' },
      { id: 'D', label: 'Distress or impairment', test: a => notNo(a, 'bf_imp'), why: () => 'No significant distress or impairment was reported.' }
    ],
    near: a => notNo(a, 's_bfrb')
  },

  /* ------------------------------------------------ TRAUMA AND STRESS --- */
  {
    id: 'ptsd', name: 'Post-Traumatic Stress Disorder', chap: 'Trauma',
    blurb: 'Four separate symptom clusters, each with its own threshold. All four are required.',
    items: [
      {
        id: 'pt_eve', k: 'pick',
        q: 'How were you exposed to actual or threatened death, serious injury, or sexual violence?',
        opts: [
          { v: 'a', t: 'It happened directly to me' },
          { v: 'b', t: 'I witnessed it happen to someone else' },
          { v: 'c', t: 'I learned it happened to a close family member or friend' },
          { v: 'd', t: 'Repeated exposure to details through my work' },
          { v: 'e', t: 'None of these — the event was distressing but not of this kind' }
        ],
        help: 'Criterion A is narrow on purpose. Divorce, job loss, humiliation and bullying are genuinely traumatic in ordinary language but do not meet this bar, and the diagnosis stops here when they are the event.'
      },
      {
        id: 'pt_avo', k: 'multi',
        q: 'Which avoidance has been present?',
        opts: [
          { v: 'int', t: 'Avoiding memories, thoughts or feelings about it' },
          { v: 'ext', t: 'Avoiding people, places, conversations or objects that bring it up' }
        ]
      },
      {
        id: 'pt_cog', k: 'multi',
        q: 'Which changes in thinking or mood began or worsened after it?',
        opts: [
          { v: 'amn', t: 'Being unable to remember important parts of it' },
          { v: 'bel', t: 'Persistent strong negative beliefs about myself, others or the world' },
          { v: 'bla', t: 'Distorted blame of myself or others for it' },
          { v: 'emo', t: 'Persistent fear, horror, anger, guilt or shame' },
          { v: 'int', t: 'Markedly less interest in activities' },
          { v: 'det', t: 'Feeling detached or estranged from others' },
          { v: 'pos', t: 'Being unable to feel positive emotions' }
        ]
      },
      {
        id: 'pt_aro', k: 'multi',
        q: 'Which changes in arousal or reactivity began or worsened after it?',
        opts: [
          { v: 'irr', t: 'Irritability or angry outbursts' },
          { v: 'rec', t: 'Reckless or self-destructive behaviour' },
          { v: 'hyp', t: 'Hypervigilance' }, { v: 'sta', t: 'Exaggerated startle response' },
          { v: 'con', t: 'Concentration problems' }, { v: 'sle', t: 'Sleep disturbance' }
        ]
      },
      { id: 'pt_dur', k: 'yn', q: 'Has all of that lasted more than one month?' },
      { id: 'pt_imp', k: 'yn', q: 'Does it cause significant distress or impairment?' }
    ],
    criteria: [
      { id: 'A', label: 'Qualifying exposure', test: a => ['a', 'b', 'c', 'd'].includes(a.pt_eve), why: () => 'The event did not meet criterion A — exposure to actual or threatened death, serious injury, or sexual violence. This is the narrowest gate in the manual and it stops many genuinely distressing experiences. Where the event is real but does not qualify here, adjustment disorder is usually the correct home.' },
      { id: 'B', label: 'Intrusion symptoms', test: a => notNo(a, 's_ptsd'), why: () => 'The event does not intrude through memories, nightmares, flashbacks or reactions to reminders. At least one intrusion symptom is required.' },
      { id: 'C', label: 'One or more avoidance symptoms', test: a => n(a, 'pt_avo') >= 1, why: () => 'Neither internal nor external avoidance was present. At least one is required, and this cluster is the one most often missing when the other three are full.' },
      { id: 'D', label: 'Two or more cognition and mood changes', test: a => n(a, 'pt_cog') >= 2, why: a => `Only ${n(a, 'pt_cog')} of the 7 cognition and mood changes were present; 2 are required.` },
      { id: 'E', label: 'Two or more arousal changes', test: a => n(a, 'pt_aro') >= 2, why: a => `Only ${n(a, 'pt_aro')} of the 6 arousal and reactivity changes were present; 2 are required.` },
      { id: 'F', label: 'More than one month', test: a => notNo(a, 'pt_dur'), why: () => 'The disturbance has lasted under a month. Under a month with the same picture is acute stress disorder, not PTSD.' },
      { id: 'G', label: 'Distress or impairment', test: a => notNo(a, 'pt_imp'), why: () => 'No significant distress or impairment was reported.' }
    ],
    near: a => ['a', 'b', 'c', 'd'].includes(a.pt_eve) && notNo(a, 's_ptsd')
  },

  {
    id: 'adjust', name: 'Adjustment Disorder', chap: 'Trauma',
    blurb: 'The residual category. It only applies when nothing else does.',
    items: [
      { id: 'adj_out', k: 'yn', q: 'Is the distress out of proportion to the stressor, or is it clearly impairing your functioning?' },
      { id: 'adj_end', k: 'yn', q: 'Has the stressor now ended more than six months ago, with the symptoms still going?' }
    ],
    criteria: [
      { id: 'A', label: 'A stressor within three months before onset', test: a => notNo(a, 'c_stress'), why: () => 'No identifiable stressor in the three months before onset was reported at the start.' },
      { id: 'B', label: 'Out of proportion or impairing', test: a => notNo(a, 'adj_out'), why: () => 'The reaction was proportionate and not impairing, which is an expected response rather than a disorder.' },
      { id: 'C', label: 'Not persisting past six months after the stressor ended', test: a => a.adj_end !== 'yes', why: () => 'The symptoms have continued more than six months after the stressor and its consequences ended, which takes it outside adjustment disorder.' }
    ],
    near: a => notNo(a, 'c_stress') && notNo(a, 'adj_out')
  },

  /* -------------------------------------- SOMATIC AND DISSOCIATIVE ------ */
  {
    id: 'ssd', name: 'Somatic Symptom Disorder', chap: 'Somatic',
    items: [
      { id: 'ss_sym', k: 'yn', q: 'Do you have one or more physical symptoms that are distressing or disrupt daily life?' },
      {
        id: 'ss_th', k: 'multi',
        q: 'Which of these are true about how you relate to those symptoms?',
        opts: [
          { v: 'tho', t: 'Persistent thoughts about how serious they must be, out of proportion to the evidence' },
          { v: 'anx', t: 'Persistently high anxiety about my health or the symptoms' },
          { v: 'tim', t: 'Excessive time and energy devoted to them' }
        ]
      },
      { id: 'ss_dur', k: 'yn', q: 'Has this state lasted six months or more, even if the specific symptom changed?' }
    ],
    criteria: [
      { id: 'A', label: 'Distressing physical symptoms', test: a => notNo(a, 'ss_sym'), why: () => 'No distressing or disruptive physical symptoms were reported. Without them the branch moves to illness anxiety disorder.' },
      { id: 'B', label: 'Excessive thoughts, feelings or behaviours', test: a => n(a, 'ss_th') >= 1, why: () => 'None of the three excessive responses were present. A physical symptom alone, however unexplained, is not this diagnosis — the disorder is in the response, not in whether the symptom has a medical cause.' },
      { id: 'C', label: 'Six months or more', test: a => notNo(a, 'ss_dur'), why: () => 'The six-month duration was not met.' }
    ],
    near: a => notNo(a, 'ss_sym')
  },

  {
    id: 'iad', name: 'Illness Anxiety Disorder', chap: 'Somatic',
    items: [
      { id: 'ia_pre', k: 'yn', q: 'Are you preoccupied with having or acquiring a serious illness?' },
      { id: 'ia_min', k: 'yn', q: 'Are physical symptoms absent, or only mild?' },
      { id: 'ia_anx', k: 'yn', q: 'Is your anxiety about health high, and are you easily alarmed about it?' },
      {
        id: 'ia_beh', k: 'pick', q: 'Which pattern fits you?',
        opts: [
          { v: 'a', t: 'I check my body or seek reassurance repeatedly' },
          { v: 'b', t: 'I avoid doctors, hospitals and appointments' },
          { v: 'c', t: 'Neither' }
        ]
      },
      { id: 'ia_dur', k: 'yn', q: 'Has it lasted six months or more?' }
    ],
    criteria: [
      { id: 'A', label: 'Preoccupation with having a serious illness', test: a => notNo(a, 'ia_pre'), why: () => 'No preoccupation with having or acquiring a serious illness was described.' },
      { id: 'B', label: 'Somatic symptoms absent or mild', test: a => notNo(a, 'ia_min'), why: () => 'Substantial physical symptoms are present, which routes this to somatic symptom disorder instead. The two are separated by whether there is much of a symptom to worry about.' },
      { id: 'C', label: 'High health anxiety', test: a => notNo(a, 'ia_anx'), why: () => 'Health anxiety was not high and easily triggered.' },
      { id: 'D', label: 'Checking or avoidance behaviour', test: a => ['a', 'b'].includes(a.ia_beh), why: () => 'Neither excessive checking nor maladaptive avoidance of care was present.' },
      { id: 'E', label: 'Six months or more', test: a => notNo(a, 'ia_dur'), why: () => 'The six-month duration was not met.' }
    ],
    near: a => notNo(a, 'ia_pre')
  },

  {
    id: 'dpdr', name: 'Depersonalization / Derealization Disorder', chap: 'Dissociative',
    items: [
      { id: 'dp_rea', k: 'yn', q: 'During those episodes, did you know it was not literally true?', help: 'Intact reality testing is required. If the belief is held as literally true, the branch moves to the psychotic spectrum.' },
      { id: 'dp_per', k: 'yn', q: 'Have the experiences been persistent or recurrent, rather than one-off?' },
      { id: 'dp_imp', k: 'yn', q: 'Do they cause significant distress or impairment?' }
    ],
    criteria: [
      { id: 'A', label: 'Depersonalization or derealization', test: a => notNo(a, 's_dpdr'), why: () => 'Neither depersonalization nor derealization was described.' },
      { id: 'B', label: 'Persistent or recurrent', test: a => notNo(a, 'dp_per'), why: () => 'The experiences were isolated rather than persistent or recurrent. Brief episodes are extremely common in the general population and are not a disorder.' },
      { id: 'C', label: 'Reality testing intact', test: a => notNo(a, 'dp_rea'), why: () => 'Reality testing was not intact during the episodes, which takes this out of the dissociative chapter and into the psychotic spectrum.' },
      { id: 'D', label: 'Distress or impairment', test: a => notNo(a, 'dp_imp'), why: () => 'No significant distress or impairment was reported.' }
    ],
    near: a => notNo(a, 's_dpdr')
  },

  /* ---------------------------------------------------------- SUBSTANCE - */
  {
    id: 'aud', name: 'Alcohol Use Disorder', chap: 'Substance',
    blurb: 'Eleven criteria, any two within twelve months. Severity is a count.',
    items: [
      {
        id: 'au_c', k: 'multi',
        q: 'Within the last twelve months, which of these were true of your drinking?',
        opts: [
          { v: 'more', t: 'Drank more, or for longer, than I intended' },
          { v: 'cut', t: 'Wanted to cut down or stop and could not' },
          { v: 'time', t: 'A lot of time spent getting it, drinking, or recovering' },
          { v: 'crav', t: 'Strong craving or urge to drink' },
          { v: 'role', t: 'Failed to meet obligations at work, home or study' },
          { v: 'soc', t: 'Kept drinking despite relationship problems it caused' },
          { v: 'give', t: 'Gave up activities I used to value' },
          { v: 'risk', t: 'Drank in physically hazardous situations' },
          { v: 'phys', t: 'Kept drinking despite a physical or psychological problem it caused' },
          { v: 'tol', t: 'Needed more for the same effect, or the same amount did less' },
          { v: 'wit', t: 'Withdrawal symptoms, or drinking to relieve them' }
        ]
      },
      { id: 'au_imp', k: 'yn', q: 'Has it caused clinically significant impairment or distress?' }
    ],
    criteria: [
      { id: 'A', label: 'Two or more criteria in twelve months', test: a => n(a, 'au_c') >= 2, why: a => `Only ${n(a, 'au_c')} of the 11 criteria were endorsed; 2 within a twelve-month period are required.` },
      { id: 'B', label: 'Impairment or distress', test: a => notNo(a, 'au_imp'), why: () => 'No clinically significant impairment or distress was reported.' }
    ],
    severity: a => { const c = n(a, 'au_c'); return c >= 6 ? 'severe' : c >= 4 ? 'moderate' : c >= 2 ? 'mild' : null; },
    near: a => n(a, 'au_c') >= 1
  },

  {
    id: 'sud', name: 'Substance Use Disorder (non-alcohol)', chap: 'Substance',
    items: [
      {
        id: 'su_c', k: 'multi',
        q: 'Within the last twelve months, which of these were true of that use?',
        opts: [
          { v: 'more', t: 'Used more, or for longer, than I intended' },
          { v: 'cut', t: 'Wanted to cut down or stop and could not' },
          { v: 'time', t: 'A lot of time spent getting it, using, or recovering' },
          { v: 'crav', t: 'Strong craving or urge to use' },
          { v: 'role', t: 'Failed to meet obligations at work, home or study' },
          { v: 'soc', t: 'Kept using despite relationship problems it caused' },
          { v: 'give', t: 'Gave up activities I used to value' },
          { v: 'risk', t: 'Used in physically hazardous situations' },
          { v: 'phys', t: 'Kept using despite a physical or psychological problem it caused' },
          { v: 'tol', t: 'Needed more for the same effect' },
          { v: 'wit', t: 'Withdrawal symptoms, or using to relieve them' }
        ]
      },
      { id: 'su_imp', k: 'yn', q: 'Has it caused clinically significant impairment or distress?' }
    ],
    criteria: [
      { id: 'A', label: 'Two or more criteria in twelve months', test: a => n(a, 'su_c') >= 2, why: a => `Only ${n(a, 'su_c')} of the 11 criteria were endorsed; 2 are required.` },
      { id: 'B', label: 'Impairment or distress', test: a => notNo(a, 'su_imp'), why: () => 'No clinically significant impairment or distress was reported.' }
    ],
    severity: a => { const c = n(a, 'su_c'); return c >= 6 ? 'severe' : c >= 4 ? 'moderate' : c >= 2 ? 'mild' : null; },
    near: a => n(a, 'su_c') >= 1
  },

  /* ------------------------------------------------------------ EATING -- */
  {
    id: 'an', name: 'Anorexia Nervosa', chap: 'Feeding and Eating',
    items: [
      { id: 'an_res', k: 'yn', q: 'Do you restrict what you eat to the point that your body weight is significantly low for your age, sex and health?' },
      { id: 'an_fea', k: 'yn', q: 'Do you have an intense fear of gaining weight, or persistently behave in ways that prevent gain, even at low weight?' },
      { id: 'an_bod', k: 'yn', q: 'Is your self-worth heavily determined by weight or shape, or do you not recognise the seriousness of the low weight?' }
    ],
    criteria: [
      { id: 'A', label: 'Restriction leading to significantly low weight', test: a => notNo(a, 'an_res'), why: () => 'Significantly low body weight resulting from restriction was not reported. Restriction and fear without low weight is atypical anorexia, coded under other specified feeding disorder, not anorexia nervosa.' },
      { id: 'B', label: 'Fear of gain, or behaviour preventing gain', test: a => notNo(a, 'an_fea'), why: () => 'Neither intense fear of weight gain nor persistent behaviour preventing gain was present.' },
      { id: 'C', label: 'Body image disturbance', test: a => notNo(a, 'an_bod'), why: () => 'Self-evaluation was not unduly influenced by weight or shape, and the seriousness of the low weight was recognised.' }
    ],
    near: a => notNo(a, 'an_res') || notNo(a, 'an_fea')
  },

  {
    id: 'bn', name: 'Bulimia Nervosa', chap: 'Feeding and Eating',
    items: [
      { id: 'bn_com', k: 'yn', q: 'Do you regularly compensate afterwards — vomiting, laxatives, fasting, or excessive exercise?' },
      {
        id: 'bn_fre', k: 'pick', q: 'How often have both happened?',
        opts: [
          { v: 'a', t: 'At least once a week for three months or more' },
          { v: 'b', t: 'Less often than that' }
        ]
      },
      { id: 'bn_sel', k: 'yn', q: 'Is your self-evaluation unduly influenced by your shape and weight?' }
    ],
    criteria: [
      { id: 'A', label: 'Recurrent binge eating', test: a => notNo(a, 's_eat_b'), why: () => 'Recurrent binge episodes with loss of control were not described. Eating a lot without the loss-of-control sense is overeating, not a binge.' },
      { id: 'B', label: 'Recurrent compensatory behaviour', test: a => notNo(a, 'bn_com'), why: () => 'No recurrent compensatory behaviour was reported. Without it the branch moves to binge-eating disorder.' },
      { id: 'C', label: 'Weekly for three months', test: a => a.bn_fre === 'a', why: () => 'The once-a-week-for-three-months frequency threshold was not met.' },
      { id: 'D', label: 'Self-evaluation tied to shape and weight', test: a => notNo(a, 'bn_sel'), why: () => 'Self-evaluation was not unduly influenced by shape and weight.' }
    ],
    near: a => notNo(a, 's_eat_b')
  },

  {
    id: 'bed', name: 'Binge-Eating Disorder', chap: 'Feeding and Eating',
    items: [
      {
        id: 'be_fea', k: 'multi',
        q: 'Which of these are true of those episodes?',
        opts: [
          { v: 'fas', t: 'Eating much faster than normal' },
          { v: 'ful', t: 'Eating until uncomfortably full' },
          { v: 'hun', t: 'Eating large amounts when not physically hungry' },
          { v: 'alo', t: 'Eating alone because of embarrassment' },
          { v: 'aft', t: 'Feeling disgusted, depressed or very guilty afterwards' }
        ]
      },
      { id: 'be_dis', k: 'yn', q: 'Is there marked distress about the bingeing itself?' },
      {
        id: 'be_fre', k: 'pick', q: 'How often does it happen?',
        opts: [
          { v: 'a', t: 'At least once a week for three months or more' },
          { v: 'b', t: 'Less often than that' }
        ]
      }
    ],
    criteria: [
      { id: 'A', label: 'Recurrent binge eating', test: a => notNo(a, 's_eat_b'), why: () => 'Recurrent binge episodes with loss of control were not described.' },
      { id: 'B', label: 'Three or more associated features', test: a => n(a, 'be_fea') >= 3, why: a => `Only ${n(a, 'be_fea')} of the 5 associated features were present; 3 are required.` },
      { id: 'C', label: 'Marked distress about the bingeing', test: a => notNo(a, 'be_dis'), why: () => 'Marked distress about the binge eating was not reported.' },
      { id: 'D', label: 'Weekly for three months', test: a => a.be_fre === 'a', why: () => 'The once-a-week-for-three-months frequency threshold was not met.' }
    ],
    near: a => notNo(a, 's_eat_b')
  },

  /* ------------------------------------------------------------- SLEEP -- */
  {
    id: 'insomnia', name: 'Insomnia Disorder', chap: 'Sleep-Wake',
    items: [
      { id: 'in_opp', k: 'yn', q: 'Does this happen despite having adequate opportunity to sleep?', help: 'Insufficient sleep because of shift work, a newborn or a long commute is sleep deprivation, not insomnia disorder.' },
      { id: 'in_fre', k: 'yn', q: 'Does it occur at least three nights a week?' },
      { id: 'in_dur', k: 'yn', q: 'Has it lasted three months or more?' },
      { id: 'in_day', k: 'yn', q: 'Does it cause daytime consequences — fatigue, mood, concentration, work or study problems?' }
    ],
    criteria: [
      { id: 'A', label: 'A sleep complaint', test: a => notNo(a, 's_ins'), why: () => 'No difficulty with sleep onset, maintenance or early waking was reported.' },
      { id: 'B', label: 'Adequate opportunity to sleep', test: a => notNo(a, 'in_opp'), why: () => 'There was not adequate opportunity to sleep. That makes this sleep deprivation rather than insomnia disorder, and the fix is circumstantial rather than clinical.' },
      { id: 'C', label: 'Three nights a week', test: a => notNo(a, 'in_fre'), why: () => 'The three-nights-a-week frequency was not met.' },
      { id: 'D', label: 'Three months or more', test: a => notNo(a, 'in_dur'), why: () => 'The three-month duration was not met. Shorter than that is short-term insomnia, which usually resolves without treatment.' },
      { id: 'E', label: 'Daytime consequences', test: a => notNo(a, 'in_day'), why: () => 'No daytime consequences were reported. Short sleep without daytime effects is not a disorder — some people simply need less.' }
    ],
    near: a => notNo(a, 's_ins') && notNo(a, 'in_day')
  },

  /* --------------------------------------------- NEURODEVELOPMENTAL ----- */
  {
    id: 'adhd', name: 'Attention-Deficit / Hyperactivity Disorder', chap: 'Neurodevelopmental',
    blurb: 'Childhood onset is a hard gate. Adult-onset attention problems are something else.',
    items: [
      {
        id: 'ad_in', k: 'multi',
        q: 'Which inattention symptoms have persisted for six months or more, to a degree that does not fit your age?',
        opts: [
          { v: 'det', t: 'Careless mistakes, missing detail' },
          { v: 'sus', t: 'Cannot sustain attention on tasks' },
          { v: 'lis', t: 'Seems not to listen when spoken to directly' },
          { v: 'fol', t: 'Does not follow through, leaves things unfinished' },
          { v: 'org', t: 'Poor organisation of tasks and time' },
          { v: 'avo', t: 'Avoids tasks needing sustained mental effort' },
          { v: 'los', t: 'Loses things needed for tasks' },
          { v: 'dis', t: 'Easily distracted by outside stimuli' },
          { v: 'for', t: 'Forgetful in daily activities' }
        ]
      },
      {
        id: 'ad_hi', k: 'multi',
        q: 'Which hyperactivity or impulsivity symptoms have persisted for six months or more?',
        opts: [
          { v: 'fid', t: 'Fidgets, taps, squirms' }, { v: 'sea', t: 'Leaves seat when staying seated is expected' },
          { v: 'res', t: 'Feels restless' }, { v: 'qui', t: 'Cannot do quiet activities' },
          { v: 'go', t: '"On the go", driven by a motor' }, { v: 'tal', t: 'Talks excessively' },
          { v: 'blu', t: 'Blurts out answers' }, { v: 'wai', t: 'Cannot wait their turn' },
          { v: 'int', t: 'Interrupts or intrudes on others' }
        ]
      },
      {
        id: 'ad_ons', k: 'pick', q: 'When did several of these first appear?',
        opts: [
          { v: 'a', t: 'Several were clearly there before I was 12' },
          { v: 'b', t: 'They started in my teens' },
          { v: 'c', t: 'They started in adulthood' },
          { v: 'd', t: 'I genuinely do not know' }
        ],
        help: 'Age 12 is a hard gate. Attention and restlessness problems that begin in adulthood are far more often depression, anxiety, sleep debt, substance use or thyroid disease than ADHD, and the tool will say so.'
      },
      { id: 'ad_set', k: 'yn', q: 'Are the symptoms present in two or more settings — for example home and work?' },
      { id: 'ad_imp', k: 'yn', q: 'Do they clearly interfere with functioning or quality of life?' }
    ],
    criteria: [
      { id: 'A', label: 'Five or more symptoms in one domain', test: a => n(a, 'ad_in') >= 5 || n(a, 'ad_hi') >= 5, why: a => `Inattention: ${n(a, 'ad_in')} of 9. Hyperactivity-impulsivity: ${n(a, 'ad_hi')} of 9. For an adult, 5 in one domain are required.` },
      { id: 'B', label: 'Several symptoms present before age 12', test: a => ['a', 'd'].includes(a.ad_ons), why: a => a.ad_ons === 'c' ? 'The symptoms began in adulthood. ADHD is a neurodevelopmental disorder and cannot start in adulthood — the same picture arriving late is far more often depression, an anxiety disorder, chronic sleep loss, substance use, or a thyroid problem, and each of those is treatable in a different way.' : 'The symptoms began in the teenage years, after the age-12 cut-off.' },
      { id: 'C', label: 'Present in two or more settings', test: a => notNo(a, 'ad_set'), why: () => 'The symptoms were confined to a single setting. Problems that appear only at work point to the job rather than to the person.' },
      { id: 'D', label: 'Clear interference with functioning', test: a => notNo(a, 'ad_imp'), why: () => 'No clear interference with functioning or quality of life was reported.' }
    ],
    near: a => n(a, 'ad_in') >= 3 || n(a, 'ad_hi') >= 3
  },

  /* ---------------------------------------------------------- PSYCHOSIS - */
  {
    id: 'psych', name: 'Psychotic-Spectrum Features', chap: 'Psychotic',
    blurb: 'This branch is deliberately not finished by a self-report tool.',
    referOnly: true,
    items: [
      { id: 'ps_moo', k: 'yn', q: 'Did these happen only during a period of severe depression or unusually high mood?' },
      { id: 'ps_sub', k: 'yn', q: 'Did they happen only while using a substance, or withdrawing from one?' },
      { id: 'ps_imp', k: 'yn', q: 'Did they cause significant distress or impairment?' }
    ],
    criteria: [
      { id: 'A', label: 'One or more psychotic-spectrum features', test: a => notNo(a, 's_psy'), why: () => 'No psychotic-spectrum features were reported.' },
      { id: 'B', label: 'Not confined to substance use', test: a => a.ps_sub !== 'yes', why: () => 'The experiences occurred only during substance use or withdrawal, which makes this a substance-induced psychotic disorder rather than a primary one.' },
      { id: 'C', label: 'Distress or impairment', test: a => notNo(a, 'ps_imp'), why: () => 'No significant distress or impairment was reported.' }
    ],
    near: a => notNo(a, 's_psy')
  },

  /* -------------------------------------------------------- PERSONALITY - */
  {
    id: 'pp', name: 'Personality-Pattern Screen', chap: 'Personality',
    blurb: 'A screen only. This tool will never output a personality disorder, and that is deliberate.',
    screenOnly: true,
    items: [
      {
        id: 'pp_sx', k: 'multi',
        q: 'Which of these have been true of you across most of your adult life, in most situations?',
        opts: [
          { v: 'aban', t: 'Frantic efforts to avoid being abandoned' },
          { v: 'rel', t: 'Intense, unstable relationships that swing between idealising and devaluing' },
          { v: 'ide', t: 'An unstable sense of who I am' },
          { v: 'imp', t: 'Impulsive behaviour in ways that damage me' },
          { v: 'emo', t: 'Mood that shifts sharply within hours' },
          { v: 'emp', t: 'Chronic feelings of emptiness' },
          { v: 'ang', t: 'Anger that is intense and hard to control' },
          { v: 'avo', t: 'Avoiding people or work because of fear of criticism' },
          { v: 'per', t: 'Perfectionism and control that get in the way of finishing things' },
          { v: 'dep', t: 'Needing others to take responsibility for major areas of my life' },
          { v: 'sus', t: 'Persistent suspicion that others intend to harm me' },
          { v: 'det', t: 'Little interest in close relationships of any kind' }
        ]
      },
      { id: 'pp_per', k: 'yn', q: 'Is it stable across most situations and relationships, rather than tied to one person or period?' },
      { id: 'pp_imp', k: 'yn', q: 'Does it cause significant distress or impairment?' }
    ],
    criteria: [
      { id: 'A', label: 'Four or more enduring traits', test: a => n(a, 'pp_sx') >= 4, why: a => `${n(a, 'pp_sx')} traits were endorsed; the screen triggers at 4.` },
      { id: 'B', label: 'Onset by early adulthood', test: a => notNo(a, 's_pp'), why: () => 'The pattern is a recent change rather than lifelong. Personality disorder requires an enduring pattern traceable to adolescence or early adulthood — a recent change points to a mood, anxiety, substance or medical cause.' },
      { id: 'C', label: 'Pervasive across situations', test: a => notNo(a, 'pp_per'), why: () => 'The pattern is tied to specific situations or relationships rather than being pervasive.' },
      { id: 'D', label: 'Distress or impairment', test: a => notNo(a, 'pp_imp'), why: () => 'No significant distress or impairment was reported.' }
    ],
    near: a => n(a, 'pp_sx') >= 2
  }
];

/* ================================================================== RULES */
/* The differential engine. Every rule that fires is shown to the user with its
   reasoning — this ledger is the difference between a quiz and a teaching tool.
   `st(id)` reads a status, `kill(id, why)` demotes a result to ruled-out. */

const RULES = [
  {
    id: 'R1', title: 'A manic episode outranks depression',
    fire: (R, A, C, out) => {
      if (R.manic?.status === 'met' && R.hypo && R.hypo.status !== 'out') {
        out.demote('hypo', 'Excluded by Bipolar I. Bipolar II requires that a manic episode has never occurred; one has, so the diagnosis is Bipolar I and stays there for life.');
      }
      if (R.manic?.status === 'met' && (R.mde?.status === 'met' || R.mde?.status === 'near')) {
        out.demote('mde', 'Subsumed by Bipolar I. Once a manic episode has ever occurred, depressive episodes are part of a bipolar illness and are never diagnosed as major depressive disorder alongside it. This single rule changes first-line treatment: an antidepressant given alone here can precipitate mania.');
        return 'A manic episode was established, so the depressive episodes belong to Bipolar I rather than to major depressive disorder.';
      }
    }
  },
  {
    id: 'R2', title: 'Hypomania plus depression is Bipolar II, not depression',
    fire: (R, A, C, out) => {
      if (R.hypo?.status === 'met' && R.manic?.status !== 'met' && (R.mde?.status === 'met' || R.mde?.status === 'near')) {
        out.demote('mde', 'Subsumed by Bipolar II. The depressive episode is real and is the reason most people seek help, but the hypomanic episode reclassifies the whole illness. This is the most commonly missed diagnosis in outpatient practice, because nobody comes to a clinic complaining of feeling good.');
        return 'A hypomanic episode plus a depressive episode gives Bipolar II. The depression is a component of it, not a separate diagnosis.';
      }
    }
  },
  {
    id: 'R3', title: 'A full bipolar disorder rules out cyclothymia',
    fire: (R, A, C, out) => {
      if ((R.manic?.status === 'met' || R.hypo?.status === 'met') && R.cyclo && R.cyclo.status !== 'out') {
        out.demote('cyclo', 'Excluded by a full episode. Cyclothymia is defined by swings that never reach episode criteria; once one does, the diagnosis moves up.');
        return 'A full hypomanic or manic episode was established, which excludes cyclothymic disorder by definition.';
      }
    }
  },
  {
    id: 'R3b', title: 'A hypomanic episode is not a near-miss for mania',
    fire: (R, A, C, out) => {
      if (R.hypo?.status === 'met' && R.manic && R.manic.status === 'near') {
        out.demote('manic', 'Excluded: the high period met hypomania but not mania. It fell short on duration, on severity, or on both — and falling short is the diagnosis here rather than an approximation of one. Bipolar II is a distinct disorder, not a milder Bipolar I.');
        return 'The high period qualified as hypomania rather than mania, so Bipolar I is excluded outright instead of being reported as close. The two are separate diagnoses, and the near-threshold framing would be misleading.';
      }
    }
  },
  {
    id: 'R4', title: 'Psychosis confined to mood episodes is not a psychotic disorder',
    fire: (R, A, C, out) => {
      if (R.psych && R.psych.status !== 'out' && A.ps_moo === 'yes') {
        out.demote('psych', 'Psychotic features occurred only during mood episodes, so they are a specifier on the mood disorder — "with psychotic features" — not a schizophrenia-spectrum diagnosis. The distinction decides whether the treatment target is the mood illness or the psychosis.');
        return 'The psychotic features occurred only inside mood episodes, so they are coded as a specifier on the mood disorder rather than as a separate psychotic disorder.';
      }
    }
  },
  {
    id: 'R5', title: 'Worry with a single focus is not generalized anxiety',
    fire: (R, A, C, out) => {
      const owner = { b: 'panic disorder', c: 'social anxiety disorder', d: 'obsessive-compulsive disorder', e: 'illness anxiety disorder', f: 'an eating disorder' }[A.gad_foc];
      if (owner && R.gad && R.gad.status !== 'out') {
        out.demote('gad', `Excluded: the worry is confined to the concerns of ${owner}. GAD requires worry spread across several unrelated domains. Counting a single-focus worry here as well would turn one problem into two diagnoses.`);
        return `The worry was almost entirely about one thing, which belongs to ${owner}. GAD is not diagnosed when the anxiety is better explained by another disorder's focus.`;
      }
    }
  },
  {
    id: 'R6', title: 'Fully cued panic attacks belong to whatever cues them',
    fire: (R, A, C, out) => {
      if (A.pan_cue === 'b' && R.panic && R.panic.status !== 'out') {
        out.demote('panic', 'Excluded: every attack was triggered. Panic attacks are recorded as a specifier on the disorder that produces the trigger — a phobia, social anxiety, PTSD — and are not a separate diagnosis.');
        return 'All the panic attacks were cued, so they are a specifier on the disorder that supplies the cue rather than panic disorder.';
      }
    }
  },
  {
    id: 'R7', title: 'Appearance concern confined to weight belongs to the eating chapter',
    fire: (R, A, C, out) => {
      if (A.bdd_wgt === 'yes' && R.bdd && R.bdd.status !== 'out') {
        out.demote('bdd', 'Excluded: the concern is entirely about weight or fatness, which is an eating-disorder feature, not body dysmorphic disorder.');
        return 'The appearance preoccupation was entirely about weight, which routes it to the eating-disorder branch.';
      }
    }
  },
  {
    id: 'R8', title: 'Compensatory behaviour makes it bulimia, not binge-eating disorder',
    fire: (R, A, C, out) => {
      if (R.bed && R.bed.status !== 'out' && A.bn_com === 'yes') {
        out.demote('bed', 'Excluded: regular compensatory behaviour is present, which is the dividing line. Binge-eating disorder is specifically bingeing without compensation.');
        return 'Regular purging, fasting or excessive exercise was reported, so the bingeing belongs to bulimia nervosa rather than binge-eating disorder.';
      }
    }
  },
  {
    id: 'R9', title: 'Anorexia outranks bulimia when weight is low',
    fire: (R, A, C, out) => {
      if (R.an?.status === 'met' && R.bn && R.bn.status !== 'out') {
        out.demote('bn', 'Excluded: bingeing and purging occurring at significantly low weight are the binge-eating/purging subtype of anorexia nervosa, not a second diagnosis.');
        return 'Anorexia nervosa was established, so the binge-purge behaviour is its subtype rather than bulimia nervosa.';
      }
    }
  },
  {
    id: 'R10', title: 'Prominent somatic symptoms outrank illness anxiety',
    fire: (R, A, C, out) => {
      if (R.ssd?.status === 'met' && R.iad && R.iad.status !== 'out') {
        out.demote('iad', 'Excluded: illness anxiety disorder requires that somatic symptoms be absent or mild. With prominent symptoms the diagnosis is somatic symptom disorder.');
        return 'Distressing physical symptoms are present, so this is somatic symptom disorder rather than illness anxiety disorder.';
      }
    }
  },
  {
    id: 'R11', title: 'Adjustment disorder is the residual category',
    fire: (R, A, C, out) => {
      const others = Object.entries(R).filter(([k, v]) => k !== 'adjust' && v.status === 'met');
      if (R.adjust && R.adjust.status !== 'out' && others.length) {
        out.demote('adjust', `Excluded: adjustment disorder is only used when the presentation does not meet criteria for another disorder. ${others.length} other diagnos${others.length === 1 ? 'is' : 'es'} met criteria, so it takes the place.`);
        return 'Another diagnosis met full criteria, and adjustment disorder is by definition what is used only when none does.';
      }
    }
  },
  {
    id: 'R12', title: 'Substance use must be excluded before any primary diagnosis',
    fire: (R, A, C, out) => {
      if (C.c_sub === 'yes' || C.c_sub === 'unsure') {
        const targets = ['mde', 'pdd', 'manic', 'hypo', 'cyclo', 'panic', 'gad', 'psych', 'insomnia', 'dpdr', 'adhd'];
        let hit = 0;
        targets.forEach(t => { if (R[t] && R[t].status !== 'out') { out.taint(t, C.c_sub === 'yes' ? 'Substance use reported over the same period — a substance-induced disorder must be excluded before this can be called primary.' : 'Substance use could not be ruled out over the same period.'); hit++; } });
        if (hit) return C.c_sub === 'yes'
          ? 'Heavy substance use or withdrawal was reported across the same period. Step 2 of the differential comes before everything else: alcohol, stimulants, cannabis and withdrawal from any of them can each produce a complete picture of depression, mania, anxiety, insomnia or psychosis. Nothing below is a primary diagnosis until a period of abstinence shows the symptoms persist.'
          : 'Substance involvement could not be ruled out, so every result below carries that uncertainty.';
      }
    }
  },
  {
    id: 'R13', title: 'A medical cause must be excluded before any primary diagnosis',
    fire: (R, A, C, out) => {
      if (C.c_med === 'yes' || C.c_med === 'unsure') {
        const targets = ['mde', 'pdd', 'manic', 'hypo', 'panic', 'gad', 'psych', 'insomnia', 'adhd', 'ssd'];
        let hit = 0;
        targets.forEach(t => { if (R[t] && R[t].status !== 'out') { out.taint(t, 'A possible medical cause was reported and has not been excluded.'); hit++; } });
        if (hit) return 'A possible physical cause was flagged. Thyroid disease, anaemia, sleep apnoea, head injury and several neurological conditions each reproduce the picture of a psychiatric disorder exactly, and blood work settles in a day what months of therapy will not. This is the exclusion a self-report tool is structurally worst at.';
      }
    }
  },
  {
    id: 'R14', title: 'A medication change must be excluded',
    fire: (R, A, C, out) => {
      if (C.c_rx === 'yes') {
        const targets = ['mde', 'manic', 'hypo', 'panic', 'gad', 'psych', 'insomnia'];
        let hit = 0;
        targets.forEach(t => { if (R[t] && R[t].status !== 'out') { out.taint(t, 'A medication was started, stopped or changed around onset.'); hit++; } });
        if (hit) return 'A medication change coincided with onset. Steroids, hormonal contraceptives, isotretinoin, beta blockers and withdrawal from antidepressants or benzodiazepines all belong on this list, and the timing alone is often the whole diagnosis.';
      }
    }
  },
  {
    id: 'R15', title: 'Proportionate distress is not a disorder',
    fire: (R, A, C, out) => {
      if (C.c_norm === 'c') {
        return 'You judged the reaction proportionate to what caused it. Step 5 of the differential is the boundary with normality, and it is a real criterion rather than a courtesy: an expectable response to a genuinely hard situation is not a mental disorder however painful it is. Read everything below against that.';
      }
    }
  },
  {
    id: 'R16', title: 'Adult-onset attention problems are not ADHD',
    fire: (R, A, C, out) => {
      if (A.ad_ons === 'c' && R.adhd && R.adhd.status !== 'out') {
        out.demote('adhd', 'Excluded on onset. Symptoms beginning in adulthood cannot be ADHD, so this is a hard exclusion rather than a near miss — reporting it as close to threshold would be the wrong answer, not a cautious one.');
        return 'The attention and restlessness symptoms began in adulthood. ADHD is neurodevelopmental and its symptoms are present before age 12 by definition, so the same picture arriving later points elsewhere — most often depression, an anxiety disorder, chronic sleep debt, substance use or thyroid disease. Each of those is treated differently, and each is more common than late-recognised ADHD.';
      }
    }
  },
  {
    id: 'R17', title: 'A personality screen is never a personality diagnosis',
    fire: (R, A, C, out) => {
      if (R.pp?.status === 'met') {
        return 'The personality-pattern screen is positive. It is reported as a screen and nothing more: self-report personality measures over-identify badly, particularly while a mood or anxiety disorder is active, because current state colours how the whole of one\'s life gets remembered. A positive screen means a structured interview is worth doing, not that a disorder is present.';
      }
    }
  },
  {
    id: 'R18', title: 'Psychotic features end the self-report path',
    fire: (R, A, C, out) => {
      if (R.psych && (R.psych.status === 'met' || R.psych.status === 'near')) {
        return 'Psychotic-spectrum features were endorsed. This is the one branch that a self-report instrument must not attempt to finish: distinguishing schizophrenia, schizoaffective disorder, brief psychotic disorder, delusional disorder and a substance-induced or medical psychosis requires observation, collateral history and time. The tool stops at "features present, assess formally".';
      }
    }
  },
  {
    id: 'R19', title: 'Nothing met, but distress present',
    fire: (R, A, C, out) => {
      const any = Object.values(R).some(v => v.status === 'met');
      const near = Object.values(R).some(v => v.status === 'near');
      if (!any && near) {
        return 'Nothing reached full criteria, but one or more modules came close. In practice that is coded as an "other specified" or "unspecified" disorder in its chapter, and it is a common and legitimate outcome rather than a failure of the assessment. Subthreshold does not mean untroubled.';
      }
      if (!any && !near) {
        return 'No module reached or approached criteria. That is a real result, not an error. Most distress does not meet criteria for a disorder, and the manual is explicit that it is not meant to.';
      }
    }
  }
];
