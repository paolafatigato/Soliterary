/**
 * SOLITERARY - which two cards make a good text together (medium level). Loaded after levels.js.
 * On the columns a card can be put next to another card of ANOTHER story if, read one after the other, they are good English:
 *   1. punctuation and capitals: after . ! ? the next card must start with a capital letter (a new sentence);
 *      after a comma or no punctuation it must start with a small letter - or with the name of a person (After three months, Zara planted a flag).
 *   2. sense: every half has a "kind" (what it is) and sometimes a class/flags (who does it, what kind of verb it is...), see SPEC below.
 * Only the GRAMMAR counts, not the sense: silly pairs are fine (The face in the painting sailed to a faraway island).
 * Cards of the SAME story that follow each other in the story always fit (engine.js), whatever is written here.
 *
 * SPEC: for every story, 10 tokens (one per card, in story order). A token is  KIND[:arg][+flag+flag...]
 *  first halves (they start a sentence, capital letter):
 *    NP:<who>[+pl]   a subject (+pl = plural) that still needs its verb: H human, A animal, W wizard, B body part, O thing, P place
 *    CLn:<who>+flags a whole clause with no comma (She felt sad / They ran away);  CLc:<who>  the same but ending with a comma
 *                    flags: act (someone does something) tr (has an object) dur (lasts) mot (movement) wea (weather) lm ("last minute")
 *                           toh (can go to a house) net past ben list air box rel   -> for the phrases that only fit some verbs
 *    ADV             time phrase with a comma (One afternoon,)     ADVP  place phrase without comma (Inside the sneakers)
 *    V:<verb>        a verb that needs its object: found heard saw took got drank pulled said
 *    VBE (Peanut was)   VBEPL (Inside there were)   VI (Tom wanted)   X = does not fit anywhere else
 *  second halves (small letter, ending with a full stop):
 *    VP:<who can do it>[+was|+were]   a verb phrase (+was only with a singular subject, +were only with a plural one)       AND:vp (and + verb phrase) / AND:cl (and + clause)    SO / BUT (+ clause)    REL (who ...)
 *    CL2 a clause after an opening phrase     EXIST (there was...)       INF (to + verb)
 *    OBJ:<SOUND ANIMAL THING THINGPL FOOD VEHICLE>   QUOTE   PP:<kind of phrase: LOC DUR BEF FROM TOHOUSE NET PAST INSTR BEN OF LIST AIR BOX>
 *
 * LONGER SENTENCES (chapters.js): a sentence can have 1-4 cards.
 *    S               a whole sentence on one card
 *    <any>+m         the card does not end its clause (no full stop): after it, it works like a clause with its own flags (act tr mot dur ben di ...)
 *    NPM / ADV2      a phrase after a subject (The girl | in the red cloak | walked...) / a second opening phrase (One day, | when it rained, | the boy...)
 *    PP types added  WITH (act) DIR (mot) TIME MOD (tr) TO SRC ONTO (di = gave/told/sold...) LIKE (act)
 */
