/**
 * SOLITERARY - the three levels of every story (loaded after stories.js).
 *   hard   = stories.js: 10 whole sentences, one per card.
 *   medium = 5 short sentences, every sentence cut in two halves with " | " -> 10 cards. Sentences are separated by " / ".
 *   easy   = one sentence cut in 10 pieces of 1-2 words, separated by " | ".
 * Always exactly 10 cards per story. In "easy" no two pieces of a story may be the same, and the sentence must have only one possible order.
 */
(() => {
  const L = {
    dragon: ['A little | dragon lived alone in a cave. / One day he was hungry, | so he flew to the village. / The people ran away, | but a girl gave him a pie. / He baked bread | for everybody in town. / From then on, | the dragon had many friends.'],
    phone: ['On Monday, Lucas | couldn’t find his phone. / He looked in his bag, | but it wasn’t there. / His sister said, | “I hear it in the yard!” / The ringing came | from the doghouse. / The dog Rocky | was sleeping on the phone.'],
    ghost: ['Four friends slept | in an old house. / At night, they heard | a strange noise upstairs. / They ran away | and screamed in the kitchen. / Then they found | a tiny kitten behind the fridge. / They named it Boo | and took it home.'],
    birthday: ['On her birthday, | nobody said a word to Sara. / She felt sad | and went for a walk. / When she came home, | the house was dark. / She turned on the light | and everybody shouted, “Surprise!” / She blew out the candles | and made a wish.'],
    space: ['Captain Zara | flew to Mars. / A red light blinked, | and the oxygen was running out. / She closed a tiny hole | with her chewing gum. / After three months, | the rocket landed on Mars. / Zara planted a flag | and took a selfie.'],
    cook: ['Tom wanted | to cook dinner for Grandma. / He put the pasta on the stove | and watched TV. / Soon the kitchen | was full of smoke. / Grandma arrived | and laughed at him. / They ordered a pizza | and ate it together.'],
    cat: ['Oscar was a cat | who slept all day. / One afternoon, | he smelled fresh fish. / The table was high, | so he pushed a chair. / He climbed up | and ate the whole fish. / Then he was so full | that he slept again.'],
    treasure: ['Ella found | an old map in the attic. / The next day, | she went to the lake with her brother Ben. / They dug a hole | and found a metal box. / Inside there were | coins and a letter. / They went home | and showed everything to Mom.'],
    student: ['A new student named Kenji | arrived at school. / He was very shy, | so nobody talked to him. / At lunch, Anna | sat next to him. / They played cards | and the others joined them. / By Friday, | Kenji had ten friends.'],
    sneakers: ['Leo hated running, | but he found golden sneakers. / He bought them | and put them on. / Suddenly, his feet | ran faster than a car! / He arrived at school | before the teacher. / Out of breath, | Leo fell asleep on the grass.'],
    museum: ['At midnight, | a painting disappeared. / Detective Rosa found | muddy footprints near the window. / They led her | to a small house. / A man in socks | opened the door. / The painting | was on his living room wall.'],
    singer: ['Nina loved singing, | but she was shy. / Her friend wrote her name | on the talent show list. / On the night, | her hands were shaking. / She closed her eyes | and began to sing. / Everybody clapped | and she won first prize.'],
    camping: ['Dan and his dad | went camping in the mountains. / They made a fire | and cooked hot dogs. / At night, Dan | heard a loud noise. / A raccoon | ran away with a hot dog. / The next morning, | they found tiny footprints.'],
    time: ['Professor Gray | built a time machine. / His grandson Max | pushed the red button. / Suddenly, he saw | a huge dinosaur. / The dinosaur | only wanted to play. / At sunset, Max | pressed the green button and went home.'],
    train: ['Maria took a train | to visit her aunt. / She fell asleep, | and the train went too far. / She woke up | in Venice. / Her aunt took | a fast train to meet her. / They ate ice cream | by the canals.'],
    hamster: ['Emma got | a hamster named Peanut for her birthday. / One night, | the cage was empty. / She looked everywhere | and heard a tiny sound. / Peanut was | inside the cereal box. / She put him in the cage, | but he escaped again.'],
    snow: ['It snowed | all night long. / In the morning, | there was no school. / Zoe and her brother | built a giant snowman. / Then they drank | hot chocolate by the fire. / The next day, | the snowman melted.'],
    fishing: ['Grandpa Joe | took Nick fishing. / They waited | for an hour. / Suddenly, the rod | bent in Nick’s hands. / They pulled out | a big old boot. / They laughed | and took it home.'],
    soccer: ['It was the last minute | of the final. / Dylan ran | past two defenders with the ball. / Just before the goal, | he slipped and fell. / The ball rolled | into the net. / His team lifted him | in the air.'],
    library: ['Lily found | a golden book. / When she opened it, | a tiny wizard jumped out. / He thanked her | and made the books fly. / The librarian | saw them and fainted. / The wizard | went home in Lily’s backpack.'],
  };

  // easy: every piece has its kind of word after a colon (first>last when a two-word piece changes kind):
  // D = a/the/his/one (determiner), A = adjective, N = noun or name, V = verb, P = preposition/particle, C = and/but/so, R = adverb
  const EASY = {
    dragon: 'Once:R | upon a:P>D | time,:N | a little:D>A | dragon:N | lived:V | in:P | a cave:D>N | and:C | cried.:V',
    phone: 'On Monday,:P>N | Lucas:N | lost:V | his phone:D>N | and:C | looked:V | everywhere:R | for:P | it:N | today.:R',
    ghost: 'Four:D | friends:N | slept:V | in:P | an old:D>A | house:N | and:C | heard:V | strange:A | noises.:N',
    birthday: 'On Saturday,:P>N | Sara:N | blew:V | out:P | sixteen:D | candles:N | and:C | made:V | a:D | wish.:N',
    space: 'Captain:D | Zara:N | flew:V | to:P | Mars:N | in:P | a:D | small:A | red:A | rocket.:N',
    cook: 'Tom:N | cooked:V | pasta:N | for:P | his:D | grandmother:N | but:C | burned:V | the:D | dinner.:N',
    cat: 'Oscar:N | the:D | lazy:A | cat:N | slept:V | all:D | day:N | on:P | a:D | sofa.:N',
    treasure: 'Ella:N | and:C | Ben:N | dug:V | a:D | deep:A | hole:N | near:P | the:D | lake.:N',
    student: 'The:D | new:A | student:N | was:V | very:R | shy:A | at:P | his:D | first:A | lunch.:N',
    sneakers: 'Leo:N | put:V | on:P | golden:A | sneakers:N | and:C | ran:V | very:R | fast:R | home.:R',
    museum: 'Detective:D | Rosa:N | followed:V | muddy:A | footprints:N | to:P | a:D | small:A | green:A | house.:N',
    singer: 'Nina:N | was:V | shy:A | but:C | she:N | sang:V | beautifully:R | on:P | the:D | stage.:N',
    camping: 'Dan:N | and:C | his:D | dad:N | camped:V | near:P | a:D | quiet:A | mountain:N | river.:N',
    time: 'Max:N | pushed:V | the:D | red:A | button:N | and:C | met:V | a:D | huge:A | dinosaur.:N',
    train: 'Maria:N | took:V | the:D | wrong:A | train:N | and:C | woke:V | up:P | in:P | Venice.:N',
    hamster: 'Peanut:N | the:D | tiny:A | hamster:N | escaped:V | from:P | his:D | cage:N | last:A | night.:N',
    snow: 'It:N | snowed:V | all:D | night:N | so:C | there:N | was:V | no:D | school:N | today.:R',
    fishing: 'Grandpa:N | Joe:N | caught:V | an:D | old:A | boot:N | instead:R | of:P | a:D | fish.:N',
    soccer: 'Dylan:N | slipped:V | on:P | wet:A | grass:N | but:C | scored:V | the:D | winning:A | goal.:N',
    library: 'Lily:N | opened:V | one:D | golden:A | book:N | and:C | freed:V | a:D | tiny:A | wizard.:N',
  };
  // which kind of word may stand right before which (easy level: on the columns a piece goes under a piece that can follow it)
  const NEXT = { D: 'AN', A: 'AN', N: 'VPCRN', V: 'DANPR', P: 'DANP', C: 'DANVR', R: 'VARP' };
  const trim = a => a.map(s => s.trim());
  STORIES.forEach(s => {
    const mid = L[s.id][0];
    const parts = EASY[s.id].split(' | ').map(p => { const i = p.lastIndexOf(':'); const t = p.slice(i + 1).split('>'); return { text: p.slice(0, i).trim(), f: t[0], l: t[t.length - 1] }; });
    s.sets = {
      hard: s.lines,
      medium: trim(mid.split(' / ').flatMap(x => x.split(' | '))),
      easy: parts.map(p => p.text),
    };
    s.tags = parts;
    ['medium', 'easy'].forEach(k => { if (s.sets[k].length !== 10) console.error('Story', s.id, k, 'has', s.sets[k].length, 'cards'); });
  });
  /** easy level: can piece x (card number) stand right before piece y? (only for the columns; the story piles are strict) */
  window.easyFits = (games, x, y) => {
    const a = games[(x / 10) | 0].tags[x % 10], b = games[(y / 10) | 0].tags[y % 10];
    if (x % 10 === 9 || y % 10 === 0) return false;          // the last piece ends the sentence, the first one starts it
    return NEXT[a.l].includes(b.f);
  };
})();
