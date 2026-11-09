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
  let t0 = 0, tEnd = 0, clockTimer = 0;     // the clock starts with the first move (or at "Go!" in a challenge)
  const elapsed = () => (t0 ? ((tEnd || Date.now()) - t0) / 1000 : 0);
  const tickClock = () => { const el = $('clock'); if (el) el.textContent = Progress.fmt(elapsed()); };
  function startClock() { if (t0) return; t0 = Date.now(); Progress.recordStart(); clockTimer = setInterval(tickClock, 500); }
  function stopClock() { clearInterval(clockTimer); t0 = 0; tEnd = 0; }

  // ------------------------------------------------------------ choosing the stories (the ones not played yet come first)
  const readSeen = () => { try { return JSON.parse(localStorage.getItem(SEEN_KEY)) || []; } catch (e) { return []; } };
  const writeSeen = a => { try { localStorage.setItem(SEEN_KEY, JSON.stringify(a)); } catch (e) { /* no storage: fine */ } };

  // the stories the player has completed (cloud.js merges this list with the account's one)
  const SOLVED_KEY = 'soliterary-solved';
  const readSolved = () => { try { return JSON.parse(localStorage.getItem(SOLVED_KEY)) || []; } catch (e) { return []; } };
  function markSolved(id) {
    const a = readSolved();
    if (a.includes(id)) return;
    a.push(id);
    try { localStorage.setItem(SOLVED_KEY, JSON.stringify(a)); } catch (e) { /* no storage: fine */ }
    window.dispatchEvent(new CustomEvent('soliterary:solved', { detail: id }));
  }
  window.addEventListener('soliterary:synced', () => { if (S) renderDrawer(); });

  // the home page can open the game with ?stories=a,b,c (stories chosen by the player) and ?cat=authors:Oscar Wilde (new stories come from this category)
  const params = new URLSearchParams(location.search);
  const mode = params.get('week') !== null ? 'weekly' : params.get('duel') ? 'duel' : '';
  function catIds() {
    const c = params.get('cat'); if (!c) return null;
    const k = c.split(':')[0], g = window.CATALOG && CATALOG.group(k, c.slice(k.length + 1));
    return g ? g.ids : null;
  }
  function pickStories(first) {
    const pool = catIds(), base = pool ? STORIES.filter(s => pool.includes(s.id)) : STORIES;
    const chosen = first ? (params.get('stories') || '').split(',').filter((id, i, a) => STORIES.some(s => s.id === id) && a.indexOf(id) === i).slice(0, 4) : [];
    const need = 4 - chosen.length;
    // free player: always random, a story already completed can come back. Pro player: a completed story never comes back in a
    // normal game (stories started but not finished can); it only returns in the weekly challenge and duels, which are the same for everybody
    const done = new Set(Progress.isPro() ? Progress.solved() : []);
    const ok = s => !chosen.includes(s.id) && !done.has(s.id);
    const tiers = [base.filter(ok), STORIES.filter(ok), STORIES.filter(s => !chosen.includes(s.id))];     // the category first, then the others, and only when everything is done the finished ones
    const extra = [];
    tiers.forEach(t => E.shuffle(t.slice()).forEach(s => { if (extra.length < need && !extra.includes(s)) extra.push(s); }));
    games = E.shuffle(chosen.map(id => STORIES.find(s => s.id === id)).concat(extra)).map(g => Object.assign({}, g));
    applyLevel();
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

  function newStories(first) { pickStories(first === true); dealAgain(); }

  // ------------------------------------------------------------ class game (class.js): the same deal for everybody
  const info = () => ({ moves, piles: S ? S.found.reduce((a, b) => a + b, 0) : 0, won, time: Math.round(elapsed() * 10) / 10 });
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
      hist = []; visited = new Set(); moves = 0; sel = null; won = false; stopClock();
      $('modal').hidden = true; say('');
      render();
      return true;
    },
    leaveClass() { classMode = null; document.body.classList.remove('class-mode'); newStories(); },
  };
  function dealAgain() {
    S = E.winnableDeal();
    hist = []; visited = new Set(); moves = 0; sel = null; won = false; stopClock();
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
    if (c === null || c === undefined) { r.textContent = TOUCH ? 'Tap a card: its sentence appears here in big letters.' : 'Point at a sentence to read it in big letters.'; r.classList.add('hole'); return; }
    r.classList.remove('hole');
    r.textContent = games[E.story(c)].lines[E.beat(c) - 1];
  }

  // ------------------------------------------------------------ size
  function size() {
    const t = $('table'), root = document.documentElement.style;
    // phones in portrait ("tiny"): all 7 columns fit, the cards are small (emoji + first words) and a tap shows the sentence in big letters at the bottom.
    // phones on their side and bigger screens: the cards are readable and the table fits (or scrolls a little)
    const phone = innerWidth < 700 || innerHeight < 520, tiny = innerWidth < 560, minCw = tiny ? 40 : phone ? 92 : 124;
    document.body.classList.toggle('phone', phone); document.body.classList.toggle('tiny', tiny);
    const W = Math.max(t.clientWidth - (tiny ? 12 : 24), 7 * minCw + 6 * 8);
    const gap = tiny ? 4 : Math.max(phone ? 6 : 8, Math.min(16, W * 0.012));
    const cw = Math.max(minCw, Math.min(190, (W - 6 * gap) / 7));
    const fs = tiny ? 8.5 : Math.max(11.5, Math.min(14.5, cw * 0.075)), lh = tiny ? 10 : fs * 1.25;
    const strip = tiny ? 27 : Math.round(lh * 3 + 14), ch = tiny ? 74 : Math.round(strip + lh + 10);
    dim = { down: tiny ? 5 : Math.round(cw * 0.085), strip, ch };
    root.setProperty('--cw', cw + 'px'); root.setProperty('--ch', ch + 'px'); root.setProperty('--gap', gap + 'px');
    root.setProperty('--fs', fs + 'px'); root.setProperty('--lh', lh + 'px'); root.setProperty('--strip', strip + 'px');
  }

  // ------------------------------------------------------------ drawing
  const TOUCH = matchMedia('(pointer: coarse)').matches;      // fingers tap (drag and drop does not work well there)
  const card = (c, o = {}) => {
    const g = games[E.story(c)];
    return `<div class="card c${E.story(c)}${o.cut ? ' cut' : ''}${o.sel ? ' sel' : ''}${o.good !== undefined ? ' good r' + o.good : ''}" data-c="${c}"${o.i !== undefined ? ` data-i="${o.i}"` : ''}
      ${o.top !== undefined ? `style="top:${o.top}px;z-index:${o.z || 1}"` : ''} ${TOUCH ? '' : 'draggable="true"'}><i class="em">${g.emoji}</i><span class="tx">${esc(g.lines[E.beat(c) - 1])}</span></div>`;
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
    $('stats').innerHTML = `<span>⏱ <b id="clock">${Progress.fmt(elapsed())}</b></span><span><i class="ic">👆</i><em class="lbl">Moves </em><b>${moves}</b></span><span><i class="ic">📚</i><em class="lbl">Stories </em><b>${done}/4</b></span>`;
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
    }).join('') + unlockedList();
  }

  // all the stories completed so far (saved in the account when signed in)
  function unlockedList() {
    const ids = readSolved().filter(id => STORIES.some(s => s.id === id));
    const pro = Progress.isPro();       // reading a finished story again is a Pro feature
    const li = ids.map(id => { const s = STORIES.find(x => x.id === id); return pro ? `<li><button class="rd" data-read="${id}">${s.emoji} ${esc(s.title)} <small>read</small></button></li>` : `<li class="lk">${s.emoji} ${esc(s.title)}</li>`; }).join('');
    const who = window.SoliteraryCloud && window.SoliteraryCloud.user();
    return `<div class="unlocked"><h3>🏆 Unlocked stories: ${ids.length}/${STORIES.length}</h3>
      ${li ? `<ul class="rdl">${li}</ul>` : '<p class="none">Complete a story and it will appear here.</p>'}
      ${pro || !ids.length ? '' : '<p class="none">🔒 Reading your finished stories again is a Pro feature.</p>'}
      ${who ? '' : '<p class="none">Sign in (👤 at the top) to keep them forever.</p>'}</div>`;
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
    startClock();
    remember();
    E.apply(S, { from, to });
    moves++; sel = null; clearHint();
    S.found.forEach((n, i) => { if (n === E.N) markSolved(games[i].id); });
    const finished = E.won(S) && !won;
    if (finished) { won = true; tEnd = Date.now(); clearInterval(clockTimer); }
    render();
    if (finished) {
      const rec = Progress.recordWin(elapsed(), moves);
      if (classMode && classMode.hooks.win) classMode.hooks.win(Object.assign(info(), { rec }));
      else setTimeout(() => showWin(rec), 500);
    }
    return true;
  }

  function drawCard() {
    sel = null; clearHint();
    remember();
    if (!E.draw(S)) { hist.pop(); return; }
    startClock();
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
      if (same) {                       // a second tap: straight to its story pile if it fits (the phone has no double-click), else deselect
        const x = E.cardsOf(S, sel)[0];
        if (x !== undefined && tryMove(sel, { kind: 'found', i: E.story(x) }, true)) return;
        sel = null; render(); return;
      }
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
  function showWin(rec) {
    const best = rec ? [rec.time ? '⚡ new fastest time!' : '', rec.moves ? '🎯 new fewest moves!' : ''].filter(Boolean).join(' ') : '';
    $('modalBox').innerHTML = `<h2>🎉 Table cleared in ${Progress.fmt(elapsed())}, ${moves} moves!</h2>
      ${best ? `<p><b>${best}</b></p>` : ''}
      <p>You put all the stories back together. Read them once more:</p>
      ${games.map((g, i) => `<div class="story c${i}"><h3>${g.emoji} ${esc(g.title)}</h3><p style="margin:0;font-weight:600">${esc(g.lines.join(' '))}</p>${srcLine(g)}</div>`).join('')}
      <div class="row"><button class="btn btn-main" data-action="new">Play with new stories</button><button class="btn" data-action="close">Close</button><a class="btn" href="index.html">🏠 Home</a></div>`;
    $('modal').hidden = false;
  }

  function action(a) {
    if (a === 'go') { $('modal').hidden = true; $('modal').classList.remove('lock'); startClock(); render(); return; }
    if (classMode && ['hint', 'again', 'new'].includes(a)) return;      // not in a class game: everybody plays the same deal, without help
    if (a === 'undo') undo();
    else if (a === 'hint') hint();
    else if (a === 'stories') $('drawer').classList.toggle('open');
    else if (a === 'again') dealAgain();
    else if (a === 'new') newStories();
    else if (a === 'rules') showRules();
    else if (a === 'close') { $('modal').hidden = true; $('modal').classList.remove('lock'); }
  }

  // ------------------------------------------------------------ challenges: weekly (?week=2026-W46) and duel (?duel=ID)
  // the same deal for everybody, no help, and the result goes to the cloud (net.js)
  const lock = html => { $('modalBox').innerHTML = html; $('modal').classList.add('lock'); $('modal').hidden = false; };
  const homeBtn = (label, hash) => `<a class="btn" href="index.html${hash || ''}">${label || '🏠 Home'}</a>`;
  const retryBtn = '<button class="btn btn-main" onclick="location.reload()">Try again</button>';
  const fmtT = Progress.fmtT;
  function whenNet() {            // cloud.js and net.js are modules: they arrive a moment after this script
    return new Promise(res => {
      const t = Date.now();
      (function look() {
        if (window.SoliteraryNet && window.SoliteraryCloud) res(window.SoliteraryNet);
        else if (Date.now() - t > 9000) res(null);
        else setTimeout(look, 100);
      })();
    });
  }
  async function startChallenge() {
    lock('<h2>Loading…</h2><p>Getting the challenge ready.</p>');
    const net = await whenNet();
    if (!net) { lock(`<h2>No connection</h2><p>The challenges need the internet. Try again in a moment.</p><div class="row">${retryBtn}${homeBtn()}</div>`); return; }
    await window.SoliteraryCloud.ready;
    if (!window.SoliteraryCloud.user()) {
      lock(`<h2>Sign in to play</h2><p>Challenges and duels count for the leaderboard and your friends, so you need an account. It takes ten seconds!</p><div class="row"><button class="btn btn-main" data-cloud="in">Sign in</button>${homeBtn()}</div>`);
      window.addEventListener('soliterary:synced', () => { if (window.SoliteraryCloud.user()) startChallenge(); }, { once: true });
      return;
    }
    try {
      if (mode === 'weekly') await weekly(net); else await duel(net);
    } catch (e) {
      console.warn('Soliterary: challenge', e);
      lock(`<h2>Hmm…</h2><p>${esc(e.message === 'signin' ? 'Please sign in again.' : e.message || 'Something went wrong.')}</p><div class="row">${retryBtn}${homeBtn()}</div>`);
    }
  }
  // the board waits behind a dark window: the clock starts only when the player presses Go
  function intro(title, lines, ev, hooks) {
    window.SSGame.startClass(ev.ids, ev.seed, hooks);
    lock(`<h2>${title}</h2>${lines}
      <ul><li>The same 4 stories and the same deal for everybody.</li><li>No hint, no new deal. Undo counts as a move.</li><li>The clock starts when you press <b>Go!</b></li></ul>
      <div class="row"><button class="btn btn-main" data-action="go">Go!</button>${homeBtn()}</div>`);
  }
  async function weekly(net) {
    const week = params.get('week') || Progress.weekId();
    if (week !== Progress.weekId()) { lock(`<h2>This challenge is over</h2><p>A new one is waiting for you!</p><div class="row">${homeBtn('🏠 Home', '#events')}</div>`); return; }
    const ev = await net.getEvent(week), mine = await net.myEntry(week);
    intro('🏆 Weekly challenge', `<p><b>${ev.emoji} ${esc(ev.theme)} week</b>${mine ? ` · your best so far: ⚡ ${fmtT(mine.bestTime)} · 🎯 ${mine.bestMoves} moves` : ''}</p>`, ev, {
      async win(r) {
        lock('<h2>🎉 Table cleared!</h2><p>Saving your result…</p>');
        try {
          const sub = await net.submitWeekly(week, r.time, r.moves), board = await net.weeklyBoard(week), uid = window.SoliteraryCloud.user().uid;
          const rank = list => { const i = list.findIndex(x => x.id === uid); return i < 0 ? '' : ' · #' + (i + 1); };
          lock(`<h2>🎉 Table cleared!</h2>
            <div class="res"><div><b>⚡ Time</b><span>${fmtT(r.time)}</span><small>${sub.newTime ? 'new best!' : 'best: ' + fmtT(sub.entry.bestTime)}${rank(board.byTime)}</small></div>
            <div><b>🎯 Moves</b><span>${r.moves}</span><small>${sub.newMoves ? 'new best!' : 'best: ' + sub.entry.bestMoves}${rank(board.byMoves)}</small></div></div>
            <p>Champions so far: ⚡ <b>${esc(board.byTime[0].nick)}</b> ${fmtT(board.byTime[0].bestTime)} · 🎯 <b>${esc(board.byMoves[0].nick)}</b> ${board.byMoves[0].bestMoves} moves</p>
            <p class="none">You can play again: only your best time and your fewest moves count.</p>
            <div class="row">${retryBtn}${homeBtn('🏆 Leaderboard', '#events')}</div>`);
        } catch (e) {
          console.warn('Soliterary: result not saved', e);
          lock(`<h2>🎉 Table cleared!</h2><p>${Progress.fmt(r.time)}, ${r.moves} moves. But the result could not be saved (${esc(e.message || '')}).</p><div class="row">${homeBtn()}</div>`);
        }
      },
    });
  }
  async function duel(net) {
    const d = await net.getDuel(params.get('duel')), uid = window.SoliteraryCloud.user().uid;
    if (!d.players.includes(uid)) throw new Error('This duel is for two other players.');
    const other = d.from === uid ? d.toNick : d.fromNick;
    const show = dd => {
      const my = dd.results[uid], th = dd.results[dd.players.find(p => p !== uid)], w = net.duelWinner(dd);
      lock(`<h2>⚔️ Duel with ${esc(other)}</h2>
        <div class="res"><div class="${w === uid ? 'win' : ''}"><b>You</b><span>${fmtT(my.time)}</span><small>${my.moves} moves</small></div>
        <div class="${w && w !== uid && w !== 'draw' ? 'win' : ''}"><b>${esc(other)}</b><span>${th ? fmtT(th.time) : '…'}</span><small>${th ? th.moves + ' moves' : 'has not played yet'}</small></div></div>
        <p><b>${!w ? 'Waiting for ' + esc(other) + '. Look at your duels on the home page later!' : w === 'draw' ? 'A draw!' : w === uid ? '🏅 You win!' : esc(other) + ' wins this time.'}</b> The faster time wins; with the same time, the fewer moves.</p>
        <div class="row">${homeBtn('🏠 Home', '#duels')}</div>`);
    };
    if (d.results && d.results[uid]) { window.SSGame.startClass(d.ids, d.seed, {}); show(d); return; }
    intro('⚔️ Duel with ' + esc(other), '<p>Beat them with the faster time!</p>', d, {
      async win(r) {
        lock('<h2>🎉 Table cleared!</h2><p>Saving your result…</p>');
        try { show(await net.submitDuel(d.id, r.time, r.moves)); }
        catch (e) { lock(`<h2>🎉 Table cleared!</h2><p>${Progress.fmt(r.time)}, ${r.moves} moves. The result could not be saved (${esc(e.message || '')}).</p><div class="row">${homeBtn()}</div>`); }
      },
    });
  }

  // a story already completed (from "My stories"): the whole text, to read again
  function readStory(id) {
    const g = STORIES.find(s => s.id === id); if (!g || !Progress.isPro()) return;
    $('modalBox').innerHTML = `<h2>${g.emoji} ${esc(g.title)}</h2><div class="story c0"><p class="told big">${esc(g.lines.join(' '))}</p>${srcLine(g)}</div><div class="row"><button class="btn btn-main" data-action="close">Close</button></div>`;
    $('modal').hidden = false;
  }

  // ------------------------------------------------------------ start
  document.addEventListener('click', e => {
    const rd = e.target.closest('[data-read]');
    if (rd) { readStory(rd.dataset.read); return; }
    const b = e.target.closest('[data-action]');
    if (b) { action(b.dataset.action); return; }
    if (e.target === $('modal') && !$('modal').classList.contains('lock')) $('modal').hidden = true;
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

  if (mode) startChallenge(); else newStories(true);
  if (location.hash === '#rules' && !mode) showRules();       // the 'How to play' link of the home page
  // the rules open by themselves only once: on a device (and account) that has never seen them.
  // cloud.js tells us when the sign-in is known, because the account may remember that it has already seen them.
  const RULES_KEY = 'soliterary-rules-seen';
  const rulesSeen = () => { try { return !!localStorage.getItem(RULES_KEY); } catch (e) { return false; } };
  function firstRules() {
    if (rulesSeen()) return;
    try { localStorage.setItem(RULES_KEY, '1'); } catch (e) { /* no storage: fine */ }
    window.dispatchEvent(new CustomEvent('soliterary:rules-seen'));
    showRules();
  }
  if (!mode && !/norules|teacher|fake/.test(location.search) && !rulesSeen()) {
    let done = false;
    const go = () => { if (done) return; done = true; firstRules(); };
    window.addEventListener('soliterary:synced', () => setTimeout(go, 0), { once: true });   // sign-in checked (the account may set the flag first)
    setTimeout(go, 3500);                                                                       // no connection: show them anyway
  }
})();
