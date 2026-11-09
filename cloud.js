/**
 * SOLITERARY - accounts and cloud save (Firebase Auth + Firestore).
 * Loaded as a module. script.js talks to it only through the browser: it fires 'soliterary:solved' when a story is completed,
 * and this file writes the merged list into localStorage and fires 'soliterary:synced'.
 * Firestore: users/{uid} = { name, nick, email, pro, solved: [story ids], stats, code, createdAt, updatedAt }  (private; rules: firestore.rules)
 *            profiles/{uid} = { nick, code, solvedCount, cleared, ... }  (readable by signed-in players: friends and leaderboards)
 *            codes/{CODE} = { uid, nick }  (friend codes)
 * The social side (weekly challenge, friends, duels) is in net.js, which uses window.SoliteraryCloud.
 */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {
  getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut,
  createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, updateProfile,
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {
  getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc, arrayUnion, serverTimestamp,
  collection, query, where, orderBy, limit, getDocs,
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyDQesOyL4nbJ1jWywsHhUWb4RBcdTJWFes',     // a web key is public by design: the data is protected by firestore.rules
  authDomain: 'soliterary-eabc7.firebaseapp.com',
  projectId: 'soliterary-eabc7',
  storageBucket: 'soliterary-eabc7.firebasestorage.app',
  messagingSenderId: '100009416662',
  appId: '1:100009416662:web:8171e4b30e63bfb649f677',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const OWNER_EMAIL = 'paola.fatigato@gmail.com';
const SOLVED_KEY = 'soliterary-solved';
const RULES_KEY = 'soliterary-rules-seen';
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const readSolved = () => { try { return JSON.parse(localStorage.getItem(SOLVED_KEY)) || []; } catch (e) { return []; } };
const writeSolved = a => { try { localStorage.setItem(SOLVED_KEY, JSON.stringify(a)); } catch (e) { /* no storage: fine */ } };
const union = (a, b) => [...new Set([...(a || []), ...(b || [])])];

let user = null;
let pro = false;
let nick = '', code = '';
let resolveReady;
const ready = new Promise(r => { resolveReady = r; });       // the first answer about who is signed in (and the first sync) is done
window.SoliteraryCloud = {
  user: () => user, isPro: () => pro, nick: () => nick, code: () => code, ready,
  db, fs: { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, query, where, orderBy, limit, getDocs, serverTimestamp },
  signIn: () => showAccount('in'),
  async setNick(n) {
    n = String(n || '').trim().slice(0, 16);
    if (!user || !n) return false;
    nick = n;
    await setDoc(doc(db, 'users', user.uid), { nick, updatedAt: serverTimestamp() }, { merge: true });
    if (code) setDoc(doc(db, 'codes', code), { uid: user.uid, nick }).catch(() => {});
    await publish();
    window.dispatchEvent(new CustomEvent('soliterary:synced'));
    return true;
  },
};
const firstWord = u => ((u.displayName || '').split(' ')[0] || (u.email || 'Reader').split('@')[0]).slice(0, 16);
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';           // no 0/O, 1/I

// a short code to give to friends; codes/{CODE} says whose it is
async function makeCode(u) {
  for (let i = 0; i < 6; i++) {
    const c = Array.from({ length: 6 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');
    try {
      if ((await getDoc(doc(db, 'codes', c))).exists()) continue;
      await setDoc(doc(db, 'codes', c), { uid: u.uid, nick });
      return c;
    } catch (e) { console.warn('Soliterary: friend code', e); }
  }
  return '';
}

// the public card of the player (friends and leaderboards read it)
async function publish() {
  if (!user) return;
  const st = Progress.stats();
  try {
    await setDoc(doc(db, 'profiles', user.uid), {
      nick, code, solvedCount: readSolved().length, cleared: st.cleared, played: st.played, bestTime: st.bestTime, bestMoves: st.bestMoves,
      streak: Progress.streakNow(st), bestStreak: st.bestStreak, weeks: st.weeks.length, updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (e) { console.warn('Soliterary: profile not published', e); }
}

// ------------------------------------------------------------ saving
async function sync(u) {
  const ref = doc(db, 'users', u.uid);
  try {
    const snap = await getDoc(ref);
    const cloud = snap.exists() ? snap.data() : {};
    const solved = union(cloud.solved, readSolved());
    const stats = Progress.merge(cloud.stats, Progress.stats());
    nick = cloud.nick || firstWord(u);
    code = cloud.code || '';
    if (!snap.exists()) {
      await setDoc(ref, { name: u.displayName || '', nick, email: u.email || '', pro: false, solved, stats, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    } else {
      await updateDoc(ref, { solved, stats, nick, updatedAt: serverTimestamp() });
    }
    try { localStorage.setItem(Progress.STATS_KEY, JSON.stringify(stats)); } catch (e) { /* fine */ }
    writeSolved(solved);
    if (!code) { code = await makeCode(u); if (code) await updateDoc(ref, { code }); }
    await publish();
    // the rules open only on a new device with a new account: the account remembers that it has seen them
    if (cloud.rulesSeen) { try { localStorage.setItem(RULES_KEY, '1'); } catch (e) { /* fine */ } }
    else if (localStorage.getItem(RULES_KEY)) updateDoc(ref, { rulesSeen: true }).catch(() => {});
    pro = !!cloud.pro;
    if (!pro && u.email === OWNER_EMAIL) {           // the owner is Pro for free (firestore.rules checks the verified email)
      try { await updateDoc(ref, { pro: true }); pro = true; } catch (e) { console.warn('Soliterary: owner Pro refused (verify the email / use Google)', e); }
    }
    Progress.setPro(pro);
    writeSolved(solved);
    window.dispatchEvent(new CustomEvent('soliterary:synced'));
  } catch (e) {
    console.warn('Soliterary: cloud sync failed', e);
  }
}

window.addEventListener('soliterary:rules-seen', () => {
  if (user) setDoc(doc(db, 'users', user.uid), { rulesSeen: true }, { merge: true }).catch(() => {});
});

window.addEventListener('soliterary:solved', async e => {
  if (!user) return;
  try { await setDoc(doc(db, 'users', user.uid), { solved: arrayUnion(e.detail), updatedAt: serverTimestamp() }, { merge: true }); }
  catch (err) { console.warn('Soliterary: could not save the story', err); }
  publish();
});
let statsTimer = 0;
window.addEventListener('soliterary:stats', () => {          // the numbers change often: save them after a short pause
  if (!user) return;
  clearTimeout(statsTimer);
  statsTimer = setTimeout(async () => {
    try { await setDoc(doc(db, 'users', user.uid), { stats: Progress.stats(), updatedAt: serverTimestamp() }, { merge: true }); }
    catch (err) { console.warn('Soliterary: could not save the stats', err); }
    publish();
  }, 1500);
});

// ------------------------------------------------------------ the window
const NICE = {
  'auth/invalid-email': 'This email address does not look right.',
  'auth/missing-password': 'Write a password.',
  'auth/weak-password': 'The password needs at least 6 characters.',
  'auth/email-already-in-use': 'There is already an account with this email. Try to sign in.',
  'auth/invalid-credential': 'Wrong email or password.',
  'auth/user-not-found': 'Wrong email or password.',
  'auth/wrong-password': 'Wrong email or password.',
  'auth/too-many-requests': 'Too many tries. Wait a moment and try again.',
  'auth/popup-closed-by-user': '',
  'auth/cancelled-popup-request': '',
  'auth/network-request-failed': 'No internet connection.',
};
const niceError = e => (e.code in NICE ? NICE[e.code] : 'Something went wrong (' + (e.code || e.message) + ').');

function open(html) { $('modalBox').innerHTML = html; $('modal').hidden = false; }
function setError(t) { const el = $('authError'); if (el) el.textContent = t || ''; }

function showAccount(mode = 'in') {
  if (user) {
    const n = readSolved().length;
    open(`<h2>👤 ${esc(user.displayName || 'Your account')}</h2>
      <p>${esc(user.email || '')}${pro ? ' · <b>⭐ Pro</b>' : ''}</p>
      <p>Your unlocked stories are saved in the cloud: <b>${n}</b> so far. You can go on playing from any device.</p>
      <div class="row"><button class="btn btn-main" data-cloud="close">Back to the table</button><button class="btn" data-cloud="out">Sign out</button></div>`);
    return;
  }
  const up = mode === 'up';
  open(`<h2>${up ? 'Create your account' : 'Sign in'}</h2>
    <p>${up ? 'Save the stories you unlock and play from any device.' : 'Welcome back! Your unlocked stories are waiting.'}</p>
    <form id="authForm" class="auth">
      ${up ? '<input id="authName" type="text" placeholder="Your name" autocomplete="nickname" maxlength="30">' : ''}
      <input id="authEmail" type="email" placeholder="Email" autocomplete="email" required>
      <input id="authPass" type="password" placeholder="Password (6+ characters)" autocomplete="${up ? 'new-password' : 'current-password'}" required>
      <div class="auth-err" id="authError"></div>
      <button class="btn btn-main" type="submit">${up ? 'Create account' : 'Sign in'}</button>
    </form>
    <div class="row">
      <button class="btn" data-cloud="google">Continue with Google</button>
      <button class="btn" data-cloud="${up ? 'in' : 'up'}">${up ? 'I already have an account' : 'Create an account'}</button>
      ${up ? '' : '<button class="btn" data-cloud="reset">Forgot my password</button>'}
      <button class="btn" data-cloud="close">Close</button>
    </div>`);
  $('authForm').addEventListener('submit', async ev => {
    ev.preventDefault();
    setError('');
    const email = $('authEmail').value.trim(), pass = $('authPass').value;
    try {
      if (up) {
        const cred = await createUserWithEmailAndPassword(auth, email, pass);
        const name = ($('authName').value || '').trim();
        if (name) await updateProfile(cred.user, { displayName: name });
      } else {
        await signInWithEmailAndPassword(auth, email, pass);
      }
      $('modal').hidden = true;
    } catch (err) { setError(niceError(err)); }
  });
}

document.addEventListener('click', async e => {
  const b = e.target.closest('[data-cloud]');
  if (!b) return;
  const a = b.dataset.cloud;
  if (a === 'close') $('modal').hidden = true;
  else if (a === 'in' || a === 'up') showAccount(a);
  else if (a === 'out') { await signOut(auth); $('modal').hidden = true; }
  else if (a === 'google') {
    try { await signInWithPopup(auth, new GoogleAuthProvider()); $('modal').hidden = true; }
    catch (err) { setError(niceError(err)); }
  } else if (a === 'reset') {
    const email = ($('authEmail') && $('authEmail').value || '').trim();
    if (!email) { setError('Write your email above first.'); return; }
    try { await sendPasswordResetEmail(auth, email); setError('Done! Check your email.'); }
    catch (err) { setError(niceError(err)); }
  }
});

// ------------------------------------------------------------ who is playing
const btn = () => $('accountBtn');
onAuthStateChanged(auth, async u => {
  user = u;
  if (!u) { pro = false; nick = ''; code = ''; Progress.setPro(false); }
  if (btn()) btn().textContent = u ? '👤 ' + firstWord(u) : '👤 Sign in';
  if (u) await sync(u);
  else window.dispatchEvent(new CustomEvent('soliterary:synced'));
  if (u && btn()) btn().textContent = '👤 ' + (nick || firstWord(u));
  resolveReady();
});
if (btn()) btn().addEventListener('click', () => showAccount('in'));
