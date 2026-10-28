/* Bodybranch: adult physical-health differential patterns. The rules describe
   supporting and conflicting features, never numerical disease probability. */
(function (root, factory) {
  const data = factory();
  if (typeof module === 'object' && module.exports) module.exports = data;
  else root.BodybranchData = data;
})(globalThis, function () {
  'use strict';
  const yn = (id, q, help = '', when = null) => ({ id, q, help, when, kind: 'yn' });
  const pick = (id, q, opts, help = '', when = null) => ({ id, q, opts, help, when, kind: 'pick' });
  const multi = (id, q, opts, help = '', when = null) => ({ id, q, opts, help, when, kind: 'multi' });
  const eq = (q, value) => ({ q, value });
  const not = (q, value) => ({ q, value, not: true });
  const any = (...rules) => ({ any: rules });
  const all = (...rules) => ({ all: rules });
  const opt = (v, t) => ({ v, t });
  const source = (title, url) => ({ title, url });
  const sources = {
    fatigue: source('NHS · tiredness and fatigue', 'https://www.nhs.uk/symptoms/tiredness-and-fatigue/'),
    iron: source('NHS · iron deficiency anaemia', 'https://www.nhs.uk/conditions/iron-deficiency-anaemia/'),
    b12: source('NHS · vitamin B12 or folate deficiency anaemia', 'https://www.nhs.uk/conditions/vitamin-b12-or-folate-deficiency-anaemia/'),
    platelets: source('NHLBI · platelet disorders', 'https://www.nhlbi.nih.gov/health/platelet-disorders'),
    hypothyroid: source('NHS · underactive thyroid', 'https://www.nhs.uk/conditions/underactive-thyroid-hypothyroidism/'),
    hashimoto: source('American Thyroid Association · Hashimoto’s thyroiditis', 'https://www.thyroid.org/hashimotos-thyroiditis/'),
    hyperthyroid: source('NHS · overactive thyroid', 'https://www.nhs.uk/conditions/overactive-thyroid-hyperthyroidism/'),
    graves: source('American Thyroid Association · Graves’ disease', 'https://www.thyroid.org/graves-disease/'),
    adrenal: source('Endocrine Society · primary adrenal insufficiency', 'https://www.endocrine.org/clinical-practice-guidelines/primary-adrenal-insufficiency'),
    diabetes: source('NIDDK · diabetes symptoms and diagnosis', 'https://www.niddk.nih.gov/health-information/diabetes/overview/symptoms-causes'),
    me: source('CDC · ME/CFS diagnostic features', 'https://www.cdc.gov/me-cfs/about/fast-facts-about-me-cfs.html'),
    longcovid: source('CDC · Long COVID', 'https://www.cdc.gov/long-covid/signs-symptoms/index.html'),
    medicine: source('MedlinePlus · drug reactions', 'https://medlineplus.gov/drugreactions.html'),
    dehydration: source('NHS · dehydration', 'https://www.nhs.uk/conditions/dehydration/'),
    asthma: source('NHS · asthma', 'https://www.nhs.uk/conditions/asthma/'),
    copd: source('NHS · COPD', 'https://www.nhs.uk/conditions/chronic-obstructive-pulmonary-disease-copd/'),
    pneumonia: source('NHS · pneumonia', 'https://www.nhs.uk/conditions/pneumonia/'),
    cough: source('NHS · cough', 'https://www.nhs.uk/symptoms/cough/'),
    sinus: source('NHS · sinusitis', 'https://www.nhs.uk/conditions/sinusitis-sinus-infection/'),
    reflux: source('NIDDK · acid reflux', 'https://www.niddk.nih.gov/health-information/digestive-diseases/acid-reflux-ger-gerd-adults'),
    palpitations: source('NHS · heart palpitations', 'https://www.nhs.uk/symptoms/heart-palpitations/'),
    svt: source('NHS · supraventricular tachycardia', 'https://www.nhs.uk/conditions/supraventricular-tachycardia-svt/'),
    af: source('NHS · atrial fibrillation', 'https://www.nhs.uk/conditions/atrial-fibrillation/'),
    angina: source('NHS · angina', 'https://www.nhs.uk/conditions/angina/'),
    heart_failure: source('NHS · heart failure', 'https://www.nhs.uk/conditions/heart-failure/'),
    costochondritis: source('NHS · costochondritis', 'https://www.nhs.uk/conditions/costochondritis/'),
    pericarditis: source('NHS · pericarditis', 'https://www.nhs.uk/conditions/pericarditis/'),
    orthostatic: source('NHS · low blood pressure', 'https://www.nhs.uk/conditions/low-blood-pressure-hypotension/'),
    pots: source('CMAJ · orthostatic tachycardia assessment', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8920526/'),
    fainting: source('NHS · fainting', 'https://www.nhs.uk/symptoms/fainting/'),
    gallstones: source('NIDDK · gallstones', 'https://www.niddk.nih.gov/health-information/digestive-diseases/gallstones'),
    ulcer: source('NIDDK · peptic ulcers', 'https://www.niddk.nih.gov/health-information/digestive-diseases/peptic-ulcers-stomach-ulcers'),
    gastroparesis: source('NIDDK · gastroparesis', 'https://www.niddk.nih.gov/health-information/digestive-diseases/gastroparesis'),
    celiac: source('NIDDK · celiac disease', 'https://www.niddk.nih.gov/health-information/digestive-diseases/celiac-disease'),
    ibs: source('NIDDK · irritable bowel syndrome', 'https://www.niddk.nih.gov/health-information/digestive-diseases/irritable-bowel-syndrome'),
    ibd: source('CDC · inflammatory bowel disease diagnosis', 'https://www.cdc.gov/inflammatory-bowel-disease/testing/index.html'),
    lactose: source('NIDDK · lactose intolerance', 'https://www.niddk.nih.gov/health-information/digestive-diseases/lactose-intolerance'),
    gastroenteritis: source('NHS · diarrhoea and vomiting', 'https://www.nhs.uk/symptoms/diarrhoea-and-vomiting/'),
    giardia: source('CDC · giardia symptoms', 'https://www.cdc.gov/giardia/signs-symptoms/index.html'),
    pancreatic: source('NIDDK · exocrine pancreatic insufficiency', 'https://www.niddk.nih.gov/health-information/digestive-diseases/exocrine-pancreatic-insufficiency'),
    constipation: source('NIDDK · constipation', 'https://www.niddk.nih.gov/health-information/digestive-diseases/constipation'),
    hemorrhoids: source('NIDDK · hemorrhoids', 'https://www.niddk.nih.gov/health-information/digestive-diseases/hemorrhoids'),
    fissure: source('NHS · anal fissure', 'https://www.nhs.uk/conditions/anal-fissure/'),
    pinworm: source('CDC · pinworm', 'https://www.cdc.gov/pinworm/about/index.html'),
    appendicitis: source('NHS · appendicitis', 'https://www.nhs.uk/conditions/appendicitis/'),
    cholecystitis: source('NHS · acute cholecystitis', 'https://www.nhs.uk/conditions/acute-cholecystitis/'),
    pancreatitis: source('NIDDK · pancreatitis', 'https://www.niddk.nih.gov/health-information/digestive-diseases/pancreatitis'),
    diverticulitis: source('NIDDK · diverticular disease', 'https://www.niddk.nih.gov/health-information/digestive-diseases/diverticulosis-diverticulitis'),
    urinary: source('NIDDK · bladder infection in adults', 'https://www.niddk.nih.gov/health-information/urologic-diseases/bladder-infection-uti-in-adults'),
    pyelonephritis: source('NIDDK · kidney infection', 'https://www.niddk.nih.gov/health-information/urologic-diseases/kidney-infection-pyelonephritis'),
    kidney: source('NIDDK · kidney stones', 'https://www.niddk.nih.gov/health-information/urologic-diseases/kidney-stones'),
    overactive_bladder: source('NHS · urinary incontinence', 'https://www.nhs.uk/conditions/urinary-incontinence/'),
    bph: source('NIDDK · benign prostate enlargement', 'https://www.niddk.nih.gov/health-information/urologic-diseases/prostate-problems/enlarged-prostate-benign-prostatic-hyperplasia'),
    prostatitis: source('NIDDK · prostatitis', 'https://www.niddk.nih.gov/health-information/urologic-diseases/prostate-problems/prostatitis-inflammation-prostate'),
    pregnancy: source('NHS · signs of pregnancy', 'https://www.nhs.uk/pregnancy/trying-for-a-baby/signs-and-symptoms-that-might-mean-youre-pregnant/'),
    endometriosis: source('WHO · endometriosis', 'https://www.who.int/news-room/fact-sheets/detail/endometriosis'),
    pcos: source('WHO · polycystic ovary syndrome', 'https://www.who.int/news-room/fact-sheets/detail/polycystic-ovary-syndrome'),
    perimenopause: source('NHS · menopause and perimenopause', 'https://www.nhs.uk/conditions/menopause-and-perimenopause/'),
    pid: source('NHS · pelvic inflammatory disease', 'https://www.nhs.uk/conditions/pelvic-inflammatory-disease-pid/'),
    migraine: source('NHS · migraine', 'https://www.nhs.uk/conditions/migraine/'),
    tension_headache: source('NHS · tension-type headaches', 'https://www.nhs.uk/conditions/tension-headaches/'),
    cluster: source('NHS · cluster headaches', 'https://www.nhs.uk/conditions/cluster-headaches/'),
    headache: source('NICE · headaches', 'https://www.nice.org.uk/guidance/cg150/chapter/Recommendations'),
    vertigo: source('NHS · vertigo', 'https://www.nhs.uk/conditions/vertigo/'),
    vestibular_neuritis: source('NHS · labyrinthitis / vestibular neuritis', 'https://www.nhs.uk/conditions/labyrinthitis/'),
    meniere: source('NIDCD · Ménière’s disease', 'https://www.nidcd.nih.gov/health/menieres-disease'),
    neuropathy: source('NHS · peripheral neuropathy', 'https://www.nhs.uk/conditions/peripheral-neuropathy/'),
    carpal_tunnel: source('NHS · carpal tunnel syndrome', 'https://www.nhs.uk/conditions/carpal-tunnel-syndrome/'),
    neck: source('NHS · neck pain', 'https://www.nhs.uk/symptoms/neck-pain-and-stiff-neck/'),
    sciatica: source('NHS · sciatica', 'https://www.nhs.uk/conditions/sciatica/'),
    osteoarthritis: source('NIAMS · osteoarthritis', 'https://www.niams.nih.gov/health-topics/osteoarthritis'),
    rheumatoid: source('NIAMS · rheumatoid arthritis', 'https://www.niams.nih.gov/health-topics/rheumatoid-arthritis'),
    gout: source('NIAMS · gout', 'https://www.niams.nih.gov/health-topics/gout'),
    spondyloarthritis: source('NIAMS · ankylosing spondylitis', 'https://www.niams.nih.gov/health-topics/ankylosing-spondylitis'),
    fibromyalgia: source('NIAMS · fibromyalgia', 'https://www.niams.nih.gov/health-topics/fibromyalgia'),
    hypermobile: source('NHS · joint hypermobility syndrome', 'https://www.nhs.uk/conditions/joint-hypermobility-syndrome/'),
    lyme: source('CDC · Lyme disease', 'https://www.cdc.gov/lyme/signs-symptoms/index.html'),
    eczema: source('NHS · atopic eczema', 'https://www.nhs.uk/conditions/atopic-eczema/'),
    contact_dermatitis: source('NHS · contact dermatitis', 'https://www.nhs.uk/conditions/contact-dermatitis/'),
    urticaria: source('NHS · hives', 'https://www.nhs.uk/conditions/hives/'),
    psoriasis: source('NHS · psoriasis', 'https://www.nhs.uk/conditions/psoriasis/'),
    scabies: source('CDC · scabies', 'https://www.cdc.gov/scabies/about/index.html'),
    shingles: source('CDC · shingles', 'https://www.cdc.gov/shingles/signs-symptoms/index.html'),
    tinea: source('NHS · ringworm', 'https://www.nhs.uk/conditions/ringworm/'),
    rosacea: source('NHS · rosacea', 'https://www.nhs.uk/conditions/rosacea/'),
    rhinitis: source('NHS · allergic rhinitis', 'https://www.nhs.uk/conditions/allergic-rhinitis/'),
    dryeye: source('National Eye Institute · dry eye', 'https://www.nei.nih.gov/eye-health-information/eye-conditions-and-diseases/dry-eye'),
    blepharitis: source('NHS · blepharitis', 'https://www.nhs.uk/conditions/blepharitis/'),
    sjogren: source('NIAMS · Sjögren’s disease', 'https://www.niams.nih.gov/health-topics/sjogrens-disease'),
    sleep: source('NHLBI · sleep apnea', 'https://www.nhlbi.nih.gov/health/sleep-apnea'),
    narcolepsy: source('NHS · narcolepsy', 'https://www.nhs.uk/conditions/narcolepsy/'),
    restless_legs: source('NHS · restless legs syndrome', 'https://www.nhs.uk/conditions/restless-legs-syndrome/'),
    mono: source('CDC · infectious mononucleosis', 'https://www.cdc.gov/epstein-barr/about/mononucleosis.html'),
    infection: source('CDC · respiratory viruses', 'https://www.cdc.gov/respiratory-viruses/about/index.html')
  };
  const domains = [
    opt('energy', 'Fatigue, weakness or poor recovery'), opt('weight', 'Weight or temperature changes'),
    opt('heart', 'Chest discomfort or palpitations'), opt('breathing', 'Cough or breathlessness'),
    opt('digestion', 'Abdominal pain, nausea or reflux'), opt('bowel', 'Diarrhea, constipation or rectal symptoms'),
    opt('urinary', 'Urinary symptoms or flank pain'), opt('headache', 'Headaches'),
    opt('dizziness', 'Dizziness, faintness or spinning'), opt('nerves', 'Numbness, tingling or limb weakness'),
    opt('joints', 'Joint, muscle or back pain'), opt('skin', 'Rash, itch or skin changes'),
    opt('nose', 'Nose, sinus, eye or mouth symptoms'), opt('sleep', 'Daytime sleepiness or disturbed sleep'),
    opt('reproductive', 'Periods, pelvic or reproductive symptoms'), opt('fever', 'Fever, swollen glands or recent infection'),
    opt('thirst', 'Excessive thirst or frequent urination'), opt('bleeding', 'Bleeding, bruising or pallor')
  ];
  const context = [
    multi('urgent_now', 'Is any of this happening right now?', [
      opt('chest', 'Persistent chest pressure, especially with sweating, breathlessness or pain into an arm/jaw'),
      opt('breath', 'Severe trouble breathing, blue/grey lips, or inability to speak normally'),
      opt('stroke', 'Sudden one-sided weakness, facial droop, speech loss or new loss of vision'),
      opt('head', 'A sudden headache reaching maximum intensity within a minute'),
      opt('allergy', 'Swollen tongue/throat or breathing difficulty after an exposure'),
      opt('bleed', 'Vomiting blood, black tarry stools with faintness, or uncontrolled bleeding'),
      opt('infection', 'Fever with a stiff neck, confusion, collapse or a rapidly spreading purple rash'),
      opt('abdomen', 'Sudden severe abdominal/pelvic pain, a rigid abdomen, or testicular pain'),
      opt('pregnancy', 'Possible pregnancy with severe pelvic pain, faintness or heavy bleeding'),
      opt('metabolic', 'Extreme thirst/urination with vomiting, deep rapid breathing or unusual drowsiness'),
      opt('spine', 'New bladder/bowel control problems with numbness around the groin or new leg weakness')
    ], 'A positive answer stops the routine questionnaire.'),
    pick('age', 'Which age group are you in?', [opt('18_39', '18–39'), opt('40_64', '40–64'), opt('65_plus', '65 or older'), opt('under18', 'Under 18')]),
    multi('concerns', 'Which physical symptoms do you want to narrow down?', domains, 'Choose the areas for this problem, not every symptom you have ever had.'),
    pick('anatomy', 'Which reproductive anatomy is relevant to the questions?', [opt('uterus', 'Uterus / ovaries'), opt('prostate', 'Prostate / testes'), opt('other', 'Neither of these')], 'Only routes anatomy-specific questions.'),
    pick('duration', 'How long has the main problem been present?', [opt('hours', 'Less than 48 hours'), opt('days', '2 days to 2 weeks'), opt('weeks', '2–6 weeks'), opt('months', '6 weeks to 6 months'), opt('chronic', '6 months or longer')]),
    pick('course', 'How is it changing?', [opt('worse', 'Getting progressively worse'), opt('episodes', 'Separate episodes with better periods'), opt('stable', 'Fairly steady'), opt('better', 'Improving')]),
    multi('warning_signs', 'Have you noticed any of these warning signs?', [opt('weightloss', 'Unintentional weight loss'), opt('sweats', 'Drenching night sweats or a persistent unexplained fever'), opt('stoolblood', 'Blood mixed into stool, not just a streak on the paper'), opt('melena', 'Black, tarry stool'), opt('swallow', 'Progressively worsening difficulty swallowing'), opt('lump', 'A new persistent lump or enlarged lymph node'), opt('immune', 'A weakened immune system with a new fever'), opt('leg', 'New one-sided leg swelling or pain'), opt('jaundice', 'New yellow skin/eyes or very dark urine'), opt('weakness', 'Progressively worsening limb weakness')], 'These need medical assessment even when a more common candidate matches.'),
    yn('medicine_change', 'Did this begin after starting, increasing or stopping a medicine or supplement?', 'Include prescribed medicines, steroids, herbal products, stimulants and recreational substances.'),
    multi('tests', 'Which tests were done during this same symptom episode?', [opt('thyroid', 'Thyroid blood tests'), opt('cbc', 'Blood count / hemoglobin'), opt('iron', 'Ferritin / iron studies'), opt('b12', 'Vitamin B12 / folate'), opt('glucose', 'Glucose / HbA1c'), opt('celiac', 'Celiac blood tests'), opt('cortisol', 'Morning cortisol / adrenal tests')], 'Only tests from this episode whose results you can check; older results cannot settle current symptoms.')
  ];
  // A pattern-specific skin follow-up is asked for that pattern or for "another pattern".
  const shape = v => any(eq('rash_shape',v),eq('rash_shape','other'));
  const groups = [
    { id: 'general', name: 'Energy & hormones', domains: ['energy','weight','thirst'], items: [
      yn('fatigue_daily', 'Is fatigue present most days and limiting normal activities?'),
      yn('cold', 'Are you unusually sensitive to cold, with dry skin or slowing down?'),
      yn('heat', 'Are you unusually hot or sweaty, with a fine hand tremor or racing pulse at rest?'),
      yn('weight_gain', 'Have you gained weight without a clear change in food or activity?'),
      yn('thirst_urine', 'Are unusual thirst and increased volumes of urine occurring together?'),
      yn('dark_skin', 'Has your skin darkened in creases, scars or inside the mouth without extra sun?'),
      yn('salt_craving', 'Do you have strong salt craving together with low blood pressure or faintness?'),
      yn('pem', 'Does modest physical or mental effort cause a disproportionate symptom crash afterward?', 'A delayed crash lasting a day or longer is different from being tired immediately after a hard day.'),
      yn('unrefreshing', 'Do you wake unrefreshed even after enough opportunity to sleep?'),
      yn('infection_start', 'Did the ongoing fatigue begin after an infection?'),
      yn('covid_start', 'Did these ongoing symptoms start after a known or suspected COVID-19 infection?', '', eq('infection_start','yes'))
    ]},
    { id: 'blood', name: 'Blood & nutrients', domains: ['energy','bleeding','nerves','breathing'], items: [
      yn('pale', 'Have you become noticeably pale, with exertional breathlessness or palpitations?'),
      yn('blood_loss', 'Is there heavy menstrual bleeding, frequent blood donation, or another ongoing source of blood loss?'),
      yn('restrictive_diet', 'Is your diet low in animal products, or restricted enough to miss whole food groups?'),
      yn('tongue', 'Do you have a sore smooth tongue or recurrent mouth ulcers?'),
      yn('easy_bruising', 'Are unexplained bruises or small bleeding spots appearing repeatedly?')
    ]},
    { id: 'heart', name: 'Heart & chest', domains: ['heart','breathing'], items: [
      yn('exertional_chest', 'Does pressure or tightness in the chest reliably come on with physical effort?'),
      yn('rest_relief', 'Does that chest discomfort settle within a few minutes of resting?', '', eq('exertional_chest','yes')),
      yn('chest_touch', 'Can pressing on the chest or moving the upper body reproduce the pain?'),
      yn('chest_position', 'Is sharp chest pain worse lying flat or breathing deeply, and better leaning forward?'),
      yn('palps_abrupt', 'Does a rapid heartbeat start and stop suddenly, like a switch?'),
      yn('palps_irregular', 'During an episode, does the pulse feel persistently irregular rather than simply fast?'),
      yn('palps_skips', 'Are the sensations mainly isolated skipped beats or a brief thump?'),
      yn('palps_trigger', 'Do caffeine, alcohol, nicotine, stimulant medicines or sleep loss trigger the palpitations?'),
      yn('ankle_swelling', 'Are both ankles swelling, especially with breathlessness?'),
      yn('lying_breathless', 'Is breathing harder lying flat, or do you wake gasping and need to sit up?'),
      yn('cardiac_risk', 'Do you smoke, have diabetes/high cholesterol, or have close relatives with early heart disease?')
    ]},
    { id: 'breathing', name: 'Lungs & cough', domains: ['breathing'], items: [
      yn('wheeze', 'Is there a whistling wheeze or variable chest tightness?'),
      yn('airway_triggers', 'Do cold air, exercise, pollen or dust trigger the breathing symptoms?'),
      yn('night_cough', 'Does cough or wheeze wake you at night or occur early in the morning?'),
      yn('smoke_exposure', 'Have you had years of smoking or substantial exposure to dust, fumes or biomass smoke?'),
      yn('daily_sputum', 'Is there a daily productive cough with gradually worsening exertional breathlessness?'),
      yn('fever_cough', 'Is cough accompanied by a measured fever and feeling acutely ill?'),
      yn('pleuritic', 'Is there sharp pain when breathing in?'),
      yn('postviral_cough', 'Did the cough begin with a respiratory infection and persist after the other symptoms improved?'),
      yn('reflux_cough', 'Does cough follow meals, sour regurgitation or lying down?'),
      yn('cough_blood', 'Have you coughed up blood?')
    ]},
    { id: 'digestion', name: 'Stomach & abdomen', domains: ['digestion'], items: [
      pick('pain_site', 'Where is abdominal pain strongest?', [opt('upper_middle','Upper middle'),opt('upper_right','Upper right'),opt('lower_right','Lower right'),opt('lower_left','Lower left'),opt('pelvis','Pelvic / lower central'),opt('diffuse','Diffuse or moving around'),opt('none','No abdominal pain')]),
      yn('heartburn', 'Is there burning behind the breastbone or sour fluid coming into the mouth?'),
      yn('after_meals', 'Are symptoms worse after meals or when lying down?'),
      yn('fatty_pain', 'Does upper-right or upper-middle pain follow a fatty meal and last at least 30 minutes?', '', not('pain_site','none')),
      yn('ulcer_pain', 'Is there recurrent upper-middle burning or gnawing pain, including when the stomach is empty?', '', not('pain_site','none')),
      yn('nsaid', 'Do you regularly use ibuprofen, naproxen, aspirin or a similar anti-inflammatory?'),
      yn('early_full', 'Do you become full after only a few bites and stay full unusually long?'),
      yn('food_vomit', 'Do you vomit undigested food several hours after eating?', '', eq('early_full','yes')),
      yn('abd_fever', 'Does the abdominal pain come with fever or repeated vomiting?', '', not('pain_site','none')),
      yn('abd_back', 'Does persistent upper-abdominal pain spread through to the back?', '', not('pain_site','none'))
    ]},
    { id: 'bowel', name: 'Bowel & absorption', domains: ['bowel','digestion','bleeding'], items: [
      pick('stool_pattern', 'What is the main change in bowel movements?', [opt('diarrhea','Mostly loose / watery stool'),opt('constipation','Mostly hard / difficult stool'),opt('mixed','Alternating diarrhea and constipation'),opt('normal','No consistent change')]),
      yn('bowel_chronic', 'Has the bowel problem persisted or recurred for more than 4 weeks?'),
      yn('pain_bowel', 'Does abdominal pain change after passing stool?'),
      yn('bowel_night', 'Does diarrhea wake you from sleep?', '', any(eq('stool_pattern','diarrhea'),eq('stool_pattern','mixed'))),
      yn('greasy_stool', 'Are stools repeatedly pale, greasy, unusually foul-smelling or difficult to flush?'),
      yn('dairy', 'Do milk or other lactose-containing foods reliably cause bloating and diarrhea within hours?'),
      yn('gluten', 'Do symptoms appear linked to wheat-containing foods?', 'This does not distinguish celiac disease from other food-related symptoms.'),
      yn('celiac_family', 'Does a first-degree relative have confirmed celiac disease?'),
      yn('water_travel', 'Did this start after untreated water, camping, travel or contact with someone with diarrhea?'),
      yn('meal_contact', 'Did others become ill after the same meal or close contact?'),
      yn('rectal_streak', 'Is there bright-red blood mainly on wiping or on the outside of the stool?'),
      yn('rectal_pain', 'Is there a sharp tearing pain during or just after passing stool?', '', eq('rectal_streak','yes')),
      yn('anal_night', 'Is itching concentrated around the anus and worse at night?')
    ]},
    { id: 'urinary', name: 'Urinary tract & kidneys', domains: ['urinary'], items: [
      yn('urine_burn', 'Does passing urine burn or hurt?'),
      yn('urine_urgency', 'Are you passing small amounts urgently and more often?'),
      yn('flank', 'Is there pain in the side/back below the ribs?'),
      yn('urine_fever', 'Are urinary symptoms accompanied by fever, chills or vomiting?'),
      yn('colic', 'Does severe side pain come in waves and spread toward the groin?'),
      yn('urine_blood', 'Is blood visible in the urine?'),
      yn('weak_stream', 'Is the urine stream weak or difficult to start?', '', eq('anatomy','prostate')),
      yn('pelvic_male', 'Is there pelvic/perineal pain or painful ejaculation?', '', eq('anatomy','prostate')),
      yn('urge_leak', 'Is urgency sometimes followed by leakage before reaching a toilet?')
    ]},
    { id: 'headache', name: 'Headache patterns', domains: ['headache'], items: [
      yn('head_pulse', 'Are headaches throbbing, moderate/severe, or worse with ordinary movement?'),
      yn('head_nausea', 'Does headache come with nausea or sensitivity to light and sound?'),
      yn('aura', 'Do reversible visual or sensory symptoms build gradually over minutes before a headache?'),
      yn('head_band', 'Is the pain a pressing band on both sides without vomiting?'),
      yn('head_eye', 'Are there extremely severe attacks around one eye lasting about 15–180 minutes?'),
      yn('eye_tears', 'During those attacks, does that eye water or redden, with a blocked nostril and restlessness?', '', eq('head_eye','yes')),
      yn('painkillers', 'Do you use painkillers for headache on 10 or more days per month?'),
      yn('head_new50', 'Is this a new headache after age 50, especially with jaw pain when chewing or scalp tenderness?', '', not('age','18_39'))
    ]},
    { id: 'dizziness', name: 'Balance & standing', domains: ['dizziness'], items: [
      pick('dizzy_type', 'Which best describes the dizziness?', [opt('spin','Spinning / movement'),opt('faint','About to faint / lightheaded'),opt('imbalance','Unsteady balance'),opt('mixed','More than one / cannot tell')]),
      yn('head_turn', 'Does rolling in bed or looking up trigger brief spinning lasting less than a minute?', '', not('dizzy_type','faint')),
      yn('vertigo_long', 'Did spinning begin suddenly and remain continuous for hours or days, often after an infection?', '', not('dizzy_type','faint')),
      yn('ear_hearing', 'Does dizziness come with fluctuating hearing loss, ringing or pressure in one ear?', '', not('dizzy_type','faint')),
      yn('upright', 'Are symptoms mainly brought on by standing and relieved by lying down?', '', not('dizzy_type','spin')),
      yn('heart_rise', 'Has a sustained pulse rise of at least 30 beats/min within 10 minutes of standing been measured?', 'A single brief spike or a Holter recording alone does not establish this pattern.', eq('upright','yes')),
      yn('bp_drop', 'Has blood pressure been measured to fall by at least 20 systolic or 10 diastolic after standing?', '', eq('upright','yes')),
      yn('orthostatic_chronic', 'Have the standing-related symptoms been present for at least 3 months?', '', eq('upright','yes')),
      yn('vasovagal', 'Do heat, needles, pain or prolonged standing cause nausea, sweating and then faintness?', '', not('dizzy_type','spin')),
      yn('fluid_loss', 'Have vomiting, diarrhea, heat, poor fluid intake or a diuretic preceded the faintness?', '', not('dizzy_type','spin'))
    ]},
    { id: 'nerves', name: 'Nerves & sensation', domains: ['nerves','joints'], items: [
      yn('stocking', 'Is tingling or numbness fairly symmetrical in both feet, sometimes progressing toward the hands?'),
      yn('burning', 'Is there burning pain or unusual sensitivity to temperature/light touch?'),
      yn('autonomic', 'Are altered sweating, bowel/bladder function or standing symptoms occurring alongside the nerve symptoms?'),
      yn('median_hand', 'Are symptoms mainly in the thumb, index and middle fingers, especially at night?'),
      yn('neck_arm', 'Does neck movement cause pain or tingling shooting into one arm?'),
      yn('back_leg', 'Does low-back pain shoot down one leg, often below the knee?'),
      yn('nerve_alcohol', 'Is there substantial regular alcohol use or a known medicine that can damage nerves?')
    ]},
    { id: 'joints', name: 'Joints, muscles & back', domains: ['joints'], items: [
      yn('joint_swollen', 'Are joints visibly swollen, warm or repeatedly puffy?'),
      yn('morning_stiff', 'Does joint stiffness last more than 30–60 minutes after waking?'),
      yn('small_symmetric', 'Are matching small joints of both hands or feet affected?'),
      yn('activity_pain', 'Is joint pain mainly worse with use and better with rest, with only brief morning stiffness?'),
      yn('hot_one_joint', 'Did one joint become very painful, hot and swollen over hours?'),
      yn('big_toe', 'Is the base of the big toe affected, or have similar attacks happened before?', '', eq('hot_one_joint','yes')),
      yn('back_inflammatory', 'Did back pain start before age 45, persist over 3 months, improve with movement and worsen with rest?'),
      yn('widespread', 'Has pain been widespread on both sides and above/below the waist for over 3 months?'),
      yn('hypermobile', 'Are several joints unusually flexible, with recurrent sprains, subluxations or dislocations?'),
      yn('tick', 'Was there a tick exposure, expanding rash or new large-joint swelling after outdoor exposure?')
    ]},
    { id: 'skin', name: 'Skin & itch', domains: ['skin'], items: [
      pick('rash_shape', 'Which description is closest to the skin problem?', [opt('dry','Dry, itchy, cracked patches'),opt('hives','Raised itchy welts that move or disappear within a day'),opt('scales','Thick sharply outlined scaly plaques'),opt('ring','An enlarging ring with a more active edge'),opt('blisters','Painful grouped blisters'),opt('face','Persistent central facial redness / flushing'),opt('itch','Itch with little obvious rash'),opt('other','Another pattern')]),
      yn('rash_contact', 'Did it follow a new skin product, metal, detergent, glove or workplace exposure?'),
      yn('rash_flexures', 'Are itchy dry patches recurrent, particularly in elbow/knee folds?', '', shape('dry')),
      yn('rash_night', 'Is itch much worse at night, with itchy close contacts or marks between fingers/wrists?'),
      yn('rash_one_side', 'Are pain and blisters in a band on one side of the body?', '', shape('blisters')),
      yn('rash_nails', 'Are there nail pits or similar plaques on elbows, knees or scalp?', '', shape('scales')),
      yn('rash_flushing', 'Does facial redness flare with heat, hot drinks or alcohol?', '', shape('face')),
      yn('rash_eye', 'Are blisters near an eye, or is an eye painful or vision affected?')
    ]},
    { id: 'nose', name: 'Nose, eyes & mouth', domains: ['nose','breathing'], items: [
      yn('sneeze_itch', 'Do repeated sneezing, an itchy nose and watery itchy eyes occur together?'),
      yn('allergy_pattern', 'Do symptoms recur with dust, animals, pollen or a particular environment?'),
      yn('throat_drip', 'Do you feel mucus running down the throat or repeatedly need to clear it?'),
      yn('sinus_long', 'Have nasal blockage/discharge and reduced smell or facial pressure lasted at least 12 weeks?'),
      yn('dry_eyes', 'Are the eyes persistently gritty, burning or unusually dry?'),
      yn('dry_mouth', 'Is your mouth persistently dry, with difficulty eating dry food without water?'),
      yn('eyelid_crust', 'Are eyelid edges crusted, itchy or stuck together in the morning?'),
      yn('eye_screen', 'Does dryness worsen with long screen use, contact lenses, wind or air conditioning?'),
      yn('eye_acute', 'Is an eye suddenly painful/red, with light sensitivity or reduced vision?')
    ]},
    { id: 'sleep', name: 'Sleep & daytime alertness', domains: ['sleep','energy'], items: [
      yn('snore', 'Do you snore loudly on most nights?'),
      yn('apnea', 'Has someone seen pauses in breathing, choking or gasping during sleep?'),
      yn('sleepy', 'Do you unintentionally doze off during ordinary daytime activities?'),
      yn('sleep_opportunity', 'Do you usually have at least 7–9 hours available for sleep?'),
      yn('sleep_attacks', 'Do irresistible sleep attacks occur despite adequate nighttime sleep?', '', eq('sleepy','yes')),
      yn('cataplexy', 'Does laughter or another strong emotion trigger brief muscle weakness while awareness stays intact?', '', eq('sleep_attacks','yes')),
      yn('restless_legs', 'Is there an urge to move the legs at rest in the evening, relieved by movement?')
    ]},
    { id: 'reproductive', name: 'Periods & pelvic symptoms', domains: ['reproductive'], when: eq('anatomy','uterus'), items: [
      yn('preg_possible', 'Is pregnancy possible, or is a period later than expected?'),
      yn('pelvic_cycle', 'Is pelvic pain consistently linked to periods or worse during sex or bowel movements?'),
      yn('heavy_period', 'Are periods heavy enough to flood, require very frequent changes or interfere with daily life?'),
      yn('irregular_period', 'Are periods persistently irregular or unusually infrequent?'),
      yn('androgen', 'Is there new coarse facial/body hair, persistent acne or scalp hair thinning?'),
      yn('hot_flushes', 'Are there hot flushes/night sweats alongside a changing menstrual pattern?'),
      yn('pelvic_discharge', 'Does pelvic pain occur with unusual vaginal discharge, fever or bleeding after sex?')
    ]},
    { id: 'infection', name: 'Infection & systemic clues', domains: ['fever','energy'], items: [
      yn('fever_measured', 'Has a temperature above 38°C been measured?'),
      yn('viral_acute', 'Did fever, muscle aches and respiratory symptoms develop over a few days?'),
      yn('sore_glands', 'Is there a substantial sore throat with swollen neck glands and marked fatigue?')
    ]},
    { id: 'results', name: 'Existing test evidence', domains: domains.map(d => d.v), items: [
      pick('lab_thyroid', 'What did the thyroid tests show during these symptoms?', [opt('hypo','High TSH with low FT4'),opt('subhypo','High TSH with normal FT4'),opt('hyper','Low TSH with high FT4 and/or T3'),opt('normal','TSH and FT4 both within the lab ranges'),opt('discordant','High FT4 with normal or high TSH')], 'Use the report’s own ranges and units. An isolated abnormal result may need confirmation.', eq('tests','thyroid')),
      pick('lab_tpo', 'Was anti-TPO reported as positive or above the lab cutoff?', [opt('positive','Positive / above cutoff'),opt('negative','Negative / below cutoff')], '', eq('tests','thyroid')),
      pick('lab_trab', 'Was a Graves-specific TRAb or TSI test positive?', [opt('positive','Positive'),opt('negative','Negative')], 'Anti-TPO is a different antibody. Choose not sure if TRAb/TSI was not measured.', all(eq('tests','thyroid'),any(eq('lab_thyroid','hyper'),eq('lab_thyroid','discordant')))),
      pick('lab_hgb', 'Was hemoglobin below that lab’s range?', [opt('low','Below range'),opt('normal','Within range')], '', eq('tests','cbc')),
      pick('lab_platelets', 'Were platelets below the lab’s range?', [opt('low','Below range'),opt('normal','Within range')], '', eq('tests','cbc')),
      pick('lab_ferritin', 'What was the ferritin result?', [opt('low','Low'),opt('normal','Within range'),opt('high','High')], 'Inflammation can raise ferritin; a normal result does not always settle iron status.', eq('tests','iron')),
      pick('lab_b12', 'What was the vitamin B12 result?', [opt('low','Low / borderline'),opt('normal','Within range')], '', eq('tests','b12')),
      pick('lab_folate', 'Was folate actually below the lab’s range?', [opt('low','Below range'),opt('normal','Within range')], 'A result near the lower limit but still in range is not a confirmed deficiency.', eq('tests','b12')),
      pick('lab_glucose', 'Was glucose or HbA1c in the diabetes range according to your clinician?', [opt('high','Yes'),opt('normal','No, within range')], 'An abnormal result often needs confirmation; pregnancy uses different pathways.', eq('tests','glucose')),
      pick('lab_celiac', 'What was the celiac antibody result?', [opt('positive','Positive tTG-IgA / EMA'),opt('negative','Negative, with normal total IgA while eating gluten'),opt('uncertain','Negative, but IgA status or gluten intake was uncertain')], '', eq('tests','celiac')),
      pick('lab_cortisol', 'How was a correctly timed morning cortisol interpreted?', [opt('low','Low / adrenal insufficiency suspected'),opt('indeterminate','Borderline / stimulation test advised'),opt('normal','Clinician said adrenal insufficiency was unlikely')], 'ACTH alone is not a cortisol assessment. A random or old value belongs under not sure.', eq('tests','cortisol')),
      pick('lab_acth', 'Was ACTH high when paired with a low cortisol result?', [opt('high','More than twice the lab’s upper limit'),opt('normal','Normal or low')], 'Only a paired current result distinguishes primary from other adrenal causes.', all(eq('tests','cortisol'),eq('lab_cortisol','low')))
    ]}
  ];
  const yes = (q, label, weight = 2) => ({ q, value: 'yes', label, weight });
  const is = (q, value, label, weight = 2) => ({ q, value, label, weight });
  const no = (q, label, weight = 2) => is(q, 'no', label, weight);
  const lacks = (q, value, label, weight = 2) => ({ ...not(q, value), label, weight });
  const weightLoss = (weight = 2) => is('warning_signs','weightloss','Unintentional weight loss',weight);
  const conditions = [];
  function dx(id, name, area, summary, confirm, src, support, against = [], core = [], options = {}) {
    conditions.push({ id, name, domains: area.split(' '), summary, confirm, source: src, support, against, core, ...options });
  }
  // Hormonal and systemic conditions: test-supported syndromes stay separate
  // from their unconfirmed causes (for example Graves versus hyperthyroidism).
  dx('iron_anemia','Iron-deficiency anemia','energy bleeding breathing','Low hemoglobin caused by depleted iron can produce fatigue, pallor and exertional symptoms.','Blood count, ferritin and iron studies, followed by finding the source of iron loss.','iron',[yes('pale','Pallor with exertional symptoms'),yes('blood_loss','Ongoing iron loss'),is('lab_hgb','low','Low hemoglobin',4),is('lab_ferritin','low','Low ferritin',4)],[is('lab_hgb','normal','Hemoglobin was normal during these symptoms',5)],['pale','blood_loss','lab_hgb','lab_ferritin']);
  dx('iron_depletion','Iron deficiency without anemia','energy bleeding sleep','Iron stores can be depleted before hemoglobin falls.','Ferritin interpreted alongside inflammation and iron studies; investigate blood loss or intake.','iron',[yes('blood_loss','A source of iron loss'),yes('restless_legs','Evening leg-restlessness pattern'),is('lab_ferritin','low','Low ferritin',5),is('lab_hgb','normal','Hemoglobin still normal',1)],[is('lab_ferritin','normal','No low ferritin reported',3),is('lab_hgb','low','Low hemoglobin calls for an anemia assessment',5)],['blood_loss','lab_ferritin']);
  dx('b12','Vitamin B12 deficiency','energy nerves','B12 deficiency can affect blood cells and nerves; anemia need not be present.','B12 assessment, with methylmalonic acid when clinically appropriate, and investigation of absorption or intake.','b12',[yes('stocking','Symmetrical distal sensory symptoms'),yes('restrictive_diet','Potentially limited B12 intake'),yes('tongue','Tongue or mouth changes'),is('lab_b12','low','Low or borderline B12',5)],[is('lab_b12','normal','B12 was within range',2)],['lab_b12','stocking']);
  dx('folate','Folate deficiency','energy bleeding','A true below-range folate result can contribute to blood-cell changes and fatigue.','Folate and blood-count assessment alongside B12; review diet and absorption.','b12',[yes('restrictive_diet','Restricted nutritional intake'),yes('tongue','Tongue or mouth changes'),is('lab_folate','low','Folate below the lab range',5)],[is('lab_folate','normal','Folate was within range',5)],['lab_folate']);
  dx('hypothyroid','Primary hypothyroidism','energy weight bowel','Reduced thyroid hormone production can cause slowing, cold sensitivity and constipation.','TSH and FT4 interpreted together; determine the cause if dysfunction is confirmed.','hypothyroid',[yes('cold','Cold sensitivity with slowing'),yes('weight_gain','Unexplained weight gain'),is('stool_pattern','constipation','Constipation'),is('lab_thyroid','hypo','High TSH with low FT4',6),is('lab_thyroid','subhypo','High TSH with normal FT4',2)],[is('lab_thyroid','normal','TSH and FT4 were normal',6),is('lab_thyroid','hyper','Tests showed hormone excess',6)],['cold','lab_thyroid']);
  dx('hashimoto','Hashimoto’s thyroiditis','energy weight bowel','An autoimmune cause of thyroid inflammation; hormone function can remain normal early on.','Thyroid function and antibody results, plus examination; ultrasound only when clinically indicated.','hashimoto',[is('lab_tpo','positive','Positive anti-TPO',5),is('lab_thyroid','hypo','Primary hypothyroid test pattern',3),yes('cold','Compatible cold sensitivity'),yes('weight_gain','Compatible weight gain')],[is('lab_tpo','negative','Anti-TPO was negative; antibody-negative disease remains possible',4)],['lab_tpo']);
  dx('hyperthyroid','Hyperthyroidism / thyroid hormone excess','energy weight heart thirst','Excess circulating thyroid hormones can cause heat intolerance, tremor, weight loss and resting tachycardia.','Current TSH, FT4 and T3, then tests to determine why the hormones are high.','hyperthyroid',[yes('heat','Heat intolerance with tremor/resting racing pulse',3),weightLoss(),is('lab_thyroid','hyper','Low TSH with high thyroid hormone',6)],[is('lab_thyroid','normal','Current thyroid function was normal',6),is('lab_thyroid','discordant','High FT4 with nonsuppressed TSH needs verification of interference and other causes',4)],['heat','lab_thyroid']);
  dx('graves','Graves’ disease','weight energy heart','Autoimmune stimulation is one cause of hyperthyroidism; a high FT4 alone does not identify it.','Confirm hyperthyroidism, then Graves-specific TRAb/TSI; specialist testing if the cause stays unclear.','graves',[is('lab_thyroid','hyper','Biochemical thyroid hormone excess',4),is('lab_trab','positive','Positive Graves-specific TRAb/TSI',6),yes('heat','Heat/tremor/resting tachycardia pattern')],[is('lab_thyroid','normal','Thyroid function was normal during the episode',5),is('lab_thyroid','discordant','Normal/high TSH alongside high FT4 is atypical for active Graves',5),is('lab_trab','negative','TRAb/TSI was negative',3)],['lab_trab','lab_thyroid']);
  dx('diabetes','Diabetes mellitus','thirst energy weight urinary','High glucose can produce excessive thirst, large urine volumes and weight loss.','Glucose/HbA1c using the appropriate diagnostic pathway; acute illness may require ketones and urgent testing.','diabetes',[yes('thirst_urine','Thirst and increased urine volume together',4),weightLoss(),yes('fatigue_daily','Persistent fatigue',1),is('lab_glucose','high','Clinician-reported diabetes-range result',6)],[is('lab_glucose','normal','Glucose testing was normal during the symptoms',4)],['thirst_urine','lab_glucose']);
  dx('adrenal','Adrenal insufficiency, including Addison’s','energy weight dizziness','Cortisol deficiency can cause fatigue, weight loss, postural symptoms and gastrointestinal complaints. Addison’s is the primary adrenal form.','8–9 a.m. cortisol with ACTH and electrolytes; stimulation testing when indicated. An isolated ACTH does not exclude it.','adrenal',[weightLoss(),yes('dark_skin','New pigmentation in characteristic sites',4),yes('salt_craving','Salt craving with low-pressure symptoms',3),is('lab_cortisol','low','Low properly timed cortisol',5),is('lab_acth','high','ACTH >2× upper limit with low cortisol supports a primary adrenal cause',4)],[is('lab_cortisol','normal','Clinician interpreted current cortisol assessment as reassuring',5)],['dark_skin','lab_cortisol']);
  dx('mecfs','ME/CFS','energy','The distinguishing pattern is prolonged functional loss with post-exertional symptom worsening and unrefreshing sleep.','Assess the full clinical criteria and exclude alternative explanations; a single crash is insufficient.','me',[yes('pem','Disproportionate post-exertional symptom crash',5),yes('unrefreshing','Unrefreshing sleep'),yes('fatigue_daily','Fatigue limits normal activities'),is('duration','chronic','Symptoms for at least six months',3)],[no('pem','No post-exertional symptom worsening',6),is('duration','hours','Very recent onset',5),is('duration','days','Duration too short for this diagnosis',5)],['pem'],{ durationFloor:'chronic' });
  dx('postviral','Post-infectious fatigue','energy','Fatigue can persist while recovering from an infection; the trajectory and duration matter.','History and examination, with targeted testing for persistent, worsening or unexplained features.','fatigue',[yes('infection_start','Fatigue followed an infection',4),yes('fatigue_daily','Ongoing limiting fatigue'),is('course','better','Gradual improvement',2)],[no('infection_start','No preceding infection',4)],['infection_start']);
  dx('longcovid','Long COVID','energy','Persistent multisystem symptoms can follow SARS-CoV-2 infection.','Evaluate the infection timeline, symptom duration and competing causes; no single blood test establishes it.','longcovid',[yes('covid_start','Symptoms began after COVID-19',5),yes('fatigue_daily','Ongoing fatigue'),is('duration','chronic','Long symptom duration',3),is('duration','months','Persistent symptoms',2)],[no('covid_start','No reported COVID-linked onset',4)],['covid_start']);
  dx('medicine','Medicine or supplement adverse effect','energy dizziness heart bowel skin','A temporal link to a medicine, dose change or withdrawal can be a clue to a physical adverse effect.','Review the exact product, dose and timing with a clinician or pharmacist before changing prescribed treatment.','medicine',[yes('medicine_change','Symptoms followed a medicine/supplement change',5),is('duration','days','Recent onset',1),is('duration','weeks','Recent onset',1)],[no('medicine_change','No temporal medication link',4)],['medicine_change']);
  dx('dehydration','Dehydration / volume depletion','dizziness','Fluid loss or low intake can cause faintness, tachycardia and reduced circulation on standing.','Assess intake/losses, vital signs and electrolytes when indicated.','dehydration',[yes('fluid_loss','Fluid loss or reduced intake',4),yes('upright','Symptoms on standing'),yes('bp_drop','Measured postural pressure drop',3)],[no('fluid_loss','No reported fluid-loss trigger',2)],['fluid_loss']);
  // Airways and thorax.
  dx('asthma','Asthma','breathing','Variable airway narrowing commonly produces wheeze, chest tightness and trigger-related symptoms.','Spirometry with reversibility, peak-flow variability or other objective airway testing.','asthma',[yes('wheeze','Variable wheeze/tightness',4),yes('airway_triggers','Exercise, cold air or allergen triggers',3),yes('night_cough','Night/early-morning symptoms',2)],[no('wheeze','No wheeze or tightness reported',1)],['wheeze','airway_triggers']);
  dx('copd','COPD','breathing','Persistent airflow obstruction is associated with chronic exposure, productive cough and progressive breathlessness.','Post-bronchodilator spirometry and exposure history.','copd',[yes('smoke_exposure','Long-term smoke/fume exposure',4),yes('daily_sputum','Daily sputum with gradual exertional symptoms',4),is('age','65_plus','Older adult context',1),is('age','40_64','Age-compatible context',1)],[no('smoke_exposure','No substantial exposure reported',2)],['smoke_exposure','daily_sputum']);
  dx('pneumonia','Pneumonia / lower respiratory infection','breathing','Cough with fever, acute illness and pleuritic pain can indicate a lower-airway infection.','Vital signs, oxygen saturation, chest examination and imaging when indicated.','pneumonia',[yes('fever_cough','Cough with measured fever and acute illness',4),yes('pleuritic','Pain on breathing'),yes('fever_measured','Measured fever',1)],[no('fever_cough','No fever/acute-illness cough pattern',2)],['fever_cough'],{ urgency:'soon' });
  dx('postviral_cough','Post-infectious cough','breathing','Airway irritation may persist after a respiratory infection improves.','Review duration and warning signs; assess other causes if persistent or worsening.','cough',[yes('postviral_cough','Cough persisted after a respiratory infection',4),no('fever_cough','No current acute febrile illness'),is('course','better','Improving trajectory',2)],[yes('cough_blood','Coughing blood needs a different assessment',5)],['postviral_cough']);
  dx('upper_airway_cough','Upper-airway cough syndrome','breathing nose','Nasal inflammation and drainage can contribute to throat clearing and cough.','Nasal/throat assessment and review of allergy and sinus symptoms.','cough',[yes('throat_drip','Mucus drainage and throat clearing',4),yes('sneeze_itch','Allergic nasal symptoms'),yes('sinus_long','Longstanding nasal/sinus symptoms')],[],['throat_drip']);
  dx('reflux_cough','Reflux-associated cough','breathing','Reflux can be associated with cough, particularly alongside meal/position-related reflux symptoms.','Evaluate reflux and competing cough causes; symptoms alone cannot prove the association.','reflux',[yes('reflux_cough','Cough follows reflux/meal/lying-down pattern',5),yes('heartburn','Heartburn or regurgitation',3),yes('after_meals','Meal/position relationship')],[],['reflux_cough']);
  dx('ectopy','Premature beats / ectopic beats','heart','Isolated skipped beats or thumps can reflect premature heartbeats.','ECG or a monitor capturing an episode; review stimulants and warning signs.','palpitations',[yes('palps_skips','Isolated skips/thumps',4),yes('palps_trigger','Recognizable stimulant/sleep-loss triggers'),no('palps_abrupt','No sustained switch-like racing episode',1)],[],['palps_skips']);
  dx('svt','Paroxysmal supraventricular tachycardia','heart','A regular racing heartbeat with abrupt onset and offset can indicate an episodic electrical rhythm.','ECG during an attack or an event monitor.','svt',[yes('palps_abrupt','Switch-like onset and offset',5),no('palps_irregular','No persistent irregularity',1),is('course','episodes','Separate attacks',2)],[no('palps_abrupt','No abrupt racing episodes',4)],['palps_abrupt']);
  dx('af','Atrial fibrillation / other irregular arrhythmia','heart','A persistently irregular rhythm during episodes needs ECG identification.','ECG; symptom description or a pulse check cannot identify the exact rhythm.','af',[yes('palps_irregular','Persistently irregular pulse during symptoms',5),is('course','episodes','Recurrent episodes'),is('age','65_plus','Older adult risk context',1)],[],['palps_irregular'],{ urgency:'soon' });
  dx('angina','Angina / coronary artery disease','heart','Reproducible exertional chest pressure relieved by rest is a coronary pattern requiring assessment.','Clinical chest-pain pathway and appropriate cardiac testing. Current persistent pain uses the emergency pathway.','angina',[yes('exertional_chest','Exertional pressure/tightness',4),yes('rest_relief','Relief after resting',3),yes('cardiac_risk','Coronary risk factors',2)],[yes('chest_touch','Pain reproducible with pressure/movement is less typical',2)],['exertional_chest'],{ urgency:'soon' });
  dx('heart_failure','Heart failure','heart breathing','Breathlessness lying flat with dependent swelling can indicate impaired cardiac function.','Examination, ECG, natriuretic peptide testing and echocardiography when appropriate.','heart_failure',[yes('lying_breathless','Breathlessness lying flat / waking gasping',4),yes('ankle_swelling','Bilateral ankle swelling',3),yes('cardiac_risk','Cardiovascular risk factors',1)],[],['lying_breathless','ankle_swelling'],{ urgency:'soon' });
  dx('costochondritis','Chest-wall pain / costochondritis','heart','Pain reproducible by local pressure or upper-body movement can originate in the chest wall.','Clinical examination after assessing cardiac and lung warning signs.','costochondritis',[yes('chest_touch','Pain reproduced by pressure/movement',5),no('exertional_chest','No exertional pressure pattern'),no('fever_cough','No acute respiratory-infection pattern',1)],[yes('exertional_chest','Exertional pressure requires cardiac assessment',4)],['chest_touch']);
  dx('pericarditis','Pericarditis','heart breathing','Sharp positional/pleuritic chest pain can occur with inflammation around the heart.','Prompt examination, ECG and further tests.','pericarditis',[yes('chest_position','Pain worse flat and better leaning forward',5),yes('pleuritic','Pain on inspiration'),yes('infection_start','Preceding infection',1)],[],['chest_position'],{ urgency:'soon' });
  dx('orthostatic','Orthostatic hypotension','dizziness','A sustained blood-pressure fall after standing can explain postural faintness.','Supine and standing pulse/BP measurements with review of medicines, volume status and causes.','orthostatic',[yes('upright','Upright symptoms relieved by lying down',3),yes('bp_drop','Measured diagnostic-size blood-pressure drop',5),yes('fluid_loss','Possible volume loss')],[],['bp_drop']);
  dx('pots','Postural orthostatic tachycardia syndrome','dizziness','Persistent orthostatic symptoms with sustained standing tachycardia and no significant BP drop can fit this syndrome.','Standardized standing pulse/BP assessment, symptom duration and exclusion of alternative causes.','pots',[yes('upright','Symptoms tied to standing',3),yes('heart_rise','Measured sustained standing pulse rise',4),no('bp_drop','No reported significant pressure fall'),is('duration','chronic','Chronic symptom course',2),yes('orthostatic_chronic','Standing symptoms for at least three months',3)],[no('orthostatic_chronic','The required chronic standing-symptom duration is absent',6),yes('bp_drop','A significant BP drop suggests a different orthostatic pattern',5),yes('fluid_loss','Acute volume loss can cause secondary standing tachycardia',4),is('lab_hgb','low','Anemia is an alternative cause',4),is('lab_thyroid','hyper','Hyperthyroidism is an alternative cause',5)],['upright','heart_rise']);
  dx('vasovagal','Vasovagal episodes','dizziness','A characteristic trigger followed by warmth, nausea, sweating and faintness can reflect a reflex faint.','History, examination and ECG; investigate atypical or unexplained episodes.','fainting',[yes('vasovagal','Typical trigger/prodrome sequence',5),is('course','episodes','Episodic pattern'),no('palps_abrupt','No switch-like tachycardia',1)],[],['vasovagal']);
  // Gastrointestinal conditions.
  dx('gerd','Gastroesophageal reflux disease','digestion','Recurrent heartburn and sour regurgitation, often related to meals or position, fit reflux.','Clinical assessment; swallowing difficulty, bleeding or weight loss change the pathway.','reflux',[yes('heartburn','Heartburn/regurgitation',4),yes('after_meals','Meal/lying-down relationship',3),yes('reflux_cough','Associated cough pattern',1)],[],['heartburn']);
  dx('ulcer','Peptic ulcer / gastritis, including H. pylori','digestion','Upper-middle burning pain may reflect gastric/duodenal disease; symptoms do not distinguish the cause.','H. pylori testing and/or endoscopy based on age, warning signs and medication history.','ulcer',[yes('ulcer_pain','Gnawing upper-middle pain',4),yes('nsaid','NSAID exposure',3),is('pain_site','upper_middle','Upper-middle pain location')],[],['ulcer_pain']);
  dx('gallstones','Gallstone disease / biliary pain','digestion','Upper-right or upper-middle pain lasting at least 30 minutes after meals can fit biliary disease.','Abdominal ultrasound and blood tests; fever or jaundice requires prompt assessment.','gallstones',[yes('fatty_pain','Prolonged pain after fatty meals',4),is('pain_site','upper_right','Upper-right location',3),is('course','episodes','Separate attacks')],[],['fatty_pain']);
  dx('gastroparesis','Gastroparesis / delayed gastric emptying','digestion','Early fullness with prolonged retention and later vomiting can suggest delayed emptying.','Exclude obstruction and medicine effects, then appropriate gastric-emptying testing.','gastroparesis',[yes('early_full','Early and prolonged fullness',4),yes('food_vomit','Vomiting undigested food hours later',4),is('lab_glucose','high','Diabetes is a relevant risk factor',1)],[],['early_full','food_vomit']);
  dx('celiac','Celiac disease','bowel digestion energy','Immune-mediated gluten-related intestinal disease can produce bowel or extra-intestinal symptoms.','tTG-IgA with total IgA while eating gluten; gastroenterology confirmation where indicated.','celiac',[yes('bowel_chronic','Persistent bowel symptoms'),yes('greasy_stool','Possible malabsorption'),yes('celiac_family','First-degree family history',4),yes('gluten','Reported food association',1),is('lab_ferritin','low','Iron depletion'),is('lab_celiac','positive','Positive celiac serology',6)],[is('lab_celiac','negative','Appropriately performed negative celiac serology',5)],['celiac_family','lab_celiac','greasy_stool']);
  dx('ibs','Irritable bowel syndrome','bowel digestion','Recurrent abdominal pain related to bowel movements with altered stool pattern can fit IBS.','Check the clinical pattern and targeted exclusion tests; alarm features require a different pathway.','ibs',[yes('pain_bowel','Pain related to bowel movements',4),is('stool_pattern','mixed','Alternating stool pattern',3),yes('bowel_chronic','Persistent/recurrent symptoms'),lacks('warning_signs','stoolblood','No mixed-in blood',1),no('bowel_night','No nocturnal diarrhea',1)],[is('warning_signs','stoolblood','Blood mixed into stool is an alarm feature',5),yes('bowel_night','Nocturnal diarrhea needs evaluation',3)],['pain_bowel']);
  dx('ibd','Inflammatory bowel disease','bowel digestion','Chronic diarrhea with bleeding, nocturnal symptoms or weight loss can suggest intestinal inflammation.','Stool calprotectin/infection assessment, blood tests and endoscopic evaluation as indicated.','ibd',[is('warning_signs','stoolblood','Blood mixed into stool',4),yes('bowel_night','Nocturnal diarrhea',3),yes('bowel_chronic','Chronic bowel symptoms'),weightLoss(),is('stool_pattern','diarrhea','Diarrheal pattern')],[],['stool_blood','bowel_night'],{ urgency:'soon' });
  dx('lactose','Lactose intolerance','bowel digestion','Lactose can cause predictable bloating, gas and diarrhea when it is poorly absorbed.','A structured food history or breath testing when needed; distinguish from milk allergy.','lactose',[yes('dairy','Reproducible lactose-food trigger',5),is('stool_pattern','diarrhea','Loose stool'),lacks('warning_signs','stoolblood','No mixed-in blood',1)],[],['dairy']);
  dx('gastroenteritis','Acute infectious gastroenteritis','bowel digestion','An acute diarrheal illness after a shared meal or infectious contact can fit gastroenteritis.','Assess hydration and warning signs; stool testing is selected by severity, duration and exposures.','gastroenteritis',[yes('meal_contact','Shared meal/contact illness',4),is('stool_pattern','diarrhea','Watery/loose stool'),is('duration','days','Recent onset',2),yes('fever_measured','Measured fever',1)],[yes('bowel_chronic','A long course needs a wider assessment',3)],['meal_contact']);
  dx('giardia','Giardiasis','bowel digestion','Giardia can cause prolonged diarrhea, gas and greasy stools after contaminated water or contact exposure.','Stool antigen/PCR or appropriate parasite testing.','giardia',[yes('water_travel','Water/travel/contact exposure',4),yes('greasy_stool','Greasy/foul stool',3),yes('bowel_chronic','Persistent course'),is('stool_pattern','diarrhea','Diarrhea')],[],['water_travel','greasy_stool']);
  dx('pancreatic','Pancreatic exocrine insufficiency','bowel digestion','Inadequate digestive enzymes can cause fat malabsorption and weight loss.','Stool elastase and assessment for pancreatic or other malabsorption causes.','pancreatic',[yes('greasy_stool','Repeated greasy difficult-to-flush stool',4),weightLoss(3),yes('bowel_chronic','Chronic bowel symptoms'),yes('abd_back','Upper-abdominal pain to back',1)],[],['greasy_stool']);
  dx('constipation','Chronic constipation','bowel digestion','Hard, difficult-to-pass stool can cause pain, bloating and incomplete evacuation.','Review stool pattern, medicines, intake and any warning signs.','constipation',[is('stool_pattern','constipation','Predominantly hard/difficult stool',5),yes('bowel_chronic','Persistent course'),yes('pain_bowel','Pain changes with bowel movement')],[],['stool_pattern']);
  dx('hemorrhoids','Hemorrhoids','bowel bleeding','Bright-red blood on wiping, often with constipation, can arise from hemorrhoids.','Examine the source of bleeding; do not assume all rectal bleeding is hemorrhoidal.','hemorrhoids',[yes('rectal_streak','Bright-red wiping/outside-stool pattern',4),is('stool_pattern','constipation','Constipation'),no('rectal_pain','No tearing defecation pain',1)],[is('warning_signs','stoolblood','Mixed-in blood requires a wider assessment',4)],['rectal_streak']);
  dx('fissure','Anal fissure','bowel bleeding','A small tear can produce sharp pain during defecation and a bright-red streak.','Clinical examination and assessment of persistent bleeding.','fissure',[yes('rectal_streak','Small bright-red bleeding pattern',3),yes('rectal_pain','Sharp tearing pain at defecation',5),is('stool_pattern','constipation','Hard stool',1)],[],['rectal_pain']);
  dx('pinworm','Pinworm infection','bowel','Night-predominant itching confined to the anus can fit pinworm.','Appropriate morning tape sampling; ordinary stool testing can miss it.','pinworm',[yes('anal_night','Nocturnal perianal itch',5),is('rash_shape','itch','Itch with little rash',1)],[],['anal_night']);
  // Urinary and reproductive systems.
  dx('uti','Lower urinary tract infection','urinary','Burning urination with small-volume frequency/urgency can indicate a bladder infection.','Urinalysis/culture when indicated and clinical assessment; fever/flank pain changes urgency.','urinary',[yes('urine_burn','Dysuria',4),yes('urine_urgency','Small-volume urgency/frequency',3),no('urine_fever','No fever/chills/vomiting',1)],[yes('urine_fever','Fever raises concern for upper/complicated infection',3)],['urine_burn']);
  dx('pyelonephritis','Kidney infection / pyelonephritis','urinary','Urinary infection with fever and flank pain may involve the kidney.','Same-day clinical assessment, urine culture and appropriate treatment.','pyelonephritis',[yes('urine_fever','Urinary symptoms with fever/chills/vomiting',4),yes('flank','Flank pain',4),yes('urine_burn','Dysuria',1)],[],['urine_fever','flank'],{ urgency:'today' });
  dx('kidney_stone','Kidney / ureteric stone','urinary','Wave-like severe flank pain radiating to the groin, sometimes with blood in urine, can fit a stone.','Urine assessment and imaging; fever with possible obstruction is urgent.','kidney',[yes('colic','Colicky flank-to-groin pain',5),yes('urine_blood','Visible blood in urine',2),yes('flank','Flank pain')],[],['colic'],{ urgency:'soon' });
  dx('overactive_bladder','Overactive bladder','urinary','Urgency with possible urge leakage can occur without infection.','Exclude infection, high urine production and other urologic causes.','overactive_bladder',[yes('urine_urgency','Urgency/frequency'),yes('urge_leak','Urge leakage',4),no('urine_burn','No dysuria',2)],[yes('urine_burn','Dysuria suggests an alternative cause',3)],['urge_leak']);
  dx('bph','Benign prostate enlargement','urinary','Prostate enlargement can cause hesitancy, weak stream and incomplete emptying.','History, examination, urinalysis and selected prostate/flow assessment.','bph',[yes('weak_stream','Weak stream/hesitancy',4),is('age','65_plus','Older adult context',2),is('age','40_64','Age-compatible context',1),yes('urine_urgency','Urinary frequency',1)],[],['weak_stream'],{ anatomy:'prostate' });
  dx('prostatitis','Prostatitis / pelvic pain syndrome','urinary','Pelvic/perineal pain and urinary symptoms may arise from the prostate or pelvic-floor region.','Clinical assessment and urine/STI testing as appropriate; fever or retention is urgent.','prostatitis',[yes('pelvic_male','Pelvic/perineal or ejaculation pain',4),yes('urine_burn','Dysuria',2),yes('urine_urgency','Urinary urgency',2)],[],['pelvic_male'],{ anatomy:'prostate' });
  dx('pregnancy','Pregnancy','reproductive','Pregnancy is a relevant explanation for a missed period and some systemic symptoms.','Pregnancy testing; pain/bleeding or faintness may require urgent assessment for ectopic pregnancy.','pregnancy',[yes('preg_possible','Late period / possible conception',5),yes('fatigue_daily','Fatigue',1)],[],['preg_possible'],{ anatomy:'uterus' });
  dx('endometriosis','Endometriosis','reproductive','Cycle-linked pelvic pain, pain with sex or bowel movements can fit endometriosis.','Gynecologic assessment; normal imaging does not exclude all endometriosis.','endometriosis',[yes('pelvic_cycle','Cycle-linked pelvic/sex/bowel pain',5),yes('heavy_period','Heavy periods',1),is('duration','chronic','Longstanding course',2)],[],['pelvic_cycle'],{ anatomy:'uterus' });
  dx('pcos','Polycystic ovary syndrome','reproductive','Ovulatory irregularity with androgen features can suggest PCOS after competing causes are excluded.','Assess menstrual pattern, androgen features and relevant laboratory/imaging findings.','pcos',[yes('irregular_period','Persistently irregular/infrequent periods',4),yes('androgen','Androgen-related hair/acne changes',4),yes('weight_gain','Weight gain',1)],[],['irregular_period','androgen'],{ anatomy:'uterus' });
  dx('perimenopause','Perimenopause','reproductive','Changing cycles and vasomotor symptoms can reflect the menopausal transition.','Clinical assessment according to age, menstrual history and competing causes.','perimenopause',[yes('hot_flushes','Hot flushes with changing cycles',5),is('age','40_64','Typical age context',2),yes('irregular_period','Changing periods',2)],[],['hot_flushes'],{ anatomy:'uterus' });
  dx('pid','Pelvic inflammatory disease','reproductive','Pelvic pain with discharge, fever or bleeding after sex can indicate a genital-tract infection.','Prompt clinical assessment, pregnancy exclusion and STI testing.','pid',[yes('pelvic_discharge','Pelvic pain with discharge/fever/bleeding',5),is('pain_site','pelvis','Pelvic pain location',2),yes('fever_measured','Measured fever',1)],[],['pelvic_discharge'],{ anatomy:'uterus',urgency:'today' });
  // Neurological patterns.
  dx('migraine','Migraine','headache','Episodic throbbing/activity-sensitive headache with nausea or light/sound sensitivity can fit migraine.','Clinical headache assessment; a new or atypical neurological symptom requires separate evaluation.','migraine',[yes('head_pulse','Throbbing/activity-sensitive headache',3),yes('head_nausea','Nausea or light/sound sensitivity',4),yes('aura','Gradually evolving reversible aura',2),is('course','episodes','Episodic pattern',1)],[],['head_nausea','head_pulse']);
  dx('tension_headache','Tension-type headache','headache','Bilateral pressing/tightening headache without vomiting can fit tension-type headache.','Clinical assessment of pattern and warning signs.','tension_headache',[yes('head_band','Bilateral pressing-band pattern',5),no('head_nausea','No migraine-associated nausea/sensory sensitivity',2),no('head_pulse','No throbbing/activity-sensitive quality',1)],[],['head_band']);
  dx('cluster','Cluster headache','headache','Severe unilateral eye-region attacks with tearing/nasal symptoms and restlessness are a distinctive pattern.','Prompt headache assessment and specialist-directed treatment.','cluster',[yes('head_eye','Severe short unilateral orbital attacks',4),yes('eye_tears','Same-side autonomic eye/nose symptoms',5),is('course','episodes','Repeated attacks',1)],[],['head_eye','eye_tears'],{ urgency:'soon' });
  dx('medication_headache','Medication-overuse headache','headache','Frequent acute headache medicine use can sustain or worsen a frequent headache pattern.','Review exact drug, days used and headache frequency with a clinician.','headache',[yes('painkillers','Frequent headache-medicine use',4),is('duration','chronic','Longstanding course',2),yes('head_band','Frequent pressing headache',1),yes('head_pulse','Migraine-type headache',1)],[],['painkillers']);
  dx('bppv','Benign paroxysmal positional vertigo','dizziness','Brief spinning after rolling or looking up can arise from inner-ear positional vertigo.','A clinician’s positional examination; treatment depends on the affected canal.','vertigo',[is('dizzy_type','spin','True spinning sensation',2),yes('head_turn','Brief head-position-triggered attacks',5),no('ear_hearing','No hearing-change pattern',1)],[],['head_turn']);
  dx('vestibular_neuritis','Vestibular neuritis / labyrinthitis','dizziness','A new sustained vertigo syndrome, sometimes after infection, can be vestibular.','Clinical neurological and ear examination; new severe imbalance may need urgent stroke exclusion.','vestibular_neuritis',[yes('vertigo_long','Continuous spinning for hours/days',5),is('dizzy_type','spin','Spinning',2),yes('infection_start','Preceding infection',1)],[],['vertigo_long'],{ urgency:'soon' });
  dx('meniere','Ménière’s disease','dizziness','Recurrent vertigo with fluctuating hearing symptoms and ear pressure can fit an inner-ear disorder.','ENT assessment and hearing testing.','meniere',[yes('ear_hearing','Vertigo with hearing/ringing/ear-pressure symptoms',5),is('dizzy_type','spin','Spinning',2),is('course','episodes','Recurrent attacks',2)],[],['ear_hearing']);
  dx('neuropathy','Peripheral polyneuropathy','nerves','Symmetrical distal sensory symptoms can reflect peripheral nerve disease with several possible causes.','Neurological examination and targeted tests for glucose, B12, thyroid, renal and other causes; nerve studies when appropriate.','neuropathy',[yes('stocking','Symmetrical distal numbness/tingling',5),yes('burning','Neuropathic burning sensitivity',2),yes('nerve_alcohol','Potential toxic exposure',2)],[],['stocking']);
  dx('small_fiber','Small-fiber neuropathy','nerves','Small sensory/autonomic nerve disease can cause burning and temperature sensitivity with autonomic symptoms.','Neurological assessment, selected skin biopsy or autonomic testing; normal routine nerve conduction does not exclude it.','neuropathy',[yes('burning','Burning/temperature-sensitive nerve symptoms',4),yes('autonomic','Sensory symptoms with autonomic changes',3),yes('stocking','Distal sensory distribution',2)],[],['burning','autonomic']);
  dx('carpal_tunnel','Carpal tunnel syndrome','nerves','Median-nerve compression often affects the thumb/index/middle fingers and is worse at night.','Clinical assessment, with nerve testing when needed.','carpal_tunnel',[yes('median_hand','Typical median-finger/nighttime pattern',5),no('stocking','No generalized symmetrical distal pattern',1)],[],['median_hand']);
  dx('cervical_radiculopathy','Cervical radiculopathy','nerves joints','A nerve root in the neck can produce movement-related pain or tingling into an arm.','Neurological examination; progressive weakness changes urgency.','neck',[yes('neck_arm','Neck-to-arm symptoms reproduced by neck movement',5),no('stocking','Not a symmetric stocking pattern',1)],[],['neck_arm']);
  dx('sciatica','Lumbar radiculopathy / sciatica','nerves joints','Radiating leg pain from the lower back can reflect irritation of a lumbar nerve root.','Clinical neurological examination; bladder/bowel changes or saddle numbness need emergency evaluation.','sciatica',[yes('back_leg','Low-back pain radiating below the knee',5),no('stocking','No symmetric stocking pattern',1)],[],['back_leg']);
  // Musculoskeletal conditions.
  dx('osteoarthritis','Osteoarthritis','joints','Use-related joint pain with brief stiffness is a mechanical joint pattern.','Clinical assessment, with imaging only when indicated.','osteoarthritis',[yes('activity_pain','Use-related pain with short stiffness',5),no('morning_stiff','No prolonged morning stiffness',2),is('age','65_plus','Older adult context',1)],[],['activity_pain']);
  dx('rheumatoid','Rheumatoid arthritis','joints','Persistent swollen small joints with prolonged morning stiffness can indicate inflammatory arthritis.','Joint examination and prompt rheumatology assessment; RF/anti-CCP and inflammation tests support evaluation.','rheumatoid',[yes('joint_swollen','Visible inflammatory swelling',3),yes('morning_stiff','Prolonged morning stiffness',3),yes('small_symmetric','Symmetric small-joint pattern',4)],[],['joint_swollen','small_symmetric'],{ urgency:'soon' });
  dx('gout','Gout / crystal arthritis','joints','A rapid hot swollen single-joint attack, particularly at the big toe, can be crystal arthritis.','Clinical assessment; joint fluid may be needed to distinguish crystals from infection.','gout',[yes('hot_one_joint','Acute hot swollen monoarthritis',3),yes('big_toe','Big-toe or recurrent attack pattern',4)],[],['hot_one_joint','big_toe'],{ urgency:'today' });
  dx('spondyloarthritis','Axial spondyloarthritis','joints','Young-onset chronic back pain that improves with activity can be inflammatory rather than mechanical.','Clinical/rheumatology assessment with selected imaging and tests.','spondyloarthritis',[yes('back_inflammatory','Characteristic inflammatory back-pain pattern',5),yes('morning_stiff','Prolonged morning stiffness',2),yes('rash_nails','Psoriasis-related skin/nail clue',2)],[],['back_inflammatory']);
  dx('fibromyalgia','Fibromyalgia','joints','Widespread persistent pain with fatigue and unrefreshing sleep can fit a centralized pain syndrome.','Clinical criteria and evaluation for competing or coexisting disorders.','fibromyalgia',[yes('widespread','Widespread pain lasting >3 months',5),yes('unrefreshing','Unrefreshing sleep',2),yes('fatigue_daily','Fatigue',1)],[yes('joint_swollen','Objective joint swelling needs another explanation',3)],['widespread']);
  dx('hypermobility','Hypermobility spectrum disorder / hEDS candidate','joints','Generalized flexibility with instability and recurrent injury can indicate a hypermobility-related disorder.','A structured hypermobility and connective-tissue assessment; flexibility alone does not diagnose hEDS.','hypermobile',[yes('hypermobile','Multiple flexible joints with instability/injury',5),yes('widespread','Persistent widespread pain',2),is('duration','chronic','Chronic course',1)],[],['hypermobile']);
  dx('lyme','Lyme disease','joints','Compatible tick exposure with an expanding rash or later objective joint/nerve features can warrant assessment.','Use the exposure timeline and examination; appropriately selected two-step serology when indicated.','lyme',[yes('tick','Compatible tick/rash/joint exposure history',5),yes('joint_swollen','Joint swelling',2),yes('fever_measured','Measured fever',1)],[],['tick']);
  // Skin, ENT and sleep.
  dx('eczema','Atopic eczema','skin','Recurrent itchy dry patches, often in flexures, can fit eczema.','Clinical skin examination and review of irritants and infection.','eczema',[is('rash_shape','dry','Dry itchy patches',3),yes('rash_flexures','Recurrent flexural pattern',4)],[],['rash_flexures']);
  dx('contact_dermatitis','Contact dermatitis','skin','A rash following a local product/material exposure can be irritant or allergic contact dermatitis.','Exposure history and skin examination; selected patch testing for persistent allergic patterns.','contact_dermatitis',[yes('rash_contact','New contact exposure',4),is('rash_shape','dry','Dry cracked inflammatory rash',3)],[],['rash_contact']);
  dx('urticaria','Urticaria / hives','skin','Transient raised itchy welts that change location are characteristic of hives.','Clinical history; breathing or throat symptoms use the emergency allergy pathway.','urticaria',[is('rash_shape','hives','Moving short-lived itchy welts',5),yes('allergy_pattern','Recurring exposure relationship',1)],[],['rash_shape']);
  dx('psoriasis','Psoriasis','skin','Clearly outlined scaly plaques and nail pits can indicate psoriasis.','Skin and joint examination.','psoriasis',[is('rash_shape','scales','Thick sharply defined plaques',4),yes('rash_nails','Typical site/nail changes',4)],[],['rash_nails']);
  dx('scabies','Scabies','skin','Intense nocturnal itch with affected contacts and typical sites can indicate infestation.','Skin examination and selected microscopy/dermoscopy.','scabies',[yes('rash_night','Nocturnal itch with contacts/typical sites',5),is('rash_shape','itch','Little obvious rash',1)],[],['rash_night']);
  dx('shingles','Shingles','skin','Painful grouped blisters in a unilateral band can indicate shingles.','Prompt clinical assessment, especially near an eye or in immune suppression.','shingles',[is('rash_shape','blisters','Painful grouped blisters',3),yes('rash_one_side','Unilateral band of pain/blisters',5)],[],['rash_one_side'],{ urgency:'soon' });
  dx('tinea','Ringworm / tinea','skin','An expanding scaly ring with an active edge can reflect a superficial fungal infection.','Skin examination; skin scraping when uncertain.','tinea',[is('rash_shape','ring','Expanding ring with active edge',5),yes('rash_contact','Potential contact/exposure',1)],[],['rash_shape']);
  dx('rosacea','Rosacea','skin','Persistent central facial redness with flushing triggers can fit rosacea.','Clinical skin and eye assessment.','rosacea',[is('rash_shape','face','Central facial redness',4),yes('rash_flushing','Typical flushing triggers',3)],[],['rash_flushing']);
  dx('rhinitis','Allergic rhinitis','nose breathing','Itchy sneezing and watery eyes with a repeatable environmental trigger suggest nasal allergy.','History and examination; targeted specific-IgE or skin testing when useful.','rhinitis',[yes('sneeze_itch','Itchy sneezing/watery-eye cluster',4),yes('allergy_pattern','Repeatable allergen/exposure pattern',3),yes('throat_drip','Associated drainage',1)],[],['sneeze_itch']);
  dx('sinusitis','Chronic rhinosinusitis','nose breathing','Longstanding blockage/discharge with reduced smell or facial pressure can fit chronic sinus inflammation.','ENT assessment with objective evidence where required; distinguish from isolated allergic rhinitis.','sinus',[yes('sinus_long','≥12-week compatible nasal/sinus pattern',5),yes('throat_drip','Drainage/throat clearing',1)],[],['sinus_long']);
  dx('dryeye','Dry-eye disease','nose','Grittiness/burning worsened by screens, lenses or dry air can reflect ocular surface disease.','Eye examination and tear/ocular-surface assessment.','dryeye',[yes('dry_eyes','Persistent dry gritty eyes',3),yes('eye_screen','Environmental/screen/lens aggravation',3),yes('eyelid_crust','Lid inflammation clue',1)],[],['dry_eyes']);
  dx('blepharitis','Blepharitis / meibomian gland dysfunction','nose','Inflammation of eyelid margins can produce crusting and evaporative dry-eye symptoms.','Ocular-surface and eyelid-margin examination.','blepharitis',[yes('eyelid_crust','Crusted/itchy eyelid edges',5),yes('dry_eyes','Dry-eye symptoms',2)],[],['eyelid_crust']);
  dx('sjogren','Sjögren’s disease','nose','Persistent eye and mouth dryness with systemic features can suggest autoimmune exocrine disease.','Objective tear/saliva assessment with clinician-directed autoimmune tests; symptoms or antibodies alone do not establish it.','sjogren',[yes('dry_eyes','Persistent eye dryness',2),yes('dry_mouth','Persistent mouth dryness',4),yes('fatigue_daily','Fatigue',1),yes('joint_swollen','Inflammatory joint feature',1),yes('autonomic','Neurological/autonomic features',1)],[no('dry_mouth','No persistent mouth dryness',1)],['dry_mouth','dry_eyes']);
  dx('sleep_apnea','Obstructive sleep apnea','sleep energy','Sleep-related airway obstruction can cause loud snoring, witnessed pauses and daytime sleepiness.','Sleep assessment with home sleep apnea testing or polysomnography as appropriate.','sleep',[yes('snore','Loud habitual snoring',2),yes('apnea','Witnessed breathing pauses/gasping',5),yes('sleepy','Unintentional daytime dozing',2),yes('unrefreshing','Unrefreshing sleep',1)],[],['apnea','snore']);
  dx('narcolepsy','Narcolepsy','sleep energy','Irresistible daytime sleep episodes, especially with emotion-triggered weakness, warrant specialist assessment.','Sleep specialist assessment after checking adequate sleep and other causes; PSG/MSLT when indicated.','narcolepsy',[yes('sleep_attacks','Irresistible sleep attacks',4),yes('cataplexy','Emotion-triggered weakness with preserved awareness',5),yes('sleep_opportunity','Adequate sleep opportunity',2)],[],['sleep_attacks','cataplexy']);
  dx('restless_legs','Restless legs syndrome','sleep','An evening/rest-related urge to move the legs relieved by movement is characteristic.','Clinical criteria and assessment of iron status and other contributing factors.','restless_legs',[yes('restless_legs','Rest/evening urge relieved by movement',5),is('lab_ferritin','low','Iron depletion',2)],[],['restless_legs']);
  dx('mono','Infectious mononucleosis','fever energy','Marked fatigue with substantial sore throat and cervical glands can fit mononucleosis.','Clinical examination and appropriately timed testing when indicated.','mono',[yes('sore_glands','Sore throat with neck glands and marked fatigue',5),yes('fever_measured','Measured fever',2),is('age','18_39','Age-compatible context',1)],[],['sore_glands']);
  dx('respiratory_virus','Acute respiratory viral infection','fever','A sudden combination of respiratory symptoms, fever and myalgia can reflect an acute viral infection.','Clinical assessment and targeted viral testing when it changes management.','infection',[yes('viral_acute','Acute respiratory/fever/myalgia syndrome',5),yes('fever_measured','Measured fever',1),is('duration','days','Recent onset',2)],[is('duration','chronic','A long-standing course is not explained by an acute viral episode',5)],['viral_acute']);
  dx('appendicitis','Appendicitis','digestion','New or worsening lower-right abdominal pain with nausea, vomiting or fever can indicate appendicitis.','Same-day examination and appropriate imaging/laboratory assessment; severe symptoms use the emergency path.','appendicitis',[is('pain_site','lower_right','Lower-right abdominal pain',4),yes('abd_fever','Abdominal pain with fever or repeated vomiting',3),is('course','worse','Worsening course',2)],[],['pain_site'],{urgency:'today'});
  dx('cholecystitis','Acute cholecystitis / gallbladder inflammation','digestion','Persistent upper-right pain with fever or vomiting can indicate an inflamed gallbladder.','Same-day examination, ultrasound and laboratory testing.','cholecystitis',[is('pain_site','upper_right','Upper-right pain',3),yes('abd_fever','Fever or repeated vomiting',4),yes('fatty_pain','Biliary-type pain',2)],[],['abd_fever'],{urgency:'today'});
  dx('pancreatitis','Pancreatitis','digestion','Upper-abdominal pain spreading to the back with vomiting can indicate pancreatic inflammation.','Urgent clinical assessment, pancreatic enzymes and selected imaging.','pancreatitis',[is('pain_site','upper_middle','Upper-middle abdominal pain',2),yes('abd_back','Persistent pain spreading to the back',4),yes('abd_fever','Fever or repeated vomiting',3)],[],['abd_back'],{urgency:'today'});
  dx('diverticulitis','Diverticulitis','digestion','Lower-left abdominal pain with fever and altered bowel habit can reflect inflamed diverticula.','Same-day clinical assessment; selected imaging and evaluation for complications.','diverticulitis',[is('pain_site','lower_left','Lower-left abdominal pain',4),yes('abd_fever','Fever or repeated vomiting',3),is('stool_pattern','constipation','Altered bowel habit',1)],[],['pain_site'],{urgency:'today'});
  dx('platelet_disorder','Low platelets / bleeding-disorder candidate','bleeding energy','Unexplained bruising or bleeding can arise from platelet problems, medicines or other clotting disorders.','Blood count with platelets, medication review and clinician-directed coagulation assessment.','platelets',[yes('easy_bruising','Repeated unexplained bruising or bleeding spots',4),yes('blood_loss','Ongoing bleeding',1),is('lab_platelets','low','Platelet count below range',6)],[is('lab_platelets','normal','Platelet count was normal; other bleeding causes remain possible',2)],['easy_bruising','lab_platelets']);
  const alerts = [
    { id:'weightloss', rule:eq('warning_signs','weightloss'), level:'soon', title:'Unintentional weight loss', message:'Arrange medical assessment. A symptom match does not explain away unintentional weight loss.' },
    { id:'systemic', rule:any(eq('warning_signs','sweats'),eq('warning_signs','lump')), level:'soon', title:'Persistent systemic warning signs', message:'Persistent fever, drenching sweats or a new persistent lump need examination and targeted testing.' },
    { id:'stoolblood', rule:any(eq('warning_signs','stoolblood'),eq('warning_signs','melena')), level:'soon', title:'Blood in stool or black stool', message:'Get the source of bleeding assessed. Do not rely on an IBS or food-intolerance match.' },
    { id:'swallow', rule:eq('warning_signs','swallow'), level:'soon', title:'Progressive swallowing difficulty', message:'Arrange prompt medical assessment rather than treating this as simple reflux.' },
    { id:'immune', rule:eq('warning_signs','immune'), level:'today', title:'Fever with immune suppression', message:'Seek same-day urgent medical advice.' },
    { id:'leg', rule:eq('warning_signs','leg'), level:'today', title:'New one-sided leg swelling', message:'Seek same-day assessment for a possible blood clot. New chest pain or breathlessness requires emergency care.' },
    { id:'jaundice', rule:eq('warning_signs','jaundice'), level:'today', title:'New jaundice', message:'Seek same-day assessment, especially if there is fever or abdominal pain.' },
    { id:'kidney', rule:all(eq('urine_fever','yes'),any(eq('flank','yes'),eq('colic','yes'))), level:'today', title:'Fever with flank/stone symptoms', message:'Seek same-day urgent assessment for kidney infection or an infected obstruction.' },
    { id:'eye', rule:any(eq('rash_eye','yes'),eq('eye_acute','yes')), level:'today', title:'Acute eye symptoms', message:'A painful/red eye with reduced vision, or shingles near an eye, needs urgent eye assessment.' },
    { id:'head50', rule:eq('head_new50','yes'), level:'today', title:'New headache with temporal-artery warning features', message:'Seek same-day assessment, particularly with jaw pain or any visual change.' },
    { id:'weakness', rule:eq('warning_signs','weakness'), level:'soon', title:'Progressive muscle weakness', message:'Arrange prompt neurological assessment. Sudden weakness uses the emergency pathway.' },
    { id:'coughblood', rule:eq('cough_blood','yes'), level:'today', title:'Coughing up blood', message:'Seek urgent medical assessment; larger amounts, chest pain or breathing difficulty need emergency care.' },
    { id:'mono_activity', rule:eq('sore_glands','yes'), level:'soon', title:'Sore throat, glands and marked fatigue', message:'Arrange an examination. If mononucleosis is suspected, avoid contact sports or heavy impact until assessed.' },
    { id:'joint_hot', rule:eq('hot_one_joint','yes'), level:'today', title:'A hot, swollen single joint', message:'Seek same-day assessment to distinguish crystal arthritis from joint infection.' },
    { id:'pelvic', rule:eq('pelvic_discharge','yes'), level:'today', title:'Pelvic pain with discharge/fever', message:'Seek prompt same-day assessment for infection and pregnancy-related causes.' },
    { id:'abdominal', rule:all(eq('abd_fever','yes'),any(eq('pain_site','lower_right'),eq('pain_site','lower_left'),eq('pain_site','upper_right'),eq('abd_back','yes'))), level:'today', title:'Focal abdominal pain with systemic symptoms', message:'Seek same-day assessment for an acute abdominal condition. Severe or rapidly worsening pain requires emergency care.' },
    { id:'urinary_fever', rule:eq('urine_fever','yes'), level:'today', title:'Urinary symptoms with fever or vomiting', message:'Seek same-day assessment for a complicated or upper urinary infection.' },
    { id:'urineblood', rule:eq('urine_blood','yes'), level:'soon', title:'Visible blood in urine', message:'Arrange medical assessment even if it happened only once; do not assume it is a stone or infection.' },
    { id:'newchest', rule:all(eq('exertional_chest','yes'),any(eq('duration','hours'),eq('duration','days'),eq('course','worse'))), level:'today', title:'New or worsening exertional chest pressure', message:'Seek same-day urgent assessment. Persistent pain now, breathlessness, sweating or faintness uses the emergency pathway.' },
    { id:'bruising', rule:eq('easy_bruising','yes'), level:'soon', title:'Unexplained bruising or bleeding spots', message:'Arrange clinical assessment and a blood-count/medication review, especially when this is new or recurrent.' }
  ];
  const differentialRules = [
    { id:'thyroid_discordance',rule:eq('lab_thyroid','discordant'),title:'A thyroid mismatch needs verification',message:'High FT4 with nonsuppressed TSH does not form the usual primary-hyperthyroidism pattern. Measurement interference, medicines and other causes need consideration before attributing it to active Graves.' },
    { id:'iron_without_anemia',rule:all(eq('lab_ferritin','low'),eq('lab_hgb','normal')),title:'Iron stores and anemia are different findings',message:'Low iron stores with normal hemoglobin can support iron deficiency without anemia. It does not establish iron-deficiency anemia.' },
    { id:'celiac_uncertain_negative',rule:eq('lab_celiac','uncertain'),title:'That negative celiac result is not a reliable exclusion',message:'A negative result with uncertain IgA status or insufficient gluten intake leaves the diagnostic question open.' },
    { id:'orthostatic_alternative',rule:all(eq('heart_rise','yes'),any(eq('bp_drop','yes'),eq('lab_hgb','low'),eq('lab_thyroid','hyper'),eq('fluid_loss','yes'))),title:'Standing tachycardia may have a secondary cause',message:'A significant pressure drop, anemia, hyperthyroidism or acute fluid loss weakens a primary orthostatic-tachycardia syndrome label until the alternative is assessed.' },
    { id:'bowel_alarm',rule:any(eq('warning_signs','stoolblood'),eq('bowel_night','yes')),title:'Bowel alarm features change the priority',message:'Blood mixed into stool or nocturnal diarrhea needs assessment for organic disease. An IBS or food-trigger match cannot close that branch.' },
    { id:'mecfs_timing',rule:all(eq('pem','yes'),any(eq('duration','hours'),eq('duration','days'),eq('duration','weeks'),eq('duration','months'))),title:'A crash alone does not establish ME/CFS',message:'The prolonged duration and full clinical criteria used by this path have not been established. Investigate other causes and the recovery pattern.' }
  ];
  return { version:1, reviewed:'2026-10-28', context, groups, domains, conditions, alerts, differentialRules, sources };
});
