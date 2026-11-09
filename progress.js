/**
 * SOLITERARY - what the player has done (saved on the device; cloud.js merges it with the account) and the weekly plan.
 * Loaded by the home page and by the game (after catalog.js).
 */
(() => {
  const SOLVED_KEY = 'soliterary-solved', STATS_KEY = 'soliterary-stats';
  const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } };
  const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* no storage: fine */ } };

  const BLANK = { played: 0, cleared: 0, bestTime: 0, bestMoves: 0, totalTime: 0, totalMoves: 0, streak: 0, bestStreak: 0, lastDay: '', weeks: [] };
  const stats = () => Object.assign({}, BLANK, load(STATS_KEY, {}));
  const solved = () => load(SOLVED_KEY, []).filter(id => STORIES.some(s => s.id === id));

  const dayKey = d => { const x = d || new Date(); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };
  const yesterday = () => { const d = new Date(); d.setDate(d.getDate() - 1); return dayKey(d); };
  const tell = () => window.dispatchEvent(new CustomEvent('soliterary:stats'));

  // first move of a deal: counts as a game played and keeps the daily streak
  function recordStart() {
    const s = stats(), today = dayKey();
    s.played++;
    if (s.lastDay !== today) { s.streak = s.lastDay === yesterday() ? s.streak + 1 : 1; s.lastDay = today; }
    s.bestStreak = Math.max(s.bestStreak, s.streak);
    save(STATS_KEY, s); tell();
  }
  // table cleared: returns what is a new record
  function recordWin(time, moves) {
    const s = stats(), rec = { time: !s.bestTime || time < s.bestTime, moves: !s.bestMoves || moves < s.bestMoves };
    s.cleared++; s.totalTime += time; s.totalMoves += moves;
    if (rec.time) s.bestTime = time;
    if (rec.moves) s.bestMoves = moves;
    save(STATS_KEY, s); tell();
    return rec;
  }
  function recordWeek(week) {
    const s = stats();
    if (!s.weeks.includes(week)) { s.weeks.push(week); save(STATS_KEY, s); tell(); }
  }
  // two copies of the stats (this device + the account): keep the best of each
  function merge(a, b) {
    a = Object.assign({}, BLANK, a); b = Object.assign({}, BLANK, b);
    const lowest = (x, y) => (x && y ? Math.min(x, y) : x || y);
    const last = a.lastDay >= b.lastDay ? a : b;
    return {
      played: Math.max(a.played, b.played), cleared: Math.max(a.cleared, b.cleared), totalTime: Math.max(a.totalTime, b.totalTime), totalMoves: Math.max(a.totalMoves, b.totalMoves),
      bestTime: lowest(a.bestTime, b.bestTime), bestMoves: lowest(a.bestMoves, b.bestMoves),
      streak: last.streak, lastDay: last.lastDay, bestStreak: Math.max(a.bestStreak, b.bestStreak),
      weeks: [...new Set([...(a.weeks || []), ...(b.weeks || [])])],
    };
  }
  // a streak is alive today or yesterday; after that it is gone
  const streakNow = s => (s.lastDay === dayKey() || s.lastDay === yesterday() ? s.streak : 0);

  // reader level from the stories unlocked
  const LEVELS = [
    [0, 'Newcomer', '🌱'], [3, 'Page turner', '📄'], [8, 'Bookworm', '🐛'], [16, 'Storyteller', '🎙️'], [28, 'Bookshelf hero', '📚'],
    [42, 'Librarian', '🗝️'], [60, 'Professor', '🎓'], [80, 'Literary legend', '👑'],
  ];
  function level(n) {
    let i = 0; LEVELS.forEach((l, k) => { if (n >= l[0]) i = k; });
    const next = LEVELS[i + 1];
    return { i, name: LEVELS[i][1], emoji: LEVELS[i][2], from: LEVELS[i][0], next: next ? next[0] : null, nextName: next ? next[1] : '' };
  }

  const fmt = sec => { sec = Math.max(0, Math.round(sec)); return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0'); };

  const fmtT = sec => { const t = Math.max(0, Math.round(sec * 10)); return Math.floor(t / 600) + ':' + String(Math.floor(t / 10) % 60).padStart(2, '0') + '.' + (t % 10); };

  // ------------------------------------------------------------ the weekly challenge (the same for everybody)
  const DAY = 864e5;
  function weekId(d) {            // ISO week, in UTC, so that the whole world changes week at the same moment
    const t = new Date(Date.UTC((d || new Date()).getUTCFullYear(), (d || new Date()).getUTCMonth(), (d || new Date()).getUTCDate()));
    t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7));
    const y = t.getUTCFullYear();
    return y + '-W' + String(Math.ceil(((t - Date.UTC(y, 0, 1)) / DAY + 1) / 7)).padStart(2, '0');
  }
  function weekStart(id) {        // Monday 00:00 UTC
    const [y, w] = id.split('-W').map(Number);
    return Date.UTC(y, 0, 4 - (new Date(Date.UTC(y, 0, 4)).getUTCDay() || 7) + 1 + (w - 1) * 7);
  }
  const weekEnd = id => weekStart(id) + 7 * DAY;
  const prevWeek = id => weekId(new Date(weekStart(id) - 1));
  function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function mulberry32(a) {
    return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  // the week has a genre as theme; 4 of its stories and a seed for the deal
  function weekPlan(id) {
    const genres = CATALOG.groups('genres').filter(g => g.ids.length >= 4).map(g => g.key).sort();
    const [y, w] = id.split('-W').map(Number);
    const key = genres[(y * 53 + w) % genres.length], g = CATALOG.group('genres', key);
    const rnd = mulberry32(hash('pick' + id));
    const ids = g.ids.slice().sort();
    for (let i = ids.length - 1; i > 0; i--) { const j = (rnd() * (i + 1)) | 0; [ids[i], ids[j]] = [ids[j], ids[i]]; }
    return { week: id, theme: g.name, emoji: g.emoji, ids: ids.slice(0, 4), seed: hash('deal' + id) };
  }

  window.Progress = { stats, solved, recordStart, recordWin, recordWeek, merge, streakNow, level, LEVELS, fmt, fmtT, dayKey,
    weekId, weekStart, weekEnd, prevWeek, weekPlan, hash, mulberry32, SOLVED_KEY, STATS_KEY };
})();
