/**
 * SOLITERARY - interface. The rules are in engine.js, the stories in stories.js.
 * Click a sentence and then where it goes (or drag it); double-click sends it to its story pile.
 */
(() => {
  'use strict';
  const E = StoryEngine;
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const SEEN_KEY = 'soliterary-seen';

  let games = [];          // the 4 stories of this deal: { id, title, emoji, lines }
  let S = null;            // the state of the table
  let visited = new Set(), hist = [], moves = 0, sel = null, drag = null, won = false;
  let classMode = null;     // a class game (class.js): { hooks: { change(info), win(info) } }
  let msgTimer = 0, hintTimer = 0;
  const LEVEL_KEY = 'soliterary-level';
  const level = 'medium';       // easy and hard are switched off for now (their texts are still in levels.js / stories.js)
  let dim = { down: 14 };

  // ------------------------------------------------------------ choosing the stories (the ones not played yet come first)
  const readSeen = () => { try { return JSON.parse(localStorage.getItem(SEEN_KEY)) || []; } catch (e) { return []; } };
  const writeSeen = a => { try { localStorage.setItem(SEEN_KEY, JSON.stringify(a)); } catch (e) { /* no storage: fine */ } };

  function pickStories() {
    let seen = readSeen().filter(id => STORIES.some(s => s.id === id));
    let fresh = STORIES.filter(s => !seen.includes(s.id));
    if (fresh.length < 4) { seen = []; fresh = STORIES.slice(); }
    games = E.shuffle(fresh.slice()).slice(0, 4).map(g => Object.assign({}, g));
    applyLevel();
    writeSeen(seen.concat(games.map(g => g.id)));
  }

  // every story has its text for the three levels (levels.js): the cards show the one of the chosen level
  function applyLevel() {
    games.forEach(g => { g.lines = g.sets[level]; });
    // medium: on the columns, two halves that make a good sentence together fit even from different stories
    E.cfg.compat = (x, y) => midFits(games, x, y);
    document.body.classList.remove('lvl-easy', 'lvl-medium', 'lvl-hard');
    document.body.classList.add('lvl-' + level);
    document.querySelectorAll('.lvl').forEach(b => b.classList.toggle('on', b.dataset.level === level));
  }

  function newStories() { pickStories(); dealAgain(); }

  // ------------------------------------------------------------ class game (class.js): the same deal for everybody
  const info = () => ({ moves, piles: S ? S.found.reduce((a, b) => a + b, 0) : 0, won });
  function mulberry32(a) {              // a seed gives always the same numbers: every device makes the same deal
    return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  window.SSGame = {
    stories: () => STORIES,
    info,
    debugState: () => S,        // for the tests
    startClass(ids, seed, hooks) {
      if (ids.some(id => !STORIES.some(s => s.id === id))) return false;       // this device does not know one of the stories
      classMode = { hooks: hooks || {} };
      document.body.classList.add('class-mode');
      games = ids.map(id => Object.assign({}, STORIES.find(s => s.id === id)));
      applyLevel();
      S = E.winnableDeal(mulberry32(seed));
      hist = []; visited = new Set(); moves = 0; sel = null; won = false;
      $('modal').hidden = true; say('');
      render();
      return true;
    },
    leaveClass() { classMode = null; document.body.classList.remove('class-mode'); newStories(); },
  };
  function dealAgain() {
    S = E.winnableDeal();
    hist = []; visited = new Set(); moves = 0; sel = null; won = false;
    $('modal').hidden = true;
    say('');
    render();
  }

  // ------------------------------------------------------------ messages
  function say(t, ms) {
    const m = $('msg');
    clearTimeout(msgTimer);
    if (!t) { m.classList.remove('show'); return; }
    m.textContent = t; m.classList.add('show');
    msgTimer = setTimeout(() => m.classList.remove('show'), ms || 3200);
  }
  function read(c) {
    const r = $('reader');
    if (c === null || c === undefined) { r.textContent = 'Point at a sentence to read it in big letters.'; r.classList.add('hole'); return; }
    r.classList.remove('hole');
    r.textContent = games[E.story(c)].lines[E.beat(c) - 1];
  }

  // ------------------------------------------------------------ size
  function size() {
    const t = $('table'), root = document.documentElement.style;
    const W = Math.max(t.clientWidth - 24, 7 * 124 + 6 * 8);
    const gap = Math.max(8, Math.min(16, W * 0.012));
    const cw = Math.max(124, Math.min(190, (W - 6 * gap) / 7));
    const fs = Math.max(11.5, Math.min(14.5, cw * 0.075)), lh = fs * 1.25;
    const strip = Math.round(lh * 3 + 14), ch = Math.round(strip + lh + 10);
    dim = { down: Math.round(cw * 0.085), strip, ch };
    root.setProperty('--cw', cw + 'px'); root.setProperty('--ch', ch + 'px'); root.setProperty('--gap', gap + 'px');
    root.setProperty('--fs', fs + 'px'); root.setProperty('--lh', lh + 'px'); root.setProperty('--strip', strip + 'px');
  }

  // ------------------------------------------------------------ drawing
  const card = (c, o = {}) => {
    const g = games[E.story(c)];
    return `<div class="card c${E.story(c)}${o.cut ? ' cut' : ''}${o.sel ? ' sel' : ''}${o.good !== undefined ? ' good r' + o.good : ''}" data-c="${c}"${o.i !== undefined ? ` data-i="${o.i}"` : ''}
      ${o.top !== undefined ? `style="top:${o.top}px;z-index:${o.z || 1}"` : ''} draggable="true"><i class="em">${g.emoji}</i><span class="tx">${esc(g.lines[E.beat(c) - 1])}</span></div>`;
  };
  const back = (top, z) => `<div class="card back" style="top:${top || 0}px;z-index:${z || 1}"></div>`;

  function render() {
    size();
    const wasteTop = S.waste.length ? S.waste[S.waste.length - 1] : null;
    const selWaste = sel && sel.t === 'w';
    let h = '<div class="grid top-row">';
    h += `<div class="pile stock" data-pile="stock" style="grid-column:1">${S.stock.length
      ? back(0) + `<b class="cnt">${S.stock.length}</b>`
      : (S.waste.length ? '<div class="recycle" title="Turn the cards over again">↻</div>' : '')}</div>`;
    h += `<div class="pile waste" data-pile="waste" style="grid-column:2">${wasteTop !== null ? card(wasteTop, { sel: selWaste, top: 0 }) : ''}</div>`;
    for (let i = 0; i < 4; i++) {
      const n = S.found[i], g = games[i];
      const top = n ? i * E.N + n - 1 : null;
      h += `<div class="pile found c${i}${n === E.N ? ' done' : ''}" data-pile="found:${i}" style="grid-column:${4 + i}">`
        + (n ? card(top, { top: 0 }) + `<b class="cnt">${n}/${E.N}</b>`
             : `<div class="ghost"><em>${g.emoji}</em><small>${esc(g.title)}</small></div>`) + '</div>';
    }
    h += '</div><div class="grid">';
    for (let c = 0; c < E.COLS; c++) {
      const col = S.tab[c];
      let y = 0, inner = '';
      // groups of cards in the right story order (top = first, bottom = next) glow; every group has its own colour,
      // so two good groups put one after the other can't be mistaken for one good pile
      const good = new Map();
      for (let i = S.hid[c], run = 0; i < col.length - 1; i++) {
        if (E.story(col[i]) === E.story(col[i + 1]) && E.beat(col[i + 1]) === E.beat(col[i]) + 1) {
          let j = i; while (j < col.length - 1 && E.story(col[j]) === E.story(col[j + 1]) && E.beat(col[j + 1]) === E.beat(col[j]) + 1) j++;
          for (let k = i; k <= j; k++) good.set(k, run % 3);
          run++; i = j;
        }
      }
      col.forEach((x, i) => {
        if (i < S.hid[c]) { inner += back(y, i + 1); y += dim.down; return; }
        const last = i === col.length - 1;
        const isSel = sel && sel.t === 't' && sel.col === c && i >= sel.idx;
        inner += card(x, { i, top: y, z: i + 1, cut: !last, sel: isSel, good: good.get(i) });
        y += last ? 0 : dim.strip;
      });
      const height = col.length ? y + dim.ch : dim.ch;
      h += `<div class="col${col.length ? '' : ' col-empty'}" data-pile="col:${c}" style="height:${height}px">${inner}</div>`;
    }
    h += '</div>';
    $('board').innerHTML = h;

    visited.add(E.stateKey(S));
    const done = S.found.filter(n => n === E.N).length;
    $('stats').innerHTML = `<span>Moves <b>${moves}</b></span><span>Stories <b>${done}/4</b></span>`;
    $('undoBtn').disabled = !hist.length;
    renderDrawer();
    read(sel ? (sel.t === 'w' ? S.waste[S.waste.length - 1] : S.tab[sel.col][sel.idx]) : null);
    if (classMode && classMode.hooks.change) classMode.hooks.change(info());
  }

  // a story that comes from a book sends the pupils to the original
  const srcLine = g => g.source ? `<p class="src">📖 Inspired by <b>“${esc(g.source.book)}”</b> by ${esc(g.source.author)}. Read the original!</p>` : '';

  // what is on a story pile so far, as a text
  const told = (g, n) => g.lines.slice(0, n).join(' ') + (n < E.N ? ' …' : '');
  function showStory(i) {
    const g = games[i], n = S.found[i];
    $('modalBox').innerHTML = `<h2>${g.emoji} ${esc(g.title)} <small style="font:700 15px Nunito">${n}/${E.N}</small></h2><div class="story c${i}"><p class="told big">${esc(told(g, n))}</p>${srcLine(g)}</div><div class="row"><button class="btn btn-main" data-action="close">Back to the table</button></div>`;
    $('modal').hidden = false;
  }

  function renderDrawer() {
    $('drawerBody').innerHTML = games.map((g, i) => {
      const n = S.found[i];
      return `<div class="story c${i}"><h3>${g.emoji} ${esc(g.title)} <small>${n}/${E.N}</small></h3>
        ${n ? `<p class="told">${esc(told(g, n))}</p>${n === E.N ? srcLine(g) : ''}` : '<div class="empty">Waiting for the first card…</div>'}</div>`;
    }).join('');
  }

  // ------------------------------------------------------------ moves
  const snapshot = () => ({ s: JSON.stringify(S), moves });
  function remember() { hist.push(snapshot()); if (hist.length > 300) hist.shift(); }

  function why(x, dest) {
    if (dest.kind === 'found') {
      if (E.story(x) !== dest.i) return 'That sentence belongs to a different story.';
      return 'Not yet: an earlier sentence of this story is still missing.';
    }
    const d = S.tab[dest.i];
    if (!d.length) return '';
    const y = d[d.length - 1];
    if (E.story(x) === E.story(y)) return 'Same story, but another card comes in between.';
    return midWhy(games, y, x);       // the card on the column is above, the moved one goes under it
  }

  function shake(el) { if (!el) return; el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }

  function tryMove(from, dest, quiet) {
    const cs = E.cardsOf(S, from);
    if (!cs.length) return false;
    const x = cs[0];
    const to = dest.kind === 'found' ? { t: 'f' } : { t: 't', col: dest.i };
    const ok = !(dest.kind === 'found' && E.story(x) !== dest.i) && E.canMove(S, { from, to });
    if (!ok) {
      if (!quiet) {
        say(cs.length > 1 && dest.kind === 'found' && !E.inOrder(cs) ? 'Only cards in the right story order (golden frame) go to the pile together.' : why(x, dest));
        shake(document.querySelector(`[data-pile="${dest.kind}:${dest.i}"]`));
      }
      return false;
    }
    remember();
    E.apply(S, { from, to });
    moves++; sel = null; clearHint();
    render();
    if (E.won(S) && !won) {
      won = true;
      if (classMode && classMode.hooks.win) classMode.hooks.win(info());
      else setTimeout(showWin, 500);
    }
    return true;
  }

  function drawCard() {
    sel = null; clearHint();
    remember();
    if (!E.draw(S)) { hist.pop(); return; }
    render();
  }

  function fromOf(el) {                      // which cards does this element mean?
    const c = el.closest('.card'); if (!c || c.classList.contains('back')) return null;
    const pile = c.closest('[data-pile]').dataset.pile.split(':');
    if (pile[0] === 'waste') return { t: 'w' };
    if (pile[0] === 'col') return { t: 't', col: +pile[1], idx: +c.dataset.i };
    return null;                             // the story piles cannot be moved
  }
  const destOf = el => {
    const p = el.closest('[data-pile]'); if (!p) return null;
    const [k, i] = p.dataset.pile.split(':');
    return k === 'found' ? { kind: 'found', i: +i } : k === 'col' ? { kind: 'col', i: +i } : null;
  };

  function onClick(e) {
    const pile = e.target.closest('[data-pile]');
    if (!pile) { sel = null; render(); return; }
    clearHint();
    if (pile.dataset.pile === 'stock') { drawCard(); return; }
    const from = fromOf(e.target), dest = destOf(e.target);
    if (!sel && dest && dest.kind === 'found') { if (S.found[dest.i]) showStory(dest.i); return; }   // click on a story pile: read it
    if (sel) {
      const same = from && from.t === sel.t && from.col === sel.col && from.idx === sel.idx;
      if (same) { sel = null; render(); return; }
      if (dest && tryMove(sel, dest, !!from)) return;   // when another card was clicked, a failed move just changes the selection
      if (!from) return;
    }
    if (from) { sel = from; render(); }
  }

  function onDouble(e) {                    // double-click: straight to the story pile
    const from = fromOf(e.target); if (!from) return;
    const x = E.cardsOf(S, from)[0];
    if (x === undefined) return;
    sel = null;
    tryMove(from, { kind: 'found', i: E.story(x) });
  }

  // drag and drop (desktop)
  function onDragStart(e) {
    const from = fromOf(e.target);
    if (!from || (from.t === 't' && from.idx < S.hid[from.col])) { e.preventDefault(); return; }
    drag = from; e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', 'card');
    clearHint();
  }
  function onDrop(e) {
    e.preventDefault();
    const dest = destOf(e.target);
    if (drag && dest) tryMove(drag, dest);
    drag = null;
  }

  // ------------------------------------------------------------ undo, hint
  function undo() {
    const h = hist.pop(); if (!h) return;
    S = JSON.parse(h.s); moves = classMode ? moves + 1 : h.moves; sel = null; clearHint();   // in a class game an undo counts as a move
    if (!classMode) won = false;
    render();
  }
  function clearHint() { clearTimeout(hintTimer); document.querySelectorAll('.hint').forEach(el => el.classList.remove('hint')); }
  function hint() {
    clearHint();
    if (E.won(S)) return;
    const m = E.hint(S, visited);
    const mark = el => el && el.classList.add('hint');
    const wasteTop = S.waste.length ? S.waste[S.waste.length - 1] : null;
    if (m.from.t === 's' || (m.from.t === 'c' && m.card !== wasteTop)) {
      mark(document.querySelector('[data-pile="stock"]'));
      say('Draw from the stock: a sentence you need is in there.', 4000);
    } else {
      if (m.from.t === 't') mark(document.querySelector(`[data-pile="col:${m.from.col}"] [data-i="${m.from.idx}"]`));
      else mark(document.querySelector('[data-pile="waste"] .card'));
      const x = m.card !== undefined ? m.card : E.cardsOf(S, m.from)[0];
      mark(document.querySelector(m.to.t === 'f' ? `[data-pile="found:${E.story(x)}"]` : `[data-pile="col:${m.to.col}"]`));
      say(m.to.t === 'f' ? 'This sentence can go to its story pile.' : 'Try this move.', 4000);
    }
    hintTimer = setTimeout(clearHint, 3500);
  }

  // ------------------------------------------------------------ windows
  function showRules() {
    $('modalBox').innerHTML = `<h2>How to play</h2>
      <p>Four short stories got mixed up in the cards. Each story has its own <span class="chip c0">color</span> and emoji. Put every sentence back in the right order to <b>clear the table</b>!</p>
      <ul>
        <li><b>The story piles</b> (top right): build each story from its <b>first</b> sentence to its <b>last</b>. The empty spaces show which stories are in this deal.</li>
        <li><b>The columns read from top to bottom, like a text.</b> Put a card <b>under</b> the card that comes right <b>before</b> it in the story. When cards are in the right order they get a <b>glowing frame</b> ✨. Every group has its own glow color: if two groups next to each other have different colors, they are not in the right order together!</li>
        <li><b>Try them together:</b> a card can also go under a card of <i>another</i> story if the two make good English one after the other (<i>At lunch, Anna</i> + <i>built a time machine.</i>). Remember: after a <b>full stop</b> comes a <b>capital letter</b>; after a comma (or nothing) a <b>small letter</b>, unless it is a name. It is only temporary: the glow only shines when the cards are in the right order of their <i>own</i> story. A group that glows moves together, and goes to its story pile if its first card is the next one the pile needs.</li>
        <li>You can move a whole group of cards together. When you uncover a face-down card, it turns over.</li>
        <li>An <b>empty column</b> takes any sentence (or group).</li>
        <li>Click the <b>stock</b> (top left) to draw a sentence. When it is empty, click it again to turn the cards over.</li>
        <li>To move: click a sentence and then its place, or drag it. <b>Double-click</b> sends it to its story pile.</li>
        <li>Read the clues! <i>Once upon a time, then, suddenly, after that, the next day, finally…</i> tell you when things happen. The sentence you point at appears in big letters at the bottom.</li>
        <li>Stuck? Use <b>Hint</b> or <b>Undo</b>. Every deal can be solved!</li>
      </ul>
      <div class="row"><button class="btn btn-main" data-action="close">Let’s play</button></div>`;
    $('modal').hidden = false;
  }
  function showWin() {
    $('modalBox').innerHTML = `<h2>🎉 Table cleared in ${moves} moves!</h2>
      <p>You put all the stories back together. Read them once more:</p>
      ${games.map((g, i) => `<div class="story c${i}"><h3>${g.emoji} ${esc(g.title)}</h3><p style="margin:0;font-weight:600">${esc(g.lines.join(' '))}</p>${srcLine(g)}</div>`).join('')}
      <div class="row"><button class="btn btn-main" data-action="new">Play with new stories</button><button class="btn" data-action="close">Close</button></div>`;
    $('modal').hidden = false;
  }

  function action(a) {
    if (classMode && ['hint', 'again', 'new'].includes(a)) return;      // not in a class game: everybody plays the same deal, without help
    if (a === 'undo') undo();
    else if (a === 'hint') hint();
    else if (a === 'stories') $('drawer').classList.toggle('open');
    else if (a === 'again') dealAgain();
    else if (a === 'new') newStories();
    else if (a === 'rules') showRules();
    else if (a === 'close') $('modal').hidden = true;
  }

  // ------------------------------------------------------------ start
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-action]');
    if (b) { action(b.dataset.action); return; }
    if (e.target === $('modal')) $('modal').hidden = true;
  });
  const table = $('table');
  table.addEventListener('click', e => { if (e.target.closest('#board')) onClick(e); else { sel = null; render(); } });
  table.addEventListener('dblclick', onDouble);
  table.addEventListener('dragstart', onDragStart);
  table.addEventListener('dragover', e => { if (drag && destOf(e.target)) e.preventDefault(); });
  table.addEventListener('drop', onDrop);
  table.addEventListener('dragend', () => { drag = null; });
  table.addEventListener('mouseover', e => {
    const c = e.target.closest('.card:not(.back)');
    if (c && !sel) read(+c.dataset.c);
  });
  table.addEventListener('mouseleave', () => { if (!sel) read(null); });
  window.addEventListener('resize', () => { if (S) render(); });

  newStories();
  if (!/norules|teacher|fake/.test(location.search)) showRules();
})();
