/**
 * SOLITERARY - stories inspired by famous books and tales (loaded after levels.js, before grammar.js).
 * They join the other stories: every deal takes 4 at random. When the pupils read the story they get a line that sends them to the original.
 * To add one: copy a block. text = 5 short sentences, each cut in two halves with " | " (sentences separated by " / "), so 10 cards.
 * spec = the 10 grammar tokens, see grammar.js (use X for a half that does not fit with anything else).
 * Write them in your own words (short summary of the plot, past simple, American English).
 */
(() => {
  // first words of a card that are the name of a person (a capital letter is allowed after a comma): see grammar.js
  window.EXTRA_NAMES = ['Humpty', 'Tweedledum', 'Macbeth', 'Lady', 'Hamlet', 'Caesar', 'Mark', 'Puck', 'Prospero', 'Jim', 'Wendy', 'Tinker', 'Dorothy', 'Mowgli', 'Victor', 'Aunt'];
  const CLASSICS = [
    // ---- Oscar Wilde
    { id: 'prince', title: 'The Happy Prince', emoji: '💎', book: 'The Happy Prince', author: 'Oscar Wilde',
      text: 'A golden statue | stood high above the city. / One night, | a little swallow rested at its feet. / The statue was crying, | so the swallow carried its jewels to the poor. / Winter came | and the swallow froze. / The statue’s heart | broke in two.',
      spec: 'NP:O VP:HAWO ADV CL2 CLc:O SO CLn:O AND:cl NP:O VP:O' },
    { id: 'giant', title: 'The Selfish Giant', emoji: '🌳', book: 'The Selfish Giant', author: 'Oscar Wilde',
      text: 'A selfish giant | built a high wall around his garden. / The children couldn’t play there, | so winter never left the garden. / One morning, | the giant heard a bird singing outside. / The children crept back in, | and the garden turned green again. / The giant knocked down the wall | and played with the children every day.',
      spec: 'NP:H VP:HW CLc:H SO ADV CL2 CLc:H AND:cl CLn:H+act+tr AND:vp' },
    { id: 'canterville', title: 'The Canterville Ghost', emoji: '🏰', book: 'The Canterville Ghost', author: 'Oscar Wilde',
      text: 'An American family | bought an old English castle. / Every night, | the ghost rattled his chains in the hall. / The family wasn’t afraid, | so the ghost felt very sad. / A kind girl named Virginia | listened to his sad story. / She helped him find peace | and the ghost disappeared forever.',
      spec: 'NP:H VP:H ADV CL2 CLc:H SO NP:H VP:HW CLn:H+act AND:cl' },
    { id: 'nightingale', title: 'The Nightingale and the Rose', emoji: '🌹', book: 'The Nightingale and the Rose', author: 'Oscar Wilde',
      text: 'A student wanted | to give a red rose to a girl. / There was only a white rose | in his garden. / A nightingale heard him | and decided to help. / She pressed her heart against a thorn | and her blood turned the white rose red. / The student gave it to the girl, | but she refused it.',
      spec: 'VI INF CLn:O PP:LOC CLn:A+act AND:vp CLn:A+act+tr AND:cl CLc:H BUT' },
    { id: 'dorian', title: 'The Magic Portrait', emoji: '🖼️', book: 'The Picture of Dorian Gray', author: 'Oscar Wilde',
      text: 'A handsome young man | had his portrait painted. / He wished | to stay young forever. / Years passed | but he never got older. / The face in the painting | became old and cruel. / When he saw the painting, | he locked it in a dark attic.',
      spec: 'NP:H VP:H VI INF CLn:O BUT NP:O VP:HO ADV CL2' },
    // ---- Edgar Allan Poe
    { id: 'telltale', title: 'The Beating Heart', emoji: '❤️', book: 'The Tell-Tale Heart', author: 'Edgar Allan Poe',
      text: 'An old man | had a pale blue eye. / His lodger hated it, | so he killed the old man. / Then he hid the body | under the floor. / When the police arrived, | he heard a loud heartbeat. / He thought they heard it too, | so he confessed everything.',
      spec: 'NP:H VP:HAW CLc:H SO CLn:H+act+tr PP:LOC ADV CL2 CLc:H SO' },
    { id: 'raven', title: 'The Midnight Visitor', emoji: '🌙', book: 'The Raven', author: 'Edgar Allan Poe',
      text: 'At midnight, | a sad man sat alone in his room. / He read old books, | but he could not forget his lost love, Lenore. / Suddenly, | a black raven flew in through the window. / The man asked questions, | and the raven answered “Nevermore.” / The raven sat on a statue, | and it never left.',
      spec: 'ADV CL2 CLc:H BUT ADV CL2 CLc:H AND:cl CLc:A AND:cl' },
    { id: 'cask', title: 'The Wine Cellar', emoji: '🍷', book: 'The Cask of Amontillado', author: 'Edgar Allan Poe',
      text: 'Montresor hated Fortunato, | so he made a plan. / He invited him | to taste a rare wine. / They walked | into the dark cellar. / Fortunato was drunk, | so he followed without a word. / At the end, | Montresor built a wall around him and left.',
      spec: 'CLc:H SO CLn:H+act+tr INF CLn:H+act+mot+dur+toh PP:TOHOUSE CLc:H SO ADV CL2' },
    { id: 'goldbug', title: 'The Golden Bug', emoji: '🪲', book: 'The Gold-Bug', author: 'Edgar Allan Poe',
      text: 'A strange man named Legrand | found a golden bug. / He also found a piece of paper | with a secret code. / Legrand solved the code | and followed the clues. / With his servant, | he dug a deep hole by a tree. / Inside the hole, | they found a chest full of gold.',
      spec: 'NP:H VP:H CLn:H+act+tr PP:INSTR CLn:H+act+tr AND:vp ADV CL2 ADV CL2' },
    // ---- other classics
    { id: 'christmas', title: 'The Grumpy Old Man', emoji: '🎄', book: 'A Christmas Carol', author: 'Charles Dickens',
      text: 'Old Scrooge hated Christmas | and loved only money. / On Christmas Eve, | three spirits took him through his past and future. / He saw his own grave, | and nobody cried for him. / He finally understood | that money couldn’t buy love. / The next morning, | Scrooge gave gifts to everyone.',
      spec: 'CLn:H AND:vp ADV CL2 CLc:H AND:cl X X ADV CL2' },
    { id: 'jekyll', title: 'The Strange Potion', emoji: '🧪', book: 'Strange Case of Dr Jekyll and Mr Hyde', author: 'Robert Louis Stevenson',
      text: 'Doctor Jekyll | invented a strange potion. / When he drank it, | he became the cruel Mister Hyde. / At night, | Hyde walked through London and hurt people. / Soon Jekyll | could not change back. / Hyde stayed forever, | and Doctor Jekyll disappeared.',
      spec: 'NP:H VP:H ADV CL2 ADV CL2 NP:H VP:H CLc:H AND:cl' },
    { id: 'hound', title: 'The Hound on the Moor', emoji: '🐕', book: 'The Hound of the Baskervilles', author: 'Arthur Conan Doyle',
      text: 'A deadly legend | said a giant hound haunted the moor. / Sir Henry arrived | at the old house on the moor. / One night, | Holmes and Watson heard a terrible howl. / They followed the footprints | across the dark moor. / The hound was only a dog, | and its master was the real villain.',
      spec: 'NP:W VP:HW CLn:H+act+mot PP:LOC ADV CL2 CLn:H+act+tr+mot PP:LOC CLc:A AND:cl' },
    // ---- Alice, chapter by chapter (the stories do not have to end: one chapter is enough)
    { id: 'rabbit', title: 'Down the Rabbit Hole', emoji: '🐇', book: 'Alice’s Adventures in Wonderland, chapter 1', author: 'Lewis Carroll',
      text: 'Alice was bored | on the riverbank. / A white rabbit | ran past with a watch. / Alice followed it | and fell down a deep hole. / At the bottom, | she found a tiny door. / A label on a bottle said, | “Drink me!”',
      spec: 'CLn:H+dur PP:LOC NP:A VP:HAW CLn:H+act+tr AND:vp ADV CL2 V:said QUOTE' },
    { id: 'teaparty', title: 'The Tea That Never Ends', emoji: '🫖', book: 'Alice’s Adventures in Wonderland, chapter 7', author: 'Lewis Carroll',
      text: 'Alice found a long table | under a big tree. / The Mad Hatter and the March Hare | were having tea. / They asked her riddles, | but nobody knew the answers. / It was always six o’clock, | so tea never ended. / Alice got tired of the nonsense | and walked away.',
      spec: 'CLn:H+act+tr PP:LOC NP:H+pl VP:HAW+were CLc:H BUT CLc:O SO CLn:H+act AND:vp' },
    { id: 'croquet', title: 'The Queen’s Garden', emoji: '👑', book: 'Alice’s Adventures in Wonderland, chapter 8', author: 'Lewis Carroll',
      text: 'In the garden, | Alice saw gardeners painting roses red. / They were afraid of the Queen, | so they hid behind a tree. / The Queen arrived | and everybody bowed. / She played croquet | with flamingos. / The Queen shouted, | “Off with her head!”',
      spec: 'ADV CL2 CLc:H SO CLn:H+act+mot AND:cl CLn:H+act+tr PP:INSTR V:said QUOTE' },
    { id: 'mirror', title: 'Through the Mirror', emoji: '🪞', book: 'Through the Looking-Glass, chapter 1', author: 'Lewis Carroll',
      text: 'Alice looked at the mirror | above the fireplace. / Suddenly, the mirror | became soft like mist. / She stepped through it | and found a strange room. / In that room, | the books had backwards words. / Alice held a poem to the mirror | and read it backwards.',
      spec: 'CLn:H+act+tr PP:LOC NP:O VP:HO CLn:H+act+tr+mot AND:vp ADV CL2 CLn:H+act+tr AND:vp' },
    { id: 'tweedle', title: 'The Two Little Men', emoji: '🎶', book: 'Through the Looking-Glass, chapter 4', author: 'Lewis Carroll',
      text: 'Alice met two round little men | in the forest. / Tweedledum and Tweedledee | sang a long song. / They decided to fight, | but a huge black crow appeared. / The two men were scared, | so they ran away. / Alice laughed | and walked on through the forest.',
      spec: 'CLn:H+act+tr PP:LOC NP:H+pl VP:HAW CLc:H BUT CLc:H SO CLn:H AND:vp' },
    { id: 'humpty', title: 'The Egg on the Wall', emoji: '🥚', book: 'Through the Looking-Glass, chapter 6', author: 'Lewis Carroll',
      text: 'Alice saw a big egg | on a high wall. / The egg was Humpty Dumpty, | and he loved big words. / He was very proud, | so he never listened to Alice. / He explained a strange poem | with long words. / At the end, | the egg fell off the wall.',
      spec: 'CLn:H+act+tr PP:LOC CLc:O AND:cl CLc:H SO CLn:H+act+tr PP:INSTR ADV CL2' },
    // ---- William Shakespeare (tragedies and comedies, a chapter of the play when it is long)
    { id: 'witches', title: 'The Three Witches', emoji: '🔮', book: 'Macbeth', author: 'William Shakespeare',
      text: 'On a stormy heath, | three witches met Macbeth. / The witches said, | “You will be king!” / Macbeth told his wife, | and she made a cruel plan. / That night, | Macbeth killed the king in his sleep. / Soon Macbeth became king, | but he never slept in peace.',
      spec: 'ADV CL2 V:said QUOTE CLc:H AND:cl ADV CL2 CLc:H BUT' },
    { id: 'sleepwalk', title: 'The Sleepwalking Queen', emoji: '🌲', book: 'Macbeth', author: 'William Shakespeare',
      text: 'Lady Macbeth | walked in her sleep. / She washed her hands again and again, | but she still saw blood on them. / A doctor watched her | and wrote everything down. / Later, | an enemy army carried branches to hide itself. / The forest seemed to move, | and Macbeth lost his courage.',
      spec: 'NP:H VP:HW CLc:H BUT CLn:H+act+tr AND:vp ADV CL2 CLc:O AND:cl' },
    { id: 'hamlet', title: 'The Ghost of the King', emoji: '💀', book: 'Hamlet', author: 'William Shakespeare',
      text: 'A ghost appeared | on the castle wall. / It said, | “I am your father.” / The ghost told Prince Hamlet | to find the killer. / Hamlet pretended | to be mad. / He asked some actors | to act out the murder for his uncle, the king.',
      spec: 'CLn:W+act+mot PP:LOC V:said QUOTE CLn:W+act INF VI INF CLn:H+act INF' },
    { id: 'caesar', title: 'A Warning in Rome', emoji: '🏛️', book: 'Julius Caesar', author: 'William Shakespeare',
      text: 'A fortune-teller warned Caesar | to beware the Ides of March. / Caesar went to the Senate | and ignored the warning. / There, | his friend Brutus took out a knife. / Caesar saw Brutus | and said sadly, “You too, Brutus?” / Then the senators attacked him, | and Caesar fell dead.',
      spec: 'CLn:H+act INF CLn:H+act+mot+toh AND:vp ADV CL2 CLn:H+act+tr AND:vp CLc:H AND:cl' },
    { id: 'midsummer', title: 'The Magic Forest', emoji: '🧚', book: 'A Midsummer Night’s Dream', author: 'William Shakespeare',
      text: 'Two young couples | ran into a magic forest. / Puck, a playful fairy, | put magic juice on their eyes. / The wrong people fell in love, | so everybody was confused. / Meanwhile, | an actor named Bottom got the head of a donkey. / The fairy queen | fell in love with the donkey.',
      spec: 'NP:H+pl VP:HAW NP:W VP:HW CLc:H SO ADV CL2 NP:W VP:HW' },
    { id: 'twelfth', title: 'A Girl Dressed as a Boy', emoji: '🎭', book: 'Twelfth Night', author: 'William Shakespeare',
      text: 'A shipwreck | threw Viola onto a strange shore. / She dressed as a boy | and became a servant. / Her master, the Duke, | loved a rich countess. / He sent his servant to her, | but she fell in love with the servant. / Viola secretly loved her master, | and nobody knew the truth.',
      spec: 'NP:O VP:HWO CLn:H+act AND:vp NP:H VP:H CLc:H BUT CLc:H AND:cl' },
    { id: 'tempest', title: 'The Island Magician', emoji: '🌊', book: 'The Tempest', author: 'William Shakespeare',
      text: 'A powerful magician named Prospero | lived on a lonely island. / One day, | he made a terrible storm with his magic. / A ship sank near the island, | and his enemies swam to the shore. / Prospero’s daughter Miranda | fell in love with a young prince. / In the end, | Prospero forgave his enemies and broke his magic staff.',
      spec: 'NP:H VP:HAW ADV CL2 CLc:O AND:cl NP:H VP:H ADV CL2' },
    // ---- more classics
    { id: 'treasureisland', title: 'The Old Sailor’s Chest', emoji: '🏴‍☠️', book: 'Treasure Island', author: 'Robert Louis Stevenson',
      text: 'A mysterious old sailor | arrived at the Admiral Benbow Inn. / He died suddenly, | and young Jim found his chest. / Inside the chest, | Jim discovered a treasure map. / Jim and his friends | sailed to a faraway island. / There, | a one-legged cook named Silver turned out to be a pirate.',
      spec: 'NP:H VP:H CLc:H AND:cl ADV CL2 NP:H+pl VP:H ADV CL2' },
    { id: 'peterpan', title: 'The Boy Who Flew', emoji: '⭐', book: 'Peter Pan', author: 'J. M. Barrie',
      text: 'One night, | a boy flew into Wendy’s bedroom. / His name was Peter Pan, | and he lost his shadow. / Wendy sewed his shadow back | with a needle. / Tinker Bell | sprinkled fairy dust on Wendy and her brothers. / They flew over London | and found Neverland.',
      spec: 'ADV CL2 CLc:H AND:cl CLn:H+act+tr PP:INSTR NP:W VP:HW CLn:H+act+mot AND:vp' },
    { id: 'oz', title: 'The Yellow Road', emoji: '🌪️', book: 'The Wonderful Wizard of Oz', author: 'L. Frank Baum',
      text: 'A big tornado | lifted Dorothy’s house into the sky. / The house landed | in a colorful land. / Dorothy followed the yellow road | to find the Wizard of Oz. / On the road, | she met a scarecrow, a tin man and a lion. / The Wizard was only a man, | but he gave them courage.',
      spec: 'NP:O VP:HWO CLn:O+mot PP:LOC CLn:H+act+tr+mot INF ADV CL2 CLc:H BUT' },
    { id: 'mowgli', title: 'The Boy and the Wolves', emoji: '🐅', book: 'The Jungle Book', author: 'Rudyard Kipling',
      text: 'A baby boy | got lost in the jungle. / A wolf family | found him and took him home. / They named him Mowgli, | and he grew up with the wolves. / The tiger Shere Khan | wanted to eat the boy. / In the end, | Mowgli defeated the tiger with fire.',
      spec: 'NP:H VP:H NP:A VP:HAW CLc:H AND:cl NP:A VP:HAW ADV CL2' },
    { id: 'gulliver', title: 'The Tiny People', emoji: '🏝️', book: 'Gulliver’s Travels', author: 'Jonathan Swift',
      text: 'A shipwreck | left Gulliver on a strange beach. / He woke up | and could not move. / Hundreds of tiny people | had tied him to the ground. / The tiny people | were only six inches tall. / Soon the tiny people | brought him food and water.',
      spec: 'NP:O VP:HWO CLn:H AND:vp NP:H+pl VP:H NP:H+pl VP:HAW+were NP:H+pl VP:H' },
    { id: 'frankenstein', title: 'The Lonely Creature', emoji: '⚡', book: 'Frankenstein', author: 'Mary Shelley',
      text: 'A young scientist named Victor | wanted to create life. / One stormy night, | his creature opened its yellow eyes. / Victor was terrified | and ran away. / The lonely creature | wandered alone through the world. / He asked Victor for a friend, | but Victor refused.',
      spec: 'NP:H VP:HW ADV CL2 CLn:H AND:vp NP:A VP:HAW CLc:H BUT' },
    { id: 'fence', title: 'The Painted Fence', emoji: '🎨', book: 'The Adventures of Tom Sawyer', author: 'Mark Twain',
      text: 'Aunt Polly punished Tom | and told him to paint a long fence. / Tom hated work, | so he had a clever idea. / Tom pretended | to enjoy painting. / His friends begged him | to let them try. / In the end, | Tom sat in the shade and the others painted the fence.',
      spec: 'CLn:H+act AND:vp CLc:H SO VI INF CLn:H+act INF ADV CL2' },
    { id: 'crusoe', title: 'Alone on the Island', emoji: '🦜', book: 'Robinson Crusoe', author: 'Daniel Defoe',
      text: 'A storm sank sailor Crusoe’s ship, | and he alone reached a lonely island. / He built a hut | and made a fire. / He taught a parrot | to say his name. / Years later, | he saw a strange footprint in the sand. / Someone else was on the island, | so Crusoe hid in his hut, trembling.',
      spec: 'CLc:O AND:cl CLn:H+act+tr AND:vp CLn:H+act+tr INF ADV CL2 CLc:H SO' },
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
