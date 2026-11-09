/**
 * SOLITERARY - rules (Klondike with stories instead of numbers). Pure logic, no DOM.
 * A card is a number: story * 10 + (beat - 1). story = 0..3 (the 4 stories of the deal), beat = 1..10 (1 = how the story starts).
 *
 * State:  tab[7]   columns, bottom of the pile first; the last card is the one you can touch
 *         hid[7]   how many cards at the start of each column are face down
 *         found[4] cards already on the pile of each story (found[s] = 3 means beats 1-3 are there)
 *         stock[]  face-down draw pile (the last card is drawn first)
 *         waste[]  face-up drawn cards (the last one is playable)
 *
 * Differences from Klondike (on purpose): a card goes under the sentence that comes right AFTER it in the SAME story
 * (the pupils have no numbers: they must read), so the colors do not alternate; the colors only say which story is which.
 * An empty column takes the last sentence of a story ("The End", like the King) - or any card if EMPTY_ANY is true.
 */
(function (root) {
  'use strict';
  const N = 10;               // sentences in a story
  const COLS = 7;
  const story = c => (c / N) | 0;
  const beat = c => (c % N) + 1;
  const cfg = { EMPTY_ANY: true, compat: null };   // compat(x, y): extra pairs that may be built on the columns (easy level)

  // x goes UNDER y on a column, so a column reads from top to bottom like a text: y must come right before x, in the same story
  // (the next sentence) or - with cfg.compat - because the two cards make good English together, even from different stories
  const canOnCard = (x, y) => (story(x) === story(y) && beat(y) + 1 === beat(x)) || (cfg.compat !== null && cfg.compat(y, x));
  const canOnEmpty = x => cfg.EMPTY_ANY || beat(x) === N;

  function shuffle(a, rnd) {
    rnd = rnd || Math.random;
    for (let i = a.length - 1; i > 0; i--) { const j = (rnd() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  function deal(rnd) {
    const deck = shuffle(Array.from({ length: 4 * N }, (_, i) => i), rnd);
    const tab = [], hid = [];
    for (let i = 0; i < COLS; i++) { tab.push(deck.splice(0, i + 1)); hid.push(i); }
    return { tab, hid, found: [0, 0, 0, 0], stock: deck, waste: [] };
  }

  const clone = s => ({
    tab: s.tab.map(c => c.slice()), hid: s.hid.slice(), found: s.found.slice(),
    stock: s.stock.slice(), waste: s.waste.slice(),
  });

  // cards that follow each other in one story, in the right order (the golden frame): they can go to the story pile all together
  const inOrder = cs => cs.every((c, i) => i === 0 || (story(c) === story(cs[i - 1]) && beat(c) === beat(cs[i - 1]) + 1));

  const won = s => s.found.every(n => n === N);

  // after a card leaves a column: turn the last face-down card
  function flip(s, col) { if (s.tab[col].length && s.hid[col] >= s.tab[col].length) s.hid[col] = s.tab[col].length - 1; }

  /** draw one card, or turn the waste over again when the stock is empty. Returns false if there is nothing to draw. */
  function draw(s) {
    if (s.stock.length) { s.waste.push(s.stock.pop()); return true; }
    if (s.waste.length) { s.stock = s.waste.reverse(); s.waste = []; return true; }
    return false;
  }

  /* A move: { from: {t:'w'} | {t:'t', col, idx}, to: {t:'f'} | {t:'t', col} }  (the card goes to its own pile when to.t = 'f') */
  function cardsOf(s, from) {
    if (from.t === 'w') return s.waste.length ? [s.waste[s.waste.length - 1]] : [];
    return s.tab[from.col].slice(from.idx);
  }

  function canMove(s, m) {
    const cs = cardsOf(s, m.from);
    if (!cs.length) return false;
    if (m.from.t === 't' && m.from.idx < s.hid[m.from.col]) return false;
    const x = cs[0];
    if (m.to.t === 'f') return inOrder(cs) && beat(x) === s.found[story(x)] + 1;
    const dest = s.tab[m.to.col];
    if (m.from.t === 't' && m.from.col === m.to.col) return false;
    if (!dest.length) return canOnEmpty(x);
    return canOnCard(x, dest[dest.length - 1]);
  }

  function apply(s, m) {
    const cs = cardsOf(s, m.from);
    if (m.from.t === 'w') s.waste.pop(); else { s.tab[m.from.col].length = m.from.idx; flip(s, m.from.col); }
    if (m.to.t === 'f') s.found[story(cs[0])] += cs.length;
    else s.tab[m.to.col].push(...cs);
    return s;
  }

  /** every legal move (the waste is only the top card, like on the table) */
  function legalMoves(s) {
    const out = [];
    const froms = [];
    if (s.waste.length) froms.push({ t: 'w' });
    for (let c = 0; c < COLS; c++) for (let i = s.hid[c]; i < s.tab[c].length; i++) froms.push({ t: 't', col: c, idx: i });
    for (const from of froms) {
      const tos = [{ t: 'f' }];
      for (let c = 0; c < COLS; c++) tos.push({ t: 't', col: c });
      for (const to of tos) { const m = { from, to }; if (canMove(s, m)) out.push(m); }
    }
    return out;
  }

  /* ---------------------------------------------------------------- solver
   * Tells if a deal can be won. With draw-1 and unlimited turns of the stock, every card of stock + waste can be reached sooner or later,
   * so the solver treats stock + waste as one set ("cyc"). Moving a card to its pile is always safe (nothing is ever built on a pile card),
   * so those moves are made at once and only the other moves are searched. */
  const settle = (s, path) => {      // all the safe moves to the piles
    let again = true;
    while (again) {
      again = false;
      for (let c = 0; c < COLS; c++) {
        const col = s.tab[c];
        for (let i = s.hid[c]; i < col.length; i++) {      // the face-up cards from i on, if they are in story order and the next ones the pile needs
          const run = col.slice(i);
          if (beat(col[i]) === s.found[story(col[i])] + 1 && inOrder(run)) {
            col.length = i; s.found[story(run[0])] += run.length; flip(s, c);
            path.push({ from: { t: 't', col: c, idx: i }, to: { t: 'f' }, card: run[0] }); again = true; break;
          }
        }
      }
      for (let i = 0; i < s.cyc.length; i++) {
        const x = s.cyc[i];
        if (beat(x) === s.found[story(x)] + 1) { s.cyc.splice(i, 1); s.found[story(x)]++; path.push({ from: { t: 'c' }, to: { t: 'f' }, card: x }); again = true; break; }
      }
    }
  };
  const solverKey = s => s.tab.map((c, i) => s.hid[i] + ':' + c.join(',')).join('|') + '#' + s.found.join('') + '#' + s.cyc.join(',');

  /** a key of the table that is the same for the same position (after the safe moves to the piles) */
  function stateKey(s) {
    const st = { tab: s.tab.map(c => c.slice()), hid: s.hid.slice(), found: s.found.slice(), cyc: s.stock.concat(s.waste).sort((a, b) => a - b) };
    settle(st, []);
    return solverKey(st);
  }

  function solve(start, maxNodes, avoid) {
    maxNodes = maxNodes || 30000;
    let nodes = 0;
    const seen = new Set(avoid || []);

    const cl = s => ({ tab: s.tab.map(c => c.slice()), hid: s.hid.slice(), found: s.found.slice(), cyc: s.cyc.slice() });

    function dfs(s0, path0) {
      if (++nodes > maxNodes || path0.length > 400) return null;
      const s = cl(s0), path = path0.slice();
      settle(s, path);
      if (s.found.every(n => n === N)) return path;
      const k = solverKey(s);
      if (seen.has(k)) return null;
      seen.add(k);
      const moves = [];
      // from the stock/waste cards
      for (const x of s.cyc) {
        for (let c = 0; c < COLS; c++) {
          const d = s.tab[c];
          if (d.length ? canOnCard(x, d[d.length - 1]) : canOnEmpty(x)) moves.push({ from: { t: 'c' }, card: x, to: { t: 't', col: c } });
        }
      }
      // from the columns: only the whole face-up run (it turns a card) or, to an empty column, any piece
      for (let c = 0; c < COLS; c++) {
        const col = s.tab[c];
        for (let i = s.hid[c]; i < col.length; i++) {
          const x = col[i];
          for (let d = 0; d < COLS; d++) {
            if (d === c) continue;
            const dest = s.tab[d];
            if (dest.length) { if ((i === s.hid[c] || (cfg.compat && i > s.hid[c] && beat(col[i - 1]) === s.found[story(col[i - 1])] + 1)) && canOnCard(x, dest[dest.length - 1])) moves.push({ from: { t: 't', col: c, idx: i }, to: { t: 't', col: d } }); }
            else if (canOnEmpty(x) && !(i === 0)) moves.push({ from: { t: 't', col: c, idx: i }, to: { t: 't', col: d } });
          }
        }
      }
      // moves that turn a card first
      moves.sort((a, b) => (b.from.t === 't' && b.from.idx === s.hid[b.from.col] && s.hid[b.from.col] > 0) - (a.from.t === 't' && a.from.idx === s.hid[a.from.col] && s.hid[a.from.col] > 0));
      for (const m of moves) {
        const n = cl(s);
        if (m.from.t === 'c') { n.cyc.splice(n.cyc.indexOf(m.card), 1); n.tab[m.to.col].push(m.card); }
        else { const cs = n.tab[m.from.col].splice(m.from.idx); flip(n, m.from.col); n.tab[m.to.col].push(...cs); }
        const r = dfs(n, path.concat([Object.assign({}, m, m.from.t === 'c' ? {} : { card: s.tab[m.from.col][m.from.idx] })]));
        if (r) return r;
        if (nodes > maxNodes) return null;
      }
      return null;
    }
    const cyc = start.stock.concat(start.waste).sort((a, b) => a - b);
    return dfs({ tab: start.tab, hid: start.hid, found: start.found, cyc }, []);
  }

  /** a deal that can be won (tries a few shuffles; if none is found in time it gives the last one) */
  function winnableDeal(rnd, tries) {
    let s;
    for (let i = 0; i < (tries || 40); i++) { s = deal(rnd); if (solve(s, 20000)) return s; }
    return s;
  }

  /** a hint: the first move of a winning line, or a plain move, or 'draw' */
  function hint(s, avoid) {
    const own = stateKey(s);
    const av = avoid ? new Set([...avoid].filter(k => k !== own)) : null;
    const r = solve(clone(s), 20000, av) || solve(clone(s), 20000);
    if (r && r.length) return r[0];
    const lm = legalMoves(s);
    const good = lm.find(m => m.to.t === 'f') || lm.find(m => m.from.t === 't' && m.from.idx === s.hid[m.from.col] && s.hid[m.from.col] > 0) || lm[0];
    return good || { from: { t: 's' } };
  }

  const API = { N, COLS, story, beat, cfg, canOnCard, canOnEmpty, shuffle, deal, clone, won, draw, cardsOf, canMove, apply, inOrder, legalMoves, solve, stateKey, winnableDeal, hint };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.StoryEngine = API;
})(typeof window !== 'undefined' ? window : globalThis);
