/**
 * SOLITERARY - the secret deck for Giulia's birthday (loaded after chapters.js, before catalog.js).
 * The stories are added to STORIES ONLY when the page is opened with  index.html#giulia  or  game.html?deck=giulia,
 * so nobody else sees them in Categories, random games or the weekly challenge.
 * Same format as chapters.js: text = sentences separated by " / ", cards separated by " | " (10 cards); spec = one grammar token per card.
 */
(() => {
  const active = location.hash === '#giulia' || new URLSearchParams(location.search).get('deck') === 'giulia';
  // the secret page appears only by its link: if the link is typed in a page that is already open, load again with the deck
  window.addEventListener('hashchange', () => { if (!active && location.hash === '#giulia') location.reload(); });
  window.GIULIA_ACTIVE = active;
  if (!active) return;

  window.EXTRA_NAMES = (window.EXTRA_NAMES || []).concat(['Giulia', 'Marco', 'Elena']);
  const BOOK = 'For Giulia', AUTHOR = 'Giulia’s birthday deck';
  const G = [
    { id: 'gschool', title: 'The Rainbow Student', emoji: '🌈',
      text: 'Giulia started high school | at the hardest science school. / Her English teacher was very grumpy, | and her classmates only worried about grades. / Every morning, | Giulia walked in | wearing bright colors and SpongeBob! / Slowly, | the gray classroom filled with color, | and some classmates even became friends.',
      spec: 'CLn:H+act+tr PP:LOC CLc:H AND:cl ADV CL2+m+act PP:WITH ADV CL2+m AND:cl' },
    { id: 'gcar', title: 'Nobody’s Little Goat', emoji: '🐐',
      text: 'One night, | Giulia and her fling parked in a dark street. / They kissed for a long time, | and he felt lucky to be with such a beauty. / He tried his best moves | and held her by the wrists. / Then he pressed her face against the car seat. / “What is this guy doing??!” Giulia thought. / She gave him a sharp look and said, | “I am nobody’s sacrificial goat, I am the boss!”',
      spec: 'ADV CL2 CLc:H+act AND:cl CLn:H+act+tr AND:vp S S V:said QUOTE' },
    { id: 'gbear', title: 'The Poet with Sharp Teeth', emoji: '🐻',
      text: 'A big man dressed like a professor | pretended to know history and poetry. / Every night, | he wrote Giulia a sweet poem. / One evening, | Giulia saw sharp teeth | in his grin. / He was really a hungry bear, | and he wanted her for dinner! / Giulia grabbed her bag and ran away fast!',
      spec: 'NP:H VP:HW ADV CL2 ADV CL2+m+act+tr PP:LOC CLc:H AND:cl S' },
    { id: 'gfive', title: 'Five Summers', emoji: '🏖️',
      text: 'Giulia dated Marco | for five years. / On every vacation, | Marco walked away | to take photos of birds. / Giulia waited by the pool | and read another book. / She never complained, but she felt lonely. / In the fifth summer, | she went on vacation alone.',
      spec: 'CLn:H+act+tr+dur PP:DUR ADV CL2+m+act+mot INF CLn:H+act AND:vp S ADV CL2' },
    { id: 'groad', title: 'The Question on the Road', emoji: '🚗',
      text: 'On Saturday, | Giulia drove to the sea. / A friendly girl called Elena | shared the ride. / Elena asked, | “Are you in love with a man or a woman?” / Giulia laughed out loud, | but she was not angry. / Everybody asked her the same thing! / The two girls sang all the way to the beach.',
      spec: 'ADV CL2 NP:H VP:HW V:said QUOTE CLc:H BUT S S' },
    { id: 'gclimb', title: 'The Sweaty Climber', emoji: '🧗',
      text: 'On Sunday, | Giulia tied the rope to her waist. / Her hands sweated a lot, | so she used more chalk. / Slowly, | she climbed the wall | with her wet fingers. / Her foot slipped, but she held on! / At the top, | she found hundreds of tiny fossils!',
      spec: 'ADV CL2 CLc:B SO ADV CL2+m+act+tr PP:WITH S ADV CL2' },
  ];

  window.GIULIA_IDS = G.map(c => c.id);
  G.forEach(c => {
    const halves = c.text.split(' / ').flatMap(x => x.split(' | ')).map(s => s.trim());
    if (halves.length !== 10) console.error('giulia.js:', c.id, 'has', halves.length, 'cards');
    STORIES.push({
      id: c.id, title: c.title, emoji: c.emoji, source: { book: BOOK, author: AUTHOR },
      lines: halves, sets: { hard: halves, medium: halves, easy: halves }, specStr: c.spec,
      secret: true, full: c.text.replace(/ \/ /g, ' ').replace(/ \| /g, ' '),
    });
  });
})();
