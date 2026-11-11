/**
 * SOLITERARY - the secret deck for Giulia's birthday (loaded after chapters.js, before catalog.js).
 * The stories are added to STORIES ONLY when the page is opened with  index.html#giulia  or  game.html?deck=giulia,
 * so nobody else sees them in Categories, random games or the weekly challenge.
 * Same format as chapters.js: text = sentences separated by " / ", cards separated by " | "; spec = one grammar token per card.
 * Her birthday is 12/11: every story has 12 or 11 cards, and a game of her deck is 12, 11, 12, 11 (script.js giuliaGames).
 * So the deck needs at least two stories of 12 cards and two of 11.
 */
(() => {
  const inGame = new URLSearchParams(location.search).get('deck') === 'giulia';       // game.html?deck=giulia: the stories join STORIES
  const active = location.hash === '#giulia' || inGame;
  // the secret page appears only by its link: if the link is typed in a page that is already open, load again with the deck
  window.addEventListener('hashchange', () => { if (!active && location.hash === '#giulia') location.reload(); });
  window.GIULIA_ACTIVE = active;
  if (!active) return;

  window.EXTRA_NAMES = (window.EXTRA_NAMES || []).concat(['Giulia']);
  const BOOK = 'For Giulia', AUTHOR = 'Giulia’s birthday deck';
  const G = [
    { id: 'gschool', title: 'The Rainbow', emoji: '🌈',
      text: 'Giulia started high school | at the hardest science school. / Her English teacher was very grumpy, | and her classmates only worried about grades. / Every morning, | Giulia walked in | wearing bright colors and SpongeBob! / Slowly, | the gray classroom filled with color, | and some classmates even became friends. / Even the grumpy teacher | smiled at her once.',
      spec: 'CLn:H+act+tr PP:LOC CLc:H AND:cl ADV CL2+m+act PP:WITH ADV CL2+m AND:cl NP:H VP:HW' },
    { id: 'gcar', title: 'Nobody’s Little Goat', emoji: '🐐',
      text: 'One night, Giulia met a fancy guy | and beat him at foosball and ping pong. / One thing led to another, | and they parked in a dark street. / They kissed for a long time, | and he felt lucky to be with such a beauty. / He tried his best moves | and held her by the wrists. / Then he pressed her face against the car seat. / “What is this guy doing??!” Giulia thought. / She gave him a sharp look and said, | “I am nobody’s sacrificial goat, I am the boss!”',
      spec: 'CLn:H+act+tr AND:vp CLc:O AND:cl CLc:H+act AND:cl CLn:H+act+tr AND:vp S S V:said QUOTE' },
    { id: 'gbear', title: 'The Poet', emoji: '🐻',
      text: 'A big man dressed like a professor | pretended to know history and poetry. / Every night, | he wrote Giulia a sweet poem. / One evening, | Giulia saw sharp teeth | in his grin. / He was really a hungry bear, | and he wanted her for dinner! / Giulia called her friends, | and together they escaped.',
      spec: 'NP:H VP:HW ADV CL2 ADV CL2+m+act+tr PP:LOC CLc:H AND:cl CLc:H+act AND:cl' },
    { id: 'gfive', title: 'Five Summers', emoji: '🏖️',
      text: 'Giulia dated a guy | for five years. / On every vacation, | he walked away | to take photos of birds. / Giulia waited by the pool | and read another book. / She never complained, but she felt lonely. / In the fifth summer, | she went on vacation alone | and had the best time of her life.',
      spec: 'CLn:H+act+tr+dur PP:DUR ADV CL2+m+act+mot INF CLn:H+act AND:vp S ADV CL2+m+act+mot AND:vp' },
    { id: 'groad', title: 'The Question', emoji: '🚗',
      text: 'On a Saturday in May, | Giulia drove to the sea. / A friendly girl | shared the ride. / The girl asked, | “Are you in love? With a man or a woman?” / Giulia laughed out loud, | but she was not angry. / Everybody asked her the same thing! / She was wearing a rainbow watch | that made her look even more LGBTQ+...',
      spec: 'ADV CL2 NP:H VP:HW V:said QUOTE CLc:H BUT S CLn:H+act+tr+rel REL' },
    { id: 'gclimb', title: 'Sweaty', emoji: '🧗',
      text: 'On a hot spring day, | Giulia tied the rope to her waist. / Her hands sweated a lot, | so she used more chalk. / Slowly, | she climbed the mountain | with her wet fingers. / Her foot slipped, but she held on! / Her friends below shouted, | “Go, Giulia, go!” / At the top, | she found hundreds of tiny fossils!',
      spec: 'ADV CL2 CLc:B SO ADV CL2+m+act+tr PP:WITH S V:said QUOTE ADV CL2' },
    { id: 'gmosaic', title: 'The Puzzle', emoji: '🧩',
      text: 'Giulia was looking | for her path in life. / She did hundreds of math exercises | and practiced the clarinet every day. / But what she loved most | was doing puzzles. / Piece by piece, | she became an expert | at making mosaics. / One day, | she will make a giant mosaic | with the tiles of her own kitchen!',
      spec: 'CLn:H+dur+ben PP:BEN CLn:H+act+tr AND:vp NP:O VP:O+was ADV CL2+m+act PP:LOC ADV CL2+m+act+tr PP:INSTR' },
    { id: 'gfair', title: 'The Village Fair', emoji: '💃',
      text: 'Giulia and her friends | went to a village fair. / Everybody wore old historical costumes, | and the music was old too. / But Giulia brought | youth and energy. / She started to dance, | and soon all the young people danced with her. / In no time, | she knew every folk dance | like a pro!',
      spec: 'NP:H+pl VP:H CLc:H AND:cl V:brought OBJ:THING CLc:H+act AND:cl ADV CL2+m+act+tr PP:LIKE' },
    { id: 'gbetter', title: 'The Better', emoji: '💪',
      text: 'Giulia decided | to become a better version of herself. / She worked out | and started a healthy diet. / Every morning, | she shook her hands and feet | to wake up her body. / Every night, | one minute before midnight, | she did her Spanish lesson on Duolingo. / She never missed a day. / Her streak was over 300 days. ¡Increíble!',
      spec: 'VI INF CLn:H+act AND:vp ADV CL2+m+act+tr INF ADV ADV2 CL2 S S' },
    { id: 'gfriends', title: 'Dancing', emoji: '🫶',
      text: 'After many years, | Giulia broke up with her ex | and felt alone in the city. / Then she met | two special new friends. / Together, | they built a little community. / Soon everybody in Foggia | wanted to be their friend. / Even in Rome or abroad, | strangers saw them and asked to dance!',
      spec: 'ADV CL2+m+act AND:vp V:met OBJ:THINGPL ADV CL2 NP:H VP:H ADV CL2' },
    { id: 'gcareer', title: 'A New Life', emoji: '🪡',
      text: 'Giulia and a friend | started a special project. / They took old scraps of fabric | that people threw away | and gave them a new life. / Giulia gave a new life | to immigrants too | by teaching them to sew. / And she gave a new life to me | when she taught me | to love a friend like this.',
      spec: 'NP:H+pl VP:H CLn:H+act+tr+rel REL+m AND:vp CLn:H+act+tr+di PP:TO+m+act+tr PP:INSTR CLn:H+act+tr PP:BEF+m+act INF' },
    { id: 'gtravel', title: 'Around', emoji: '🌍',
      text: 'Giulia and her friends traveled the world. / In Morocco, | they risked their lives | in a taxi in the pouring rain. / Then they ran and jumped | in the mud | in their underwear! / In Ireland, | they risked their lives again | petting the cows. / In Sri Lanka, | they meditated at the feet of a giant Buddha.',
      spec: 'S ADV CL2+m+act+tr PP:LOC CLn:H+act+mot PP:LOC+m+act PP:WITH ADV CL2+m+act+tr PP:WITH ADV CL2' },
    { id: 'gclarinet', title: 'The Secret', emoji: '🎶',
      text: 'Giulia played the clarinet beautifully, | but nobody knew. / She was too shy | to play in front of people. / One day, | she finally believed in herself | and entered the big competition for teachers. / She played her best | and won! / Today, | she is a wonderful music teacher.',
      spec: 'CLc:H+act BUT CLn:H+act INF ADV CL2+m+act AND:vp CLn:H+act AND:vp ADV CL2' },
    { id: 'gfun', title: 'Never Too Serious', emoji: '🤪',
      text: 'Giulia never took life | too seriously. / She loved | to talk about poop and feet. / She sniffed bad smells | on purpose | and laughed out loud. / She even spat cherry pits | into people’s mouths! / Being with her | was always magical | and so much fun.',
      spec: 'CLn:H+act+tr PP:LIKE VI INF CLn:H+act+tr PP:LOC+m+act AND:vp CLn:H+act+tr+mot PP:DIR NP:O VP:O+was+m AND:cl' },
  ];

  // the stories of the deck, in the order of the page. 'gcar' (Nobody’s Little Goat) and 'gfair' (The Village Fair) are written but not in the deck.
  const ORDER = ['gschool', 'gfun', 'gmosaic', 'gfive', 'groad', 'gclimb', 'gfriends', 'gtravel', 'gcareer', 'gbear', 'gbetter', 'gclarinet'];
  window.GIULIA_IDS = ORDER.slice();
  window.GIULIA_STORIES = [];       // for her page (index.html#giulia); they are put in STORIES only inside her game, so they never show in the normal pages
  ORDER.map(id => G.find(c => c.id === id)).forEach(c => {
    const halves = c.text.split(' / ').flatMap(x => x.split(' | ')).map(s => s.trim());
    if (halves.length !== 11 && halves.length !== 12) console.error('giulia.js:', c.id, 'has', halves.length, 'cards (it needs 11 or 12)');
    const st = {
      id: c.id, title: c.title, emoji: c.emoji, source: { book: BOOK, author: AUTHOR },
      lines: halves, sets: { hard: halves, medium: halves, easy: halves }, specStr: c.spec,
      secret: true, full: c.text.replace(/ \/ /g, ' ').replace(/ \| /g, ' '),
    };
    window.GIULIA_STORIES.push(st);
    if (inGame) STORIES.push(st);
  });
})();