(() => {
  const SPEC = {
    dragon:   'X X CLc:H SO CLc:H BUT CLn:H+act+tr+ben PP:BEN ADV CL2',
    phone:    'NP:H VP:HW CLc:H BUT V:said QUOTE CLn:O+mot PP:FROM NP:A VP:HAW+was',
    ghost:    'CLn:H+dur PP:LOC V:heard OBJ:SOUND CLn:H+act+mot+toh+net+past AND:vp V:found OBJ:ANIMAL CLn:H+act+tr+list AND:vp',
    birthday: 'ADV CL2 CLn:H+dur AND:vp ADV CL2 CLn:H+act+tr+ben AND:cl CLn:H+act+tr AND:vp',
    space:    'NP:H VP:HW CLc:O AND:cl CLn:H+act+tr+ben PP:INSTR ADV CL2 CLn:H+act+tr+ben AND:vp',
    cook:     'VI INF CLn:H+act+tr+ben AND:vp NP:P VP:P+was CLn:H+act+mot AND:vp CLn:H+act+tr+ben AND:vp',
    cat:      'CLn:A+rel REL ADV CL2 CLc:O SO CLn:A+act+mot AND:vp X X',
    treasure: 'V:found OBJ:THING ADV CL2 CLn:H+act+tr+dur+ben AND:vp VBEPL OBJ:THINGPL CLn:H+act+mot+toh+past AND:vp',
    student:  'NP:H VP:HW CLc:H SO NP:H VP:HAW CLn:H+act+tr+dur AND:cl ADV CL2',
    sneakers: 'CLc:H BUT CLn:H+act+tr+ben AND:vp NP:B VP:HAWB CLn:H+act+mot PP:BEF ADV CL2',
    museum:   'ADV CL2 V:found OBJ:THINGPL CLn:H+act+tr+mot+toh PP:TOHOUSE NP:H VP:HW NP:O VP:O+was',
    singer:   'CLc:H BUT CLn:H+act+tr+ben+list PP:LIST ADV CL2 CLn:H+act+tr AND:vp CLn:H+act+dur+air AND:cl',
    camping:  'NP:H+pl VP:H CLn:H+act+tr+dur+ben AND:vp NP:H VP:HAW NP:A VP:HAW ADV CL2',
    time:     'NP:H VP:HW NP:H VP:HW V:saw OBJ:ANIMAL NP:A VP:HAW NP:H VP:HW',
    train:    'CLn:H+act+tr+toh INF CLc:H AND:cl CLn:H PP:LOC V:took OBJ:VEHICLE CLn:H+act+tr+dur PP:LOC',
    hamster:  'V:got OBJ:ANIMAL ADV CL2 CLn:H+act+dur+box AND:vp VBE PP:BOX CLc:H BUT',
    snow:     'CLn:O+wea+dur PP:DUR ADV EXIST NP:H+pl VP:HW V:drank OBJ:FOOD ADV CL2',
    fishing:  'NP:H VP:HW CLn:H+act+dur PP:DUR NP:O VP:O V:pulled OBJ:THING CLn:H+dur AND:vp',
    soccer:   'CLn:O+lm PP:OF ADV CL2 CLn:H+act+mot+dur+toh+net+past PP:PAST CLn:O+mot+toh+net+past PP:NET CLn:H+act+tr+air PP:AIR',
    library:  'V:found OBJ:THING ADV CL2 CLn:H+act+tr AND:vp NP:H VP:HW NP:W VP:HAW',
  };
  // which objects each verb takes
  const VERB = {
    found: ['ANIMAL', 'THING', 'THINGPL', 'FOOD', 'VEHICLE'], heard: ['SOUND', 'ANIMAL'], saw: ['ANIMAL', 'THING', 'THINGPL', 'FOOD', 'VEHICLE'],
    took: ['VEHICLE', 'THING', 'THINGPL', 'FOOD', 'ANIMAL'], got: ['THING', 'THINGPL', 'ANIMAL', 'FOOD', 'VEHICLE'], drank: ['FOOD'], pulled: ['THING', 'THINGPL'],
  };
  const NAMES = new Set(['Captain', 'Detective', 'Professor', 'Grandpa', 'Grandma', 'Zara', 'Tom', 'Oscar', 'Ella', 'Leo', 'Nina', 'Dan', 'Maria', 'Emma', 'Peanut', 'Zoe', 'Dylan', 'Lily', 'Kenji', 'Alice', 'Scrooge', 'Doctor', 'Hyde', 'Sir', 'Holmes', 'Montresor', 'Legrand', ...(window.EXTRA_NAMES || [])]);
  const NAME_OK = ['NP', 'CLn', 'CLc', 'V', 'VBE', 'VBEPL', 'VI', 'CL2'];

  const endS = t => /[.!?][”"]?$/.test(t);
  const upper = t => /^[A-Z“"]/.test(t);
  const lower = t => /^[a-z]/.test(t);
  const isName = t => NAMES.has(t.split(/[ ,]/)[0]);

  const parse = (tok, text) => {
    const [head, ...fl] = tok.split('+'), [k, a] = head.split(':');
    return { k, a: a || '', f: new Set(fl), t: text };
  };

  function ppOk(a, type) {
    const f = a.f, bad = f.has('wea') || f.has('lm');
    switch (type) {
      case 'LOC': case 'BEF': case 'TIME': return !bad;
      case 'WITH': return f.has('act');                 // with his sister / with a basket
      case 'DIR': return f.has('mot');                  // into the forest / across the river
      case 'MOD': return f.has('tr');                   // a house made of candy (after an object)
      case 'TO': case 'SRC': case 'ONTO': return f.has('di');   // told a lie to the fairy / bought dye from a peddler / sewed it onto his foot
      case 'LIKE': return f.has('act');                 // like a lizard
      case 'DUR': return f.has('dur');
      case 'FROM': return f.has('mot');
      case 'TOHOUSE': return f.has('toh');
      case 'NET': return f.has('net');
      case 'PAST': return f.has('past');
      case 'INSTR': return f.has('tr');
      case 'BEN': return f.has('ben');
      case 'OF': return f.has('lm');
      case 'LIST': return f.has('list');
      case 'AIR': return f.has('air');
      case 'BOX': return f.has('box');
      default: return false;
    }
  }

  // MIDDLE cards: a sentence can have 1 to 4 cards. A card with the flag  m  does not end its clause: after it, it works like a whole clause
  // (CLn, or CLc if it ends with a comma) with its own flags, so it can be followed by a PP, an INF, AND, SO, BUT ... or by another m card.
  //   Tom went | into the forest | with his sister | to cut wood.      CLn:H+act+mot  PP:DIR+m+act  PP:WITH+m+act  INF
  // ADV2 = a second opening phrase (One day, | when it rained, | the boy ...), NPM = a phrase after a subject (The girl | in the red cloak | walked ...),
  // S = a whole sentence on one card.
  function norm(a) {
    if (a.f.has('m')) return Object.assign({}, a, { k: /,[”"]?$/.test(a.t) ? 'CLc' : 'CLn' });
    if (a.k === 'ADV2') return Object.assign({}, a, { k: 'ADV' });
    if (a.k === 'NPM') return Object.assign({}, a, { k: 'NP' });
    return a;
  }

  /** can b come right after a? (a, b = parsed halves) */
  function fits(a, b) {
    a = norm(a);
    if (endS(a.t)) return upper(b.t) && b.k !== 'QUOTE';                       // a new sentence starts with a capital letter
    if (a.k === 'X') return false;
    if (!lower(b.t)) {                                                          // a capital letter in the middle of a sentence: only a name or a quotation
      if (a.k === 'V' && a.a === 'said' && b.k === 'QUOTE') return true;
      return a.k === 'ADV' && isName(b.t) && NAME_OK.includes(b.k);
    }
    switch (a.k) {
      case 'NP':   // a subject needs a verb phrase, and was/were must agree with it
        if (b.f.has('was') && a.f.has('pl')) return false;
        if (b.f.has('were') && !a.f.has('pl')) return false;
        return b.k === 'VP' || b.k === 'NPM';   // silly is fine (The face in the painting sailed to a faraway island), only the grammar counts
      case 'CLn': case 'CLc':
        if (b.k === 'SO' || b.k === 'BUT') return true;
        if (b.k === 'AND') return true;                        // and + clause, or and + verb phrase with the same subject
        if (b.k === 'REL') return a.f.has('rel');
        if (b.k === 'INF') return a.k === 'CLn' && a.f.has('act');
        if (b.k === 'PP') return a.k === 'CLn' && ppOk(a, b.a);
        return false;
      case 'ADV': return b.k === 'CL2' || b.k === 'EXIST' || b.k === 'ADV2';
      case 'ADVP': return b.k === 'EXIST';
      case 'V': return b.k === 'OBJ';                         // a verb that needs an object takes any noun phrase (even a silly one)
      case 'VBE': return b.k === 'PP' && (b.a === 'LOC' || b.a === 'BOX');
      case 'VBEPL': return b.k === 'OBJ' && b.a === 'THINGPL';
      case 'VI': return b.k === 'INF';
      default: return false;
    }
  }

  STORIES.forEach(s => {
    const toks = (SPEC[s.id] || s.specStr).split(' ');
    if (toks.length !== 10) console.error('grammar.js: story', s.id, 'has', toks.length, 'tokens');
    s.spec = toks.map((t, i) => parse(t, s.sets.medium[i]));
  });
  const spec = (games, c) => games[(c / 10) | 0].spec[c % 10];

  /** card x may stand right before card y (cards of different stories) */
  window.midFits = (games, x, y) => fits(spec(games, x), spec(games, y));
  /** why not? (the card above = a, the card put under it = b), a short hint for the pupil */
  window.midWhy = (games, a, b) => {
    const p = spec(games, a), q = spec(games, b);
    if (endS(p.t) && !upper(q.t)) return 'After a full stop a new sentence starts with a capital letter.';
    if (!endS(p.t) && !lower(q.t) && q.k !== 'QUOTE') return 'A capital letter can’t come here (only a name can).';
    return 'These two cards don’t make a good sentence together.';
  };
})();
