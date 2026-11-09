/**
 * SOLITERARY - stories inspired by famous books and tales (loaded after levels.js, before grammar.js).
 * They join the other stories: every deal takes 4 at random. When the pupils read the story they get a line that sends them to the original.
 * To add one: copy a block. text = short sentences of 1 to 4 cards, cut with " | " (sentences separated by " / "), 10 cards in all.
 * spec = the 10 grammar tokens, see grammar.js (use X for a half that does not fit with anything else).
 * Write them in your own words (short summary of the plot, past simple, American English).
 */
(() => {
  // first words of a card that are the name of a person (a capital letter is allowed after a comma): see grammar.js
  window.EXTRA_NAMES = ['Humpty', 'Tweedledum', 'Macbeth', 'Lady', 'Hamlet', 'Caesar', 'Mark', 'Puck', 'Prospero', 'Jim', 'Wendy', 'Tinker', 'Dorothy', 'Mowgli', 'Victor', 'Aunt'];
  const CLASSICS = [
    // ---- Oscar Wilde
    { id: 'prince', title: 'The Happy Prince', emoji: '💎', book: 'The Happy Prince', author: 'Oscar Wilde',
      text: 'The golden statue of a prince | stood high above the city. / One night, | a little swallow stopped | to rest at his feet. / The prince | saw the hungry people of the city | and started to cry. / The swallow flew across the city | and gave the prince’s jewels to the poor.',
      spec: 'NP:O VP:HAWO ADV CL2+m+act INF NP:H VP:HW+m+act+tr AND:vp CLn:A+act+mot AND:vp' },
    { id: 'giant', title: 'The Selfish Giant', emoji: '🌳', book: 'The Selfish Giant', author: 'Oscar Wilde',
      text: 'A selfish giant | built a high wall around his garden. / The children couldn’t play there, | and winter never left the garden. / One morning, | the giant heard a bird singing | and saw that the children were back! / Spring came back with them. / The giant realized how selfish he was | and knocked down the wall.',
      spec: 'NP:H VP:HW CLc:H AND:cl ADV CL2+m+act+tr AND:vp S CLn:H+act+tr AND:vp' },
    { id: 'canterville', title: 'The Canterville Ghost', emoji: '🏰', book: 'The Canterville Ghost', author: 'Oscar Wilde',
      text: 'An American family | bought a castle with a ghost in it. / Every night, | the ghost rattled his chains to scare them. / But the father came out | in his slippers | and offered him oil for his chains. / They even cleaned his old blood stain | with a cheap detergent. / Useless and sad, the ghost retired into the wall.',
      spec: 'NP:H VP:H ADV CL2 CLn:H+act+mot PP:LOC+m+act AND:vp CLn:H+act+tr PP:INSTR S' },
    { id: 'nightingale', title: 'The Nightingale and the Rose', emoji: '🌹', book: 'The Nightingale and the Rose', author: 'Oscar Wilde',
      text: 'A student loved a girl | who wanted a red rose. / There were no red roses in his garden | and he was desperate. / A nightingale decided to help | and sang all night | with a thorn in her heart. / Her blood turned a white rose red. / But the girl refused the rose | and he threw it in the street.',
      spec: 'CLn:H+act+tr+rel REL CLn:O AND:cl CLn:A+act AND:vp+m+act+dur PP:WITH S CLn:H+act+tr AND:cl' },
    { id: 'dorian', title: 'The Magic Portrait', emoji: '🖼️', book: 'The Picture of Dorian Gray', author: 'Oscar Wilde',
      text: 'A handsome young man | had his portrait painted. / He wanted the painting | to grow old instead of him. / His wish came true. / He did terrible things for years, | but his face stayed young. / The face in the painting | became old and cruel, | so he locked it in a dark attic.',
      spec: 'NP:H VP:H VI INF S CLc:H+act BUT NP:O VP:HO+m SO' },
    // ---- Edgar Allan Poe
    { id: 'telltale', title: 'The Beating Heart', emoji: '❤️', book: 'The Tell-Tale Heart', author: 'Edgar Allan Poe',
      text: 'A young man lived with an old man | who had a pale blue eye like a vulture’s. / He hated that eye, | so for seven nights he watched the old man sleep. / On the eighth night, | he killed him | and hid the body under the floor. / When the police came, | he sat right above the body | and heard a heart beating under the floor.',
      spec: 'CLn:H+act+rel REL CLc:H SO ADV CL2+m+act+tr AND:vp ADV CL2+m+act AND:vp' },
    { id: 'raven', title: 'The Midnight Visitor', emoji: '🌙', book: 'The Raven', author: 'Edgar Allan Poe',
      text: 'At midnight, | a sad man sat alone with his old books. / He could not forget his lost love, Lenore. / Suddenly, | he heard a soft tapping | at the window. / A black raven flew in | and sat on a statue above the door. / “Will I see Lenore again?” he asked. / “Nevermore,” said the raven.',
      spec: 'ADV CL2 S ADV CL2+m+act PP:LOC CLn:A+act+mot AND:vp S S' },
    { id: 'cask', title: 'The Wine Cellar', emoji: '🍷', book: 'The Cask of Amontillado', author: 'Edgar Allan Poe',
      text: 'Fortunato insulted Montresor, | so Montresor made a secret plan. / At the carnival, | he invited Fortunato | to taste a rare wine in his cellar. / Fortunato was drunk | and followed him into the dark. / Deep underground, | Montresor chained him to the rock | and built a brick wall in front of him.',
      spec: 'CLc:H+act+tr SO ADV CL2+m+act+tr INF CLn:H AND:vp ADV CL2+m+act+tr AND:vp' },
    { id: 'goldbug', title: 'The Golden Bug', emoji: '🪲', book: 'The Gold-Bug', author: 'Edgar Allan Poe',
      text: 'A strange man named Legrand | found a golden bug | and picked up an old piece of paper. / When he held the paper near the fire, | a secret code appeared. / The code led him to a skull | high up in a tree. / His servant dropped the bug through its eye. / They dug where it landed | and found a chest full of gold.',
      spec: 'NP:H VP:H+m+act+tr AND:vp ADV CL2 CLn:O+act PP:LOC S CLn:H+act+tr AND:vp' },
    // ---- other classics
    { id: 'christmas', title: 'The Grumpy Old Man', emoji: '🎄', book: 'A Christmas Carol', author: 'Charles Dickens',
      text: 'Old Scrooge hated Christmas | and loved only money. / On Christmas Eve, | three spirits visited him | and showed him his past, present and future. / He saw his own lonely grave, | and nobody cried for him. / The next morning, | Scrooge woke up happy | and gave gifts to everyone.',
      spec: 'CLn:H+act+tr AND:vp ADV CL2+m+act+tr AND:vp CLc:H+act+tr AND:cl ADV CL2+m+act AND:vp' },
    { id: 'jekyll', title: 'The Strange Potion', emoji: '🧪', book: 'Strange Case of Dr Jekyll and Mr Hyde', author: 'Robert Louis Stevenson',
      text: 'Kind Doctor Jekyll | invented a strange potion. / When he drank it, | he became the cruel Mister Hyde. / At night, | Hyde walked through London | and hurt people. / One morning, | Doctor Jekyll woke up | with Hyde’s hairy hands!',
      spec: 'NP:H VP:H ADV CL2 ADV CL2+m+act+mot AND:vp ADV CL2+m+act PP:WITH' },
    { id: 'hound', title: 'The Hound on the Moor', emoji: '🐕', book: 'The Hound of the Baskervilles', author: 'Arthur Conan Doyle',
      text: 'An old legend | said a giant hound lived on the moor. / Sir Henry | came to the old house there, | and Holmes and Watson watched over him. / One foggy night, | a huge hound ran out of the dark | with fire around its mouth. / Holmes shot it, | and it was only a big dog with glowing paint.',
      spec: 'NP:W VP:HW NP:H VP:H+m+act+mot AND:cl ADV CL2+m+act+mot PP:WITH CLc:H+act+tr AND:cl' },
    // ---- Alice, chapter by chapter (the stories do not have to end: one chapter is enough)
    { id: 'rabbit', title: 'Down the Rabbit Hole', emoji: '🐇', book: 'Alice’s Adventures in Wonderland, chapter 1', author: 'Lewis Carroll',
      text: 'Alice was bored | on the riverbank. / Suddenly, | a white rabbit ran past | with a watch in its hand. / Alice followed it | and fell down a deep hole. / At the bottom, | she found a tiny door. / A label on a bottle said, “Drink me!”',
      spec: 'CLn:H+dur PP:LOC ADV CL2+m+act+mot PP:WITH CLn:H+act+tr AND:vp ADV CL2 S' },
    { id: 'teaparty', title: 'The Tea That Never Ends', emoji: '🫖', book: 'Alice’s Adventures in Wonderland, chapter 7', author: 'Lewis Carroll',
      text: 'Alice found a long table | under a big tree. / The Mad Hatter and the March Hare | were having tea | with a sleepy mouse. / They asked her a riddle, | but nobody knew the answer. / It was always six o’clock, | so tea never ended. / Tired of the nonsense, Alice walked away.',
      spec: 'CLn:H+act+tr PP:LOC NP:H+pl VP:HAW+were+m+act PP:WITH CLc:H BUT CLc:O SO S' },
    { id: 'croquet', title: 'The Queen’s Garden', emoji: '👑', book: 'Alice’s Adventures in Wonderland, chapter 8', author: 'Lewis Carroll',
      text: 'In the garden, | Alice saw gardeners | painting white roses red. / The Queen hated white roses, | so they were terrified. / She played croquet | with live flamingos. / The game had no rules. / The Queen shouted at everyone, | “Off with their heads!”',
      spec: 'ADV CL2+m+act+tr PP:MOD CLc:H SO CLn:H+act+tr PP:INSTR S V:said QUOTE' },
    { id: 'mirror', title: 'Through the Mirror', emoji: '🪞', book: 'Through the Looking-Glass, chapter 1', author: 'Lewis Carroll',
      text: 'Alice climbed up | and looked at the mirror | above the fireplace. / Suddenly, | the glass became soft like mist. / She stepped through it | and found a strange room. / The words in a book | were written backwards, | so she read them in the mirror.',
      spec: 'CLn:H+act+mot AND:vp+m+act+tr PP:LOC ADV CL2 CLn:H+act+tr+mot AND:vp NP:O+pl VP:O+were+m SO' },
    { id: 'tweedle', title: 'The Two Little Men', emoji: '🎶', book: 'Through the Looking-Glass, chapter 4', author: 'Lewis Carroll',
      text: 'Alice met two round little men | in the forest. / Tweedledum and Tweedledee | sang her a very long song. / Then they found a broken rattle | and decided to fight. / Suddenly, | a huge black crow appeared, | and they ran away. / Alice was left alone in the forest.',
      spec: 'CLn:H+act+tr PP:LOC NP:H+pl VP:HAW CLn:H+act+tr AND:vp ADV CL2+m AND:cl S' },
    { id: 'humpty', title: 'The Egg on the Wall', emoji: '🥚', book: 'Through the Looking-Glass, chapter 6', author: 'Lewis Carroll',
      text: 'Alice saw a big egg | on a high wall. / The egg was Humpty Dumpty, | and he was very proud. / He said that words | meant whatever he wanted. / Alice said goodbye | and walked away. / Suddenly, | a huge crash shook the forest.',
      spec: 'CLn:H+act+tr PP:LOC CLc:O AND:cl NP:O+pl VP:O CLn:H+act AND:vp ADV CL2' },
    // ---- William Shakespeare (tragedies and comedies, a chapter of the play when it is long)
    { id: 'witches', title: 'The Three Witches', emoji: '🔮', book: 'Macbeth', author: 'William Shakespeare',
      text: 'On a stormy heath, | three witches met Macbeth. / “You will be king!” they said. / Macbeth told his wife, | and she made a cruel plan. / That night, | Macbeth crept into the king’s room | and killed him in his sleep. / Soon Macbeth became king, | but he never slept in peace again.',
      spec: 'ADV CL2 S CLc:H AND:cl ADV CL2+m+act+mot AND:vp CLc:H BUT' },
    { id: 'sleepwalk', title: 'The Sleepwalking Queen', emoji: '🌲', book: 'Macbeth', author: 'William Shakespeare',
      text: 'Every night, | Lady Macbeth walked in her sleep | with a candle in her hand. / She could not forget the king’s murder. / She washed her hands again and again, | but she still saw blood on them. / “The blood won’t go away!” she cried. / A doctor and a servant | watched her | and wrote everything down.',
      spec: 'ADV CL2+m+act PP:WITH S CLc:H+act+tr BUT S NP:H+pl VP:H+m+act+tr AND:vp' },
    { id: 'hamlet', title: 'The Ghost of the King', emoji: '💀', book: 'Hamlet', author: 'William Shakespeare',
      text: 'At midnight, | a ghost appeared | on the castle wall. / “I am your father,” it told Prince Hamlet. / “Your uncle killed me and became king!” / Hamlet pretended to be mad | to find the truth. / He asked some actors | to act out the murder, | and the king ran out in fear.',
      spec: 'ADV CL2+m+act+mot PP:LOC S S CLn:H+act INF CLn:H+act+tr INF+m+act AND:cl' },
    { id: 'caesar', title: 'A Warning in Rome', emoji: '🏛️', book: 'Julius Caesar', author: 'William Shakespeare',
      text: 'A fortune-teller warned Caesar | to be careful on March 15. / On that day, | he ignored the warning | and went to the Senate. / There, | the senators surrounded him | with knives. / He saw his friend Brutus among them | and said sadly, “You too, Brutus?”',
      spec: 'CLn:H+act+tr INF ADV CL2+m+act+tr AND:vp ADV CL2+m+act+tr PP:WITH CLn:H+act+tr AND:vp' },
    { id: 'midsummer', title: 'The Magic Forest', emoji: '🧚', book: 'A Midsummer Night’s Dream', author: 'William Shakespeare',
      text: 'Four young lovers | ran away | into a magic forest. / A playful fairy named Puck | had a magic juice. / It made people fall in love | with the first person they saw. / Puck used it on the wrong man, | so both boys loved the same girl. / Everybody was confused.',
      spec: 'NP:H+pl VP:HAW+m+act+mot PP:DIR NP:W VP:HW CLn:O+act PP:WITH CLc:W+act+tr SO S' },
    { id: 'twelfth', title: 'A Girl Dressed as a Boy', emoji: '🎭', book: 'Twelfth Night', author: 'William Shakespeare',
      text: 'A shipwreck | threw Viola onto a strange shore. / She dressed as a boy | and became the servant of a Duke. / The Duke loved a rich countess | and sent his new servant | to speak to her. / But the countess fell in love with the servant! / Viola secretly loved the Duke, | and nobody knew the truth.',
      spec: 'NP:O VP:HWO CLn:H+act AND:vp CLn:H+act+tr AND:vp+m+act+tr INF S CLc:H AND:cl' },
    { id: 'tempest', title: 'The Island Magician', emoji: '🌊', book: 'The Tempest', author: 'William Shakespeare',
      text: 'A magician named Prospero | lived on a lonely island | with his daughter, Miranda. / Years ago, | his evil brother stole his kingdom. / One day, | his brother sailed near the island, | so Prospero called up a terrible storm. / His enemies swam to the shore, | but Prospero forgave them.',
      spec: 'NP:H VP:HAW+m+act PP:WITH ADV CL2 ADV CL2+m+act+mot SO CLc:H+act+mot BUT' },
    // ---- more classics
    { id: 'treasureisland', title: 'The Old Sailor’s Chest', emoji: '🏴‍☠️', book: 'Treasure Island', author: 'Robert Louis Stevenson',
      text: 'A mysterious old sailor | came to stay | at Jim’s inn. / When he died, | Jim opened his chest | and found a treasure map. / Jim and his friends | sailed away to find the treasure. / One night, inside an apple barrel, | Jim heard that the ship’s cook was a pirate!',
      spec: 'NP:H VP:H+m+act+mot PP:LOC ADV CL2+m+act+tr AND:vp NP:H+pl VP:H ADV CL2' },
    { id: 'peterpan', title: 'The Boy Who Flew', emoji: '⭐', book: 'Peter Pan', author: 'J. M. Barrie',
      text: 'One night, | a boy flew into Wendy’s bedroom | to look for his lost shadow. / His name was Peter Pan. / Wendy sewed his shadow back on | with a needle. / A tiny fairy named Tinker Bell | sprinkled fairy dust on Wendy and her brothers. / They flew over London | and found Neverland, where nobody ever grew up.',
      spec: 'ADV CL2+m+act+mot INF S CLn:H+act+tr PP:INSTR NP:W VP:HW CLn:H+act+mot AND:vp' },
    { id: 'oz', title: 'The Yellow Road', emoji: '🌪️', book: 'The Wonderful Wizard of Oz', author: 'L. Frank Baum',
      text: 'A big tornado | lifted Dorothy’s house | into the sky. / It landed in a colorful land | far from her home in Kansas. / To go back, | she followed a yellow road | to the Wizard of Oz. / On the road, | she met a scarecrow, a tin man and a lion.',
      spec: 'NP:O VP:HWO+m+act+tr+mot PP:DIR CLn:O+mot PP:LOC ADV CL2+m+act+mot PP:DIR ADV CL2' },
    { id: 'mowgli', title: 'The Boy and the Wolves', emoji: '🐅', book: 'The Jungle Book', author: 'Rudyard Kipling',
      text: 'A tiger named Shere Khan | chased a baby boy | into the jungle. / A wolf family | found him and named him Mowgli. / He grew up with the wolves, | but the tiger still wanted to eat him. / One night, | Mowgli took a burning branch | and the tiger ran away in fear.',
      spec: 'NP:A VP:HAW+m+act+tr+mot PP:DIR NP:A VP:HAW CLc:H BUT ADV CL2+m+act+tr AND:cl' },
    { id: 'gulliver', title: 'The Tiny People', emoji: '🏝️', book: 'Gulliver’s Travels', author: 'Jonathan Swift',
      text: 'A shipwreck | left Gulliver on a strange beach. / He woke up | and could not move. / Hundreds of tiny ropes | tied his body | to the ground. / He looked down | and saw a man six inches tall | standing on his chest!',
      spec: 'NP:O VP:HWO CLn:H AND:vp NP:O+pl VP:O+m+act+tr PP:LOC CLn:H+act AND:vp+m+act PP:LOC' },
    { id: 'frankenstein', title: 'The Lonely Creature', emoji: '⚡', book: 'Frankenstein', author: 'Mary Shelley',
      text: 'A young scientist named Victor | built a creature | from dead bodies. / One stormy night, | it opened its yellow eyes. / Victor was terrified | and ran away. / The creature wandered the world alone, | and everyone was afraid of it. / It only wanted a friend.',
      spec: 'NP:H VP:HW+m+act+tr PP:INSTR ADV CL2 CLn:H AND:vp CLc:A+act AND:cl S' },
    { id: 'fence', title: 'The Painted Fence', emoji: '🎨', book: 'The Adventures of Tom Sawyer', author: 'Mark Twain',
      text: 'Aunt Polly punished Tom | and told him to paint a long fence. / Tom hated work, | so he pretended to love painting. / Soon his friends begged him | to let them try | and even gave him their toys. / In the end, | Tom sat in the shade | while his friends painted the fence.',
      spec: 'CLn:H+act+tr AND:vp CLc:H SO CLn:H+act+tr INF+m+act AND:vp ADV CL2+m+act PP:BEF' },
    { id: 'crusoe', title: 'Alone on the Island', emoji: '🦜', book: 'Robinson Crusoe', author: 'Daniel Defoe',
      text: 'A storm sank Robinson Crusoe’s ship, | and he alone reached a lonely island. / He built a hut | and taught a parrot | to say his name. / For years, | he saw nobody. / Then one day, | he found a strange footprint | in the sand.',
      spec: 'CLc:O AND:cl CLn:H+act+tr AND:vp+m+act+tr INF ADV CL2 ADV CL2+m+act+tr PP:LOC' },
  ];

  CLASSICS.forEach(c => {
    const halves = c.text.split(' / ').flatMap(x => x.split(' | ')).map(s => s.trim());
    if (halves.length !== 10) console.error('classics.js:', c.id, 'has', halves.length, 'cards');
    STORIES.push({
      id: c.id, title: c.title, emoji: c.emoji, source: { book: c.book, author: c.author },
      lines: halves, sets: { hard: halves, medium: halves, easy: halves }, specStr: c.spec,
    });
  });
})();
