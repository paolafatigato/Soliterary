/**
 * SOLITERARY - the catalog: every story belongs to ONE author (or tradition), ONE genre and 1-3 topics.
 * The home page uses it for the Categories; the game uses it to draw new stories from the chosen category.
 * To classify a new story: add a line to TAGS  'id': 'genre-key | topic, topic'  (keys are in GENRES and TOPICS below).
 * Loaded after stories.js / classics.js / chapters.js.
 */
(() => {
  const GENRES = {
    fairy:   { name: 'Fairy tales',        emoji: '🧚' },
    myth:    { name: 'Myths & legends',    emoji: '🏛️' },
    fantasy: { name: 'Fantasy',            emoji: '🪄' },
    advent:  { name: 'Adventure',          emoji: '🧭' },
    gothic:  { name: 'Gothic & ghosts',    emoji: '🦇' },
    mystery: { name: 'Mystery & detective', emoji: '🔎' },
    scifi:   { name: 'Science fiction',    emoji: '🚀' },
    tragedy: { name: 'Shakespeare: tragedy', emoji: '🎭' },
    comedy:  { name: 'Shakespeare: comedy', emoji: '🃏' },
    growing: { name: 'Growing up',         emoji: '🎒' },
    giulia:  { name: 'For Giulia',         emoji: '🎂' },
    daily:   { name: 'Everyday life',      emoji: '🏠' },
  };
  const TOPICS = {
    magic:   { name: 'Magic',              emoji: '✨' },
    ghosts:  { name: 'Ghosts',             emoji: '👻' },
    animals: { name: 'Animals',            emoji: '🐾' },
    sea:     { name: 'Sea & islands',      emoji: '🌊' },
    love:    { name: 'Love',               emoji: '💌' },
    crime:   { name: 'Crime & clues',      emoji: '🕵️' },
    kings:   { name: 'Kings & queens',     emoji: '👑' },
    monsters:{ name: 'Monsters',           emoji: '👹' },
    treasure:{ name: 'Treasure',           emoji: '💰' },
    friends: { name: 'Friendship',         emoji: '🤝' },
    school:  { name: 'School & growing up', emoji: '📚' },
    journey: { name: 'Journeys',           emoji: '🗺️' },
    tricks:  { name: 'Tricks & lies',      emoji: '🦊' },
    food:    { name: 'Food',               emoji: '🍪' },
    sport:   { name: 'Sport',              emoji: '⚽' },
  };

  const TAGS = {
    // ---- our own stories
    dragon: 'fantasy|magic,animals,friends', phone: 'daily|animals', ghost: 'gothic|ghosts', birthday: 'daily|friends',
    space: 'scifi|journey', cook: 'daily|food', cat: 'daily|animals', treasure: 'advent|treasure,journey',
    student: 'daily|school,friends', sneakers: 'fantasy|magic', museum: 'mystery|crime', singer: 'daily|school',
    camping: 'advent|journey', time: 'scifi|journey,magic', train: 'daily|journey', hamster: 'daily|animals',
    snow: 'daily|friends', fishing: 'advent|sea', soccer: 'daily|sport', library: 'fantasy|magic,school',
    // ---- Wilde, Poe, Dickens, Stevenson, Doyle
    prince: 'fairy|friends,kings', giant: 'fairy|friends', canterville: 'gothic|ghosts', nightingale: 'fairy|love',
    dorian: 'gothic|magic', telltale: 'gothic|crime', raven: 'gothic|ghosts', cask: 'gothic|crime', goldbug: 'mystery|treasure,crime',
    christmas: 'gothic|ghosts', marley: 'gothic|ghosts', jekyll: 'gothic|monsters', hound: 'mystery|crime,animals,monsters',
    speckled: 'mystery|crime,animals',
    // ---- Alice
    rabbit: 'fantasy|animals,magic', teaparty: 'fantasy|magic', croquet: 'fantasy|kings', mirror: 'fantasy|magic',
    tweedle: 'fantasy|magic', humpty: 'fantasy|magic',
    // ---- Shakespeare
    witches: 'tragedy|magic,kings', sleepwalk: 'tragedy|kings,crime', hamlet: 'tragedy|ghosts,kings', caesar: 'tragedy|kings,crime',
    yorick: 'tragedy|kings', lear: 'tragedy|kings', handkerchief: 'tragedy|love,tricks', dagger: 'tragedy|crime,kings',
    balcony: 'tragedy|love', midsummer: 'comedy|magic,love', donkey: 'comedy|magic,tricks', twelfth: 'comedy|love,tricks',
    tempest: 'comedy|magic,sea', portia: 'comedy|tricks,love',
    // ---- adventure and fantasy classics
    treasureisland: 'advent|treasure,sea', peterpan: 'fantasy|magic,school', shadow: 'fantasy|magic', oz: 'fantasy|journey,magic,friends',
    curtain: 'fantasy|tricks,magic', mowgli: 'advent|animals', rikki: 'advent|animals', gulliver: 'fantasy|journey,sea',
    frankenstein: 'gothic|monsters', dracula: 'gothic|monsters', fence: 'growing|tricks,friends', cave: 'advent|treasure,friends',
    crusoe: 'advent|sea', quixote: 'advent|tricks,journey', fogg: 'advent|journey', squid: 'scifi|sea,monsters', martians: 'scifi|monsters',
    // ---- fairy tales
    hood: 'fairy|animals,tricks', hansel: 'fairy|magic,food', cinderella: 'fairy|magic,love,kings', beanstalk: 'fairy|magic,monsters',
    rapunzel: 'fairy|magic,love', emperor: 'fairy|kings,tricks', duckling: 'fairy|animals,school', pinocchio: 'fairy|magic,tricks',
    piper: 'fairy|magic,animals', rumpel: 'fairy|magic,kings', alibaba: 'fairy|treasure,tricks',
    // ---- myths and legends
    cyclops: 'myth|monsters,sea,tricks', medusa: 'myth|monsters', icarus: 'myth|journey', pandora: 'myth|magic', trojan: 'myth|tricks,kings',
    orpheus: 'myth|love,ghosts', excalibur: 'myth|kings,magic', beowulf: 'myth|monsters', bridge: 'myth|friends,tricks',
    // ---- growing up
    oliver: 'growing|school,food', pip: 'growing|crime,school', greenhair: 'growing|school,friends', jo: 'growing|school,friends',
    // ---- added 2026-11-10
    magi: 'daily|love', necklace: 'daily|tricks', monkeypaw: 'gothic|magic', rip: 'fantasy|magic',
    montecristo: 'advent|sea,treasure', mobydick: 'advent|sea,monsters', timemachine: 'scifi|journey,monsters', sleepyhollow: 'gothic|ghosts,tricks',
    redheaded: 'mystery|crime,tricks', midas: 'myth|kings,magic,food', theseus: 'myth|monsters', arachne: 'myth|magic',
    narcissus: 'myth|love', bluebeard: 'fairy|crime', puss: 'fairy|animals,tricks', bremen: 'fairy|animals,friends',
    // ---- secret deck (giulia.js, loaded only with #giulia)
    gschool: 'giulia|school,friends', gcar: 'giulia|love', gbear: 'giulia|love,monsters,tricks', gfive: 'giulia|love,journey', groad: 'giulia|friends,journey', gclimb: 'giulia|sport',
    snowqueen: 'fairy|magic,friends', aladdin: 'fairy|magic,treasure', wolfcry: 'fairy|animals,tricks', tortoise: 'fairy|animals,sport',
  };

  // authors that are really a tradition: they go together
  const TRADITION = 'Myths & traditional tales';
  const TRAD = ['Greek myth', 'English folk tale', 'English legend', 'Old English poem', 'One Thousand and One Nights'];
  const authorOf = s => s.source ? (TRAD.includes(s.source.author) ? TRADITION : s.source.author) : 'Soliterary originals';
  const AUTHOR_EMOJI = { 'William Shakespeare': '🎭', 'Lewis Carroll': '🐇', 'Oscar Wilde': '🌹', 'Edgar Allan Poe': '🪶', 'Charles Dickens': '🎩',
    'Brothers Grimm': '🏰', 'Charles Perrault': '👠', 'Hans Christian Andersen': '🦢', 'Jules Verne': '🐙', 'Robert Louis Stevenson': '🏴‍☠️',
    'Arthur Conan Doyle': '🔎', 'Mark Twain': '🛶', 'J. M. Barrie': '🧚', 'L. Frank Baum': '🌪️', 'Rudyard Kipling': '🐍', 'Mary Shelley': '⚡',
    'Bram Stoker': '🦇', 'H. G. Wells': '👽', 'Jonathan Swift': '🧍', 'Daniel Defoe': '🏝️', 'Louisa May Alcott': '✂️', 'L. M. Montgomery': '🧑‍🦰',
    'Carlo Collodi': '🪵', 'Miguel de Cervantes': '🛡️', 'Sir Thomas Malory': '⚔️' };
  AUTHOR_EMOJI['Giulia’s birthday deck'] = '🎂'; AUTHOR_EMOJI[TRADITION] = '📜'; AUTHOR_EMOJI['Soliterary originals'] = '📖';

  const byId = {};
  STORIES.forEach(s => {
    const t = (TAGS[s.id] || 'daily|').split('|');
    byId[s.id] = { id: s.id, author: authorOf(s), genre: t[0], topics: (t[1] || '').split(',').filter(Boolean) };
    if (!TAGS[s.id]) console.warn('catalog.js: no tags for', s.id);
  });

  // kinds: 'authors' | 'topics' | 'genres' -> [{ key, name, emoji, ids }] (the biggest first)
  function groups(kind) {
    const m = new Map();
    const add = (key, name, emoji, id) => { if (!m.has(key)) m.set(key, { key, name, emoji, ids: [] }); m.get(key).ids.push(id); };
    STORIES.forEach(s => {
      const c = byId[s.id];
      if (kind === 'authors') add(c.author, c.author, AUTHOR_EMOJI[c.author] || '✒️', s.id);
      else if (kind === 'genres') add(c.genre, GENRES[c.genre].name, GENRES[c.genre].emoji, s.id);
      else c.topics.forEach(t => add(t, TOPICS[t].name, TOPICS[t].emoji, s.id));
    });
    return [...m.values()].filter(g => kind !== 'topics' || g.ids.length >= 2).sort((a, b) => b.ids.length - a.ids.length || a.name.localeCompare(b.name));
  }
  const group = (kind, key) => groups(kind).find(g => g.key === key) || null;

  window.CATALOG = { GENRES, TOPICS, byId, groups, group, authorOf };
})();
