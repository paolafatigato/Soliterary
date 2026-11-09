# Soliterary
Standalone copy (2026-11-09) of the book's story-solitaire game. No build step: serve the folder (modules need http/https, not file://).

## Pages
- **index.html = home** (home.css, home.js): big Play button, Categories (authors / topics / genres), Events (weekly challenge), Profile (stats, medals, friends, duels). Palette = the English textbook's (--pal-* of the book style.css), Fredoka + Nunito. Phone: bottom tab bar; PC (>=960px): top tabs.
- **game.html** (script.js, style.css): the solitaire. Params: `?stories=a,b` (chosen stories) `&cat=authors:Oscar Wilde` (new stories come from that category), `?week=2026-W46` (weekly challenge), `?duel=ID`, `#rules`.
- Challenges/duels: the deal is `SSGame.startClass(ids, seed)`, same for everybody; no hint/new deal; clock starts at "Go!".

## Code
- engine.js rules + solver · stories.js / levels.js / classics.js / chapters.js stories · grammar.js which cards fit
- catalog.js: author / genre / topics of every story (TAGS table: add a line for each new story)
- progress.js: stats on the device (played, cleared, best time/moves, streak), reader level, ISO week + weekly plan (theme = a genre, 4 stories, seed)
- cloud.js: sign in + cloud save (users/{uid}), public card profiles/{uid}, friend codes codes/{CODE}; exposes window.SoliteraryCloud
- net.js: weekly leaderboard (events/{week}/entries), friends (users/{uid}/friends|requests), duels (duels/{id}); window.SoliteraryNet
- firestore.rules: PUBLISH them in the Firebase console after every change (the new collections do not work without).

## Pro
home.js: `FREE_CATEGORY_PLAY = false` -> playing a category / choosing stories is Pro (the owner email is Pro). Set it to true to give it to everybody.

## Game screen layout
Top bar = the APP (Home, My stories, Rules, account) + the clock/moves. Bottom dock = the GAME (Undo, Hint, Deal again, New stories) under the reader bar. Phones (`body.phone`, set in script.js size()): cards 112px in portrait with the columns scrolling sideways while the 6 piles stay fixed on top; landscape fits all 7 columns. Tap a selected card again = it goes to its story pile (no double-click on phones). Finished stories can be read again: home > Profile > Library, and the "My stories" drawer in the game.
