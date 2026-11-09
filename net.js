/**
 * SOLITERARY - the social side: weekly challenge, friends, duels (Firestore). Loaded as a module after cloud.js.
 * window.SoliteraryNet.* are async functions; they throw 'signin' when nobody is signed in.
 *   events/{week}                  = { ids, seed, theme }                       the 4 stories + the deal of the week (the first player writes it)
 *   events/{week}/entries/{uid}    = { nick, bestTime, bestMoves, attempts }    best time and fewest moves (each kept separately)
 *   users/{uid}/friends/{fid}      = { nick }       the friends I added (friends are mutual when the other has added me too)
 *   users/{uid}/requests/{fid}     = { nick }       who asked to be my friend
 *   duels/{id}                     = { from, to, players, fromNick, toNick, ids, seed, results: { uid: { time, moves } } }
 * Rules: firestore.rules.
 */
const C = () => window.SoliteraryCloud;
const F = () => C().fs;
const me = () => { const u = C().user(); if (!u) throw new Error('signin'); return u; };
const col = (...p) => F().collection(C().db, ...p);
const ref = (...p) => F().doc(C().db, ...p);
const read = async q => (await F().getDocs(q)).docs.map(d => ({ id: d.id, ...d.data() }));
const validIds = ids => Array.isArray(ids) && ids.length === 4 && ids.every(id => STORIES.some(s => s.id === id));

// ------------------------------------------------------------ weekly challenge
async function getEvent(week) {
  const plan = Progress.weekPlan(week);
  try {
    const snap = await F().getDoc(ref('events', week));
    if (snap.exists() && validIds(snap.data().ids)) { const d = snap.data(); return { week, ids: d.ids, seed: d.seed, theme: d.theme || plan.theme, emoji: plan.emoji }; }
    if (!snap.exists() && C().user()) await F().setDoc(ref('events', week), { ids: plan.ids, seed: plan.seed, theme: plan.theme });
  } catch (e) { console.warn('Soliterary: event', e); }
  return plan;       // nobody has written it yet / no connection: the plan is the same on every device anyway
}

async function weeklyBoard(week) {
  me();
  const [byTime, byMoves] = await Promise.all([
    read(F().query(col('events', week, 'entries'), F().orderBy('bestTime'), F().limit(50))),
    read(F().query(col('events', week, 'entries'), F().orderBy('bestMoves'), F().limit(50))),
  ]);
  return { byTime, byMoves };
}

async function myEntry(week) {
  const s = await F().getDoc(ref('events', week, 'entries', me().uid));
  return s.exists() ? s.data() : null;
}

async function submitWeekly(week, time, moves) {
  const u = me(), r = ref('events', week, 'entries', u.uid);
  const old = (await F().getDoc(r)).data() || {};
  const e = {
    nick: C().nick() || 'Reader',
    bestTime: old.bestTime ? Math.min(old.bestTime, time) : time,
    bestMoves: old.bestMoves ? Math.min(old.bestMoves, moves) : moves,
    attempts: (old.attempts || 0) + 1,
    updatedAt: F().serverTimestamp(),
  };
  await F().setDoc(r, e);
  Progress.recordWeek(week);
  return { first: !old.bestTime, newTime: !old.bestTime || time < old.bestTime, newMoves: !old.bestMoves || moves < old.bestMoves, entry: e };
}

// ------------------------------------------------------------ friends
const getProfile = async uid => { const s = await F().getDoc(ref('profiles', uid)); return s.exists() ? { uid, ...s.data() } : { uid, nick: 'Reader' }; };

async function addFriend(code) {
  const u = me();
  code = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (code.length !== 6) throw new Error('A friend code has 6 letters and numbers.');
  const s = await F().getDoc(ref('codes', code));
  if (!s.exists()) throw new Error('Nobody has this code. Check it and try again.');
  const f = s.data();
  if (f.uid === u.uid) throw new Error('This is your own code! Give it to a friend.');
  const nick = C().nick() || 'Reader';
  await F().setDoc(ref('users', u.uid, 'friends', f.uid), { nick: f.nick || 'Reader' });
  await F().setDoc(ref('users', f.uid, 'requests', u.uid), { nick });
  return f.nick || 'Reader';
}
async function requests() { return read(col('users', me().uid, 'requests')); }
async function accept(uid) {
  const u = me(), p = await getProfile(uid);
  await F().setDoc(ref('users', u.uid, 'friends', uid), { nick: p.nick || 'Reader' });
  await F().deleteDoc(ref('users', u.uid, 'requests', uid));
}
const decline = async uid => F().deleteDoc(ref('users', me().uid, 'requests', uid));
const removeFriend = async uid => F().deleteDoc(ref('users', me().uid, 'friends', uid));
// my friends: 'friends' when they added me back, 'sent' while they have not answered yet
async function friends() {
  const u = me(), mine = await read(col('users', u.uid, 'friends'));
  return Promise.all(mine.map(async f => {
    let mutual = false;
    try { mutual = (await F().getDoc(ref('users', f.id, 'friends', u.uid))).exists(); } catch (e) { /* not allowed = not friends */ }
    const p = await getProfile(f.id);
    return { uid: f.id, status: mutual ? 'friends' : 'sent', ...p, nick: p.nick || f.nick };
  }));
}

// ------------------------------------------------------------ duels
async function createDuel(friend) {
  const u = me(), all = STORIES.map(s => s.id);
  const rnd = Progress.mulberry32((Math.random() * 4294967296) >>> 0);
  for (let i = all.length - 1; i > 0; i--) { const j = (rnd() * (i + 1)) | 0; [all[i], all[j]] = [all[j], all[i]]; }
  const d = {
    from: u.uid, to: friend.uid, players: [u.uid, friend.uid], fromNick: C().nick() || 'Reader', toNick: friend.nick || 'Reader',
    ids: all.slice(0, 4), seed: (Math.random() * 4294967295) >>> 0, results: {}, createdAt: F().serverTimestamp(),
  };
  const r = F().doc(col('duels'));
  await F().setDoc(r, d);
  return r.id;
}
async function duels() {
  const u = me();
  const list = await read(F().query(col('duels'), F().where('players', 'array-contains', u.uid)));
  return list.sort((a, b) => ((b.createdAt && b.createdAt.seconds) || 9e9) - ((a.createdAt && a.createdAt.seconds) || 9e9)).slice(0, 30);
}
async function getDuel(id) { const s = await F().getDoc(ref('duels', id)); if (!s.exists()) throw new Error('This duel does not exist.'); return { id, ...s.data() }; }
async function submitDuel(id, time, moves) {
  const u = me();
  await F().updateDoc(ref('duels', id), { ['results.' + u.uid]: { time, moves } });
  return getDuel(id);
}
// who won: the faster time, then the fewer moves; null while someone has not played yet
function duelWinner(d) {
  const [a, b] = d.players.map(p => d.results && d.results[p]);
  if (!a || !b) return null;
  if (a.time !== b.time) return a.time < b.time ? d.players[0] : d.players[1];
  if (a.moves !== b.moves) return a.moves < b.moves ? d.players[0] : d.players[1];
  return 'draw';
}

window.SoliteraryNet = { getEvent, weeklyBoard, myEntry, submitWeekly, getProfile, addFriend, requests, accept, decline, removeFriend, friends, createDuel, duels, getDuel, submitDuel, duelWinner };
window.dispatchEvent(new CustomEvent('soliterary:net'));
