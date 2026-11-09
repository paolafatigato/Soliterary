/**
 * SOLITERARY - home page: Play, Categories, Events (weekly challenge), Profile (stats, medals, friends, duels).
 * Works without an account (stats and medals are saved on the device); the challenge, friends and duels need to be signed in.
 * Data: catalog.js (categories), progress.js (stats), net.js (cloud). The game itself is game.html.
 */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const P = window.Progress, CAT = window.CATALOG;
  const FREE_CATEGORY_PLAY = false;      // false: playing stories of a category (and choosing them) is a Pro feature. true = for everybody.
  const story = id => STORIES.find(s => s.id === id);
  const cloud = () => window.SoliteraryCloud, net = () => window.SoliteraryNet;
  const me = () => (cloud() && cloud().user()) || null;
  const toast = (t, ms) => { const el = $('toast'); el.textContent = t; el.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('show'), ms || 2600); };
  const AVATARS = ['#f06054', '#0b4e87', '#4e964c', '#8e3db5', '#de3796', '#2e6890', '#c9402f', '#67288a'];
  const avatar = nick => `<span class="avatar" style="--bg:${AVATARS[P.hash(nick || '?') % AVATARS.length]}">${esc((nick || '?').trim().charAt(0).toUpperCase())}</span>`;
  const when = s => { s = Math.max(0, s); const d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60); return d ? `${d}d ${h}h` : h ? `${h}h ${m}m` : `${m}m`; };

  // ============================================================ navigation
  const NAV = [['home', '🎮', 'Play'], ['categories', '🗂️', 'Categories'], ['events', '🏆', 'Events'], ['profile', '👤', 'Profile']];
  let screen = 'home', profTab = 'stats', catKind = 'authors';
  $('tabsBottom').innerHTML = NAV.map(n => `<button data-go="${n[0]}"><i>${n[1]}</i>${n[2]}</button>`).join('');
  $('tabsTop').classList.add('top-nav');
  $('tabsTop').innerHTML = NAV.map(n => `<button data-go="${n[0]}">${n[1]} ${n[2]}</button>`).join('');

  function go(name, tab) {
    screen = name;
    if (tab) profTab = tab;
    document.querySelectorAll('.screen').forEach(s => { s.hidden = s.id !== 's-' + name; });
    document.querySelectorAll('[data-go]').forEach(b => { if (b.closest('.tabs')) b.classList.toggle('on', b.dataset.go === name); });
    if (location.hash.slice(1) !== (tab || name)) history.replaceState(null, '', '#' + (tab || name));
    window.scrollTo(0, 0);
    render();
  }
  function fromHash() {
    const h = location.hash.slice(1);
    if (['friends', 'duels', 'medals', 'stats', 'library'].includes(h)) go('profile', h);
    else go(NAV.some(n => n[0] === h) ? h : 'home');
  }
  document.addEventListener('click', e => {
    const g = e.target.closest('[data-go]');
    if (g) { e.preventDefault(); go(g.dataset.go, g.dataset.tab); }
  });
  window.addEventListener('hashchange', fromHash);

  function render() {
    ({ home: renderHome, categories: renderCats, events: renderEvents, profile: renderProfile })[screen]();
    const st = P.stats(), s = P.streakNow(st);
    $('streakChip').hidden = !s; $('streakChip').textContent = '🔥 ' + s;
  }

  // ============================================================ HOME
  function renderHome() {
    const lines = STORIES.slice().sort(() => Math.random() - .5).slice(0, 4);
    $('fan').innerHTML = lines.map(s => `<div class="c"><em>${s.emoji}</em>${esc(s.lines[0])}</div>`).join('');
    const n = P.solved().length, lv = P.level(n), pct = Math.round(n / STORIES.length * 100);
    $('homeProgress').innerHTML = `<div class="bar-top"><span>${lv.emoji} ${lv.name}</span><span>📖 ${n}/${STORIES.length} stories unlocked</span></div>
      <div class="bar"><i style="width:${Math.max(pct, 2)}%"></i></div>
      <div class="bar-note">${n ? `<a href="#library" class="liblink" data-go="profile" data-tab="library">📖 Read my ${n} unlocked ${n === 1 ? 'story' : 'stories'}</a> · ` : ''}${lv.next ? `${lv.next - n} more stories to become a ${lv.nextName}` : 'You reached the top level!'}</div>`;
    $('tileCat').textContent = `${STORIES.length} stories · ${CAT.groups('authors').length} authors`;
    const wk = P.weekId(), plan = P.weekPlan(wk);
    $('tileEvent').textContent = `${plan.emoji} ${plan.theme} week · ends in ${when((P.weekEnd(wk) - Date.now()) / 1000)}`;
    const st = P.stats();
    $('tileProf').textContent = st.cleared ? `${st.cleared} tables cleared${P.streakNow(st) ? ' · 🔥 ' + P.streakNow(st) + ' days' : ''}` : 'Stats, medals, friends, duels';
  }

  // ============================================================ CATEGORIES
  document.querySelectorAll('#catKinds button').forEach(b => b.addEventListener('click', () => {
    catKind = b.dataset.kind;
    document.querySelectorAll('#catKinds button').forEach(x => x.classList.toggle('on', x === b));
    renderCats();
  }));
  $('catSearch').addEventListener('input', renderCats);

  function renderCats() {
    const solved = new Set(P.solved()), q = $('catSearch').value.trim().toLowerCase();
    // the search also finds a story title: it shows the categories that contain it
    const list = CAT.groups(catKind).filter(g => !q || g.name.toLowerCase().includes(q) || g.ids.some(id => story(id).title.toLowerCase().includes(q)));
    $('cats').innerHTML = list.length ? list.map((g, i) => {
      const done = g.ids.filter(id => solved.has(id)).length;
      return `<button class="cat k${i % 6}" data-cat="${esc(g.key)}"><i>${g.emoji}</i><b>${esc(g.name)}</b><small>${done}/${g.ids.length} stories</small><span class="mini"><u style="width:${done / g.ids.length * 100}%"></u></span></button>`;
    }).join('') : '<div class="empty">Nothing found. Try another word.</div>';
  }
  $('cats').addEventListener('click', e => { const b = e.target.closest('[data-cat]'); if (b) openCategory(catKind, b.dataset.cat); });

  let picked = [];
  function openCategory(kind, key) {
    const g = CAT.group(kind, key); if (!g) return;
    picked = [];
    const solved = new Set(P.solved());
    const done = g.ids.filter(id => solved.has(id)).length;
    $('sheet').innerHTML = `<button class="btn small x" data-close>✕</button>
      <h2>${g.emoji} ${esc(g.name)}</h2>
      <div class="bar"><i style="width:${Math.max(done / g.ids.length * 100, 2)}%"></i></div>
      <div class="bar-note">${done}/${g.ids.length} stories unlocked${done === g.ids.length ? ' · 🏅 you are a master of this category!' : ''}</div>
      <ul class="pick-list">${g.ids.map(id => { const s = story(id); return `<li><button class="pick" data-pick="${id}"><i>${s.emoji}</i><span><b>${esc(s.title)}</b><small>${s.source ? esc(s.source.book + ' · ' + s.source.author) : 'Soliterary original'}</small></span><span class="ok ${solved.has(id) ? '' : 'todo'}">✅</span></button></li>`; }).join('')}</ul>
      <div class="go"><button class="btn main" id="goCat"></button><div class="hint" id="goHint"></div></div>`;
    $('sheet').dataset.cat = kind + ':' + key;
    $('sheetBg').hidden = false;
    updateGo(g);
  }
  function updateGo(g) {
    const pro = FREE_CATEGORY_PLAY || (cloud() && cloud().isPro());
    $('goCat').textContent = (pro ? '▶ ' : '🔒 ') + (picked.length ? (picked.length < 4 ? `Play: ${picked.length} chosen + ${4 - picked.length} random` : 'Play these 4') : 'Play 4 random stories from here');
    $('goHint').textContent = pro ? 'Tap stories to choose them (up to 4). The others are picked for you.' : 'Choosing stories and playing a category is a Pro feature.';
    document.querySelectorAll('.pick').forEach(p => p.classList.toggle('on', picked.includes(p.dataset.pick)));
  }
  $('sheet').addEventListener('click', e => {
    const k = $('sheet').dataset.cat || '', kind = k.split(':')[0], key = k.slice(kind.length + 1), g = CAT.group(kind, key);
    if (e.target.closest('[data-close]')) { $('sheetBg').hidden = true; return; }
    const p = e.target.closest('[data-pick]');
    if (p) {
      const id = p.dataset.pick;
      if (picked.includes(id)) picked = picked.filter(x => x !== id);
      else if (picked.length < 4) picked.push(id); else toast('Four stories at most: the table has four piles.');
      updateGo(g); return;
    }
    if (e.target.closest('#goCat')) {
      if (!(FREE_CATEGORY_PLAY || (cloud() && cloud().isPro()))) { proInfo(); return; }
      location.href = 'game.html?cat=' + encodeURIComponent(k) + (picked.length ? '&stories=' + picked.join(',') : '');
    }
  });
  $('sheetBg').addEventListener('click', e => { if (e.target === $('sheetBg')) $('sheetBg').hidden = true; });

  function proInfo() {
    $('sheetBg').hidden = true;
    $('modalBox').innerHTML = `<h2>⭐ Soliterary Pro</h2>
      <p>Free: unlimited random games, the weekly challenge, friends and duels.</p>
      <p><b>Pro</b> lets you choose the stories: play your favorite authors, topics and genres, and win the medals of the masters.</p>
      <p>Pro is coming soon!</p><div class="row"><button class="btn" data-close-modal>Got it</button></div>`;
    $('modal').hidden = false;
  }
  $('modal').addEventListener('click', e => { if (e.target === $('modal') || e.target.closest('[data-close-modal]')) $('modal').hidden = true; });

  // ============================================================ EVENTS: the weekly challenge
  let boardTab = 'time';
  async function renderEvents() {
    const box = $('eventBox'), wk = P.weekId(), plan = P.weekPlan(wk);
    const end = P.weekEnd(wk), n = net(), u = me();
    const head = (ev, mineHtml, cta) => `<div class="event">
      <div class="ev-top"><h3>🏆 Weekly challenge</h3><span class="count">⏳ ${when((end - Date.now()) / 1000)} left</span></div>
      <div class="when">${ev.emoji} ${esc(ev.theme)} week · ${wk.replace('-W', ' · week ')}</div>
      <div class="ev-stories">${ev.ids.map(id => `<span>${story(id).emoji} ${esc(story(id).title)}</span>`).join('')}</div>
      <p style="margin:0 0 10px;font-weight:700">The same 4 stories and the same deal for everybody. Who clears the table <b>fastest</b>? Who needs the <b>fewest moves</b>?</p>
      ${mineHtml || ''}<div class="ev-cta">${cta}</div></div>`;
    if (!u) {
      box.innerHTML = head(plan, '', '<button class="btn main" data-signin>Sign in to join</button>') + '<div class="note">Sign in to see the leaderboard and play the challenge. It takes ten seconds!</div>';
      return;
    }
    box.innerHTML = head(plan, '', `<a class="btn main" href="game.html?week=${wk}">▶ Play</a>`) + '<div class="spin">Loading the leaderboard…</div>';
    if (!n) { box.lastElementChild.textContent = 'No connection to the leaderboard. Try again later.'; return; }
    try {
      const ev = await n.getEvent(wk), [mine, board, last] = await Promise.all([n.myEntry(wk), n.weeklyBoard(wk), n.weeklyBoard(P.prevWeek(wk)).catch(() => null)]);
      if (screen !== 'events') return;
      const mineHtml = mine ? `<div class="mine"><span>Your best: ⚡ ${P.fmtT(mine.bestTime)}</span><span>🎯 ${mine.bestMoves} moves</span><span>🔁 ${mine.attempts} tries</span></div>` : '';
      const cta = `<a class="btn main" href="game.html?week=${wk}">${mine ? '▶ Play again' : '▶ Play'}</a>`;
      const fast = board.byTime[0], few = board.byMoves[0];
      const rows = (boardTab === 'time' ? board.byTime : board.byMoves).slice(0, 10);
      box.innerHTML = head(ev, mineHtml, cta) + `
        <div class="champs">
          <div class="champ"><small>⚡ FASTEST</small>${fast ? `<b>${esc(fast.nick)}</b><span>${P.fmtT(fast.bestTime)}</span>` : '<b>—</b><span>Be the first!</span>'}</div>
          <div class="champ"><small>🎯 FEWEST MOVES</small>${few ? `<b>${esc(few.nick)}</b><span>${few.bestMoves}</span>` : '<b>—</b><span>Be the first!</span>'}</div>
        </div>
        <div class="seg"><button data-bt="time" class="${boardTab === 'time' ? 'on' : ''}">⚡ By time</button><button data-bt="moves" class="${boardTab === 'moves' ? 'on' : ''}">🎯 By moves</button></div>
        ${rows.length ? `<table class="board"><tr><th>#</th><th>Player</th><th>⚡ Time</th><th>🎯 Moves</th></tr>${rows.map((r, i) => `<tr class="${r.id === u.uid ? 'me' : ''}"><td>${i + 1}</td><td>${esc(r.nick)}</td><td>${P.fmtT(r.bestTime)}</td><td>${r.bestMoves}</td></tr>`).join('')}</table>`
          : '<div class="note">Nobody has played yet this week. Be the first champion!</div>'}
        ${last && last.byTime[0] ? `<div class="past">Last week's champions: ⚡ <b>${esc(last.byTime[0].nick)}</b> ${P.fmtT(last.byTime[0].bestTime)} · 🎯 <b>${esc(last.byMoves[0].nick)}</b> ${last.byMoves[0].bestMoves} moves</div>` : ''}`;
    } catch (e) {
      console.warn('Soliterary: events', e);
      box.lastElementChild.innerHTML = 'The leaderboard is not available right now.<br><small>' + esc(e.message || '') + '</small>';
    }
  }
  $('eventBox').addEventListener('click', e => {
    const b = e.target.closest('[data-bt]'); if (b) { boardTab = b.dataset.bt; renderEvents(); }
  });

  // ============================================================ PROFILE
  const gate = (emoji, title, text) => `<div class="gate"><i>${emoji}</i><h3>${title}</h3><p>${text}</p><button class="btn main" data-signin>Sign in</button></div>`;
  document.querySelectorAll('#profTabs button').forEach(b => b.addEventListener('click', () => { profTab = b.dataset.pt; history.replaceState(null, '', '#' + profTab); renderProfile(); }));
  document.addEventListener('click', e => { if (e.target.closest('[data-signin]') && cloud()) cloud().signIn(); });

  let social = { friends: null, requests: null, duels: null };      // loaded from the cloud when the profile opens

  function renderProfile() {
    document.querySelectorAll('#profTabs button').forEach(b => b.classList.toggle('on', b.dataset.pt === profTab));
    const u = me(), n = P.solved().length, lv = P.level(n), st = P.stats();
    const nick = (cloud() && cloud().nick()) || (u && (u.displayName || '').split(' ')[0]) || 'Guest reader';
    const pct = lv.next ? Math.round((n - lv.from) / (lv.next - lv.from) * 100) : 100;
    $('profHead').innerHTML = `<div class="ph">${avatar(nick)}
      <div><h2><span id="nickBox">${esc(nick)}</span>${u ? ' <button class="btn small" id="editNick" title="Change the name">✏️</button>' : ''}</h2>
        <div class="lv">${lv.emoji} ${lv.name} · ${n} stories</div><div class="bar"><i style="width:${Math.max(pct, 3)}%"></i></div></div>
      ${u && cloud().code() ? `<div class="code"><span>Your friend code <b>${cloud().code()}</b></span><button class="btn small" id="copyCode">Copy</button></div>` : ''}
      ${u ? '' : '<div class="code"><span>Sign in to keep your progress and play with friends</span><button class="btn small main" data-signin>Sign in</button></div>'}</div>`;
    const body = $('profBody');
    if (profTab === 'stats') body.innerHTML = statsHtml(st);
    else if (profTab === 'medals') body.innerHTML = medalsHtml(st);
    else if (profTab === 'library') body.innerHTML = libraryHtml();
    else if (!u) body.innerHTML = profTab === 'friends' ? gate('👥', 'Play with friends', 'Add friends with their code, compare your stats and challenge them to a duel.') : gate('⚔️', 'Duels', 'Challenge a friend: same stories, same deal, the faster player wins.');
    else if (profTab === 'friends') friendsView();
    else duelsView();
  }
  $('profHead').addEventListener('click', async e => {
    if (e.target.closest('#copyCode')) {
      try { await navigator.clipboard.writeText(cloud().code()); toast('Code copied!'); } catch (x) { toast('Your code: ' + cloud().code()); }
    }
    if (e.target.closest('#editNick')) {
      $('nickBox').innerHTML = `<span class="nick-edit"><input id="nickIn" maxlength="16" value="${esc(cloud().nick())}"><button class="btn small main" id="saveNick">OK</button></span>`;
      $('nickIn').focus();
    }
    if (e.target.closest('#saveNick')) {
      try { await cloud().setNick($('nickIn').value); toast('Name saved'); } catch (x) { toast('Could not save the name.'); }
      renderProfile();
    }
  });

  // ---------- stats
  function statsHtml(st) {
    const solved = new Set(P.solved());
    const avg = st.cleared ? st.totalTime / st.cleared : 0;
    const tiles = [
      [`${solved.size}/${STORIES.length}`, 'Stories unlocked'], [st.cleared, 'Tables cleared'], [st.played, 'Games started'], [st.bestTime ? P.fmtT(st.bestTime) : '—', 'Best time'],
      [st.bestMoves || '—', 'Fewest moves'], [avg ? P.fmt(avg) : '—', 'Average time'], [`🔥 ${P.streakNow(st)}`, 'Day streak'], [st.bestStreak || 0, 'Best streak'],
    ];
    const bar = g => { const d = g.ids.filter(id => solved.has(id)).length; return `<div class="row"><span>${g.emoji} ${esc(g.name)}</span><div class="bar"><i style="width:${d / g.ids.length * 100}%"></i></div><small>${d}/${g.ids.length}</small></div>`; };
    return `<div class="stat-grid">${tiles.map(t => `<div class="stat"><b>${t[0]}</b><small>${t[1]}</small></div>`).join('')}</div>
      <div class="card"><h3>📚 Genres explored</h3><div class="bars">${CAT.groups('genres').map(bar).join('')}</div></div>
      <div class="card"><h3>✒️ Favorite authors</h3><div class="bars">${CAT.groups('authors').slice(0, 6).map(bar).join('')}</div></div>
      ${me() ? '' : '<div class="note">Your stats are saved on this device. Sign in to keep them forever.</div>'}`;
  }

  // ---------- library: the stories already completed, to read again
  function libraryHtml() {
    const solved = new Set(P.solved()), ids = STORIES.filter(s => solved.has(s.id));
    if (!ids.length) return '<div class="gate"><i>📖</i><h3>Your library is empty</h3><p>Every story you complete is kept here, so you can read it again whenever you like.</p><a class="btn main" href="game.html">▶ Play</a></div>';
    return `<div class="note">📖 ${ids.length} of ${STORIES.length} stories unlocked. Tap one to read it.</div>
      <ul class="pick-list lib">${ids.map(s => `<li><button class="pick" data-read="${s.id}"><i>${s.emoji}</i><span><b>${esc(s.title)}</b><small>${s.source ? esc(s.source.book + ' · ' + s.source.author) : 'Soliterary original'}</small></span><span class="ok">📖</span></button></li>`).join('')}</ul>`;
  }
  function readStory(id) {
    const s = story(id); if (!s) return;
    $('sheet').dataset.cat = '';
    $('sheet').innerHTML = `<button class="btn small x" data-close>✕</button><h2>${s.emoji} ${esc(s.title)}</h2>
      <p class="told">${esc(s.lines.join(' '))}</p>
      ${s.source ? `<p class="src">📖 Inspired by <b>“${esc(s.source.book)}”</b> by ${esc(s.source.author)}. Read the original!</p>` : ''}
      <div class="go"><button class="btn main" data-close>Close</button></div>`;
    $('sheetBg').hidden = false;
  }
  $('profBody').addEventListener('click', e => { const r = e.target.closest('[data-read]'); if (r) readStory(r.dataset.read); });

  // ---------- medals
  function medalList(st) {
    const solved = new Set(P.solved()), nS = solved.size, M = [];
    const add = (emoji, name, desc, val, goal, inverse) => M.push({ emoji, name, desc, val, goal, on: inverse ? val > 0 && val <= goal : val >= goal, inverse });
    [[1, '🌱', 'First page'], [10, '📖', 'Bookworm'], [25, '📚', 'Book club'], [50, '🗝️', 'Librarian'], [STORIES.length, '👑', 'Literary legend']]
      .forEach(([g, e, nm]) => add(e, nm, `Unlock ${g === STORIES.length ? 'all ' : ''}${g} ${g === 1 ? 'story' : 'stories'}`, nS, g));
    [[1, '🧹', 'Table cleared'], [10, '🧼', 'Tidy reader'], [50, '🏆', 'Table master']].forEach(([g, e, nm]) => add(e, nm, `Clear the table ${g} ${g === 1 ? 'time' : 'times'}`, st.cleared, g));
    add('⚡', 'Speed reader', 'Clear a table in under 5 minutes', st.bestTime, 300, true);
    add('🚀', 'Lightning', 'Clear a table in under 3 minutes', st.bestTime, 180, true);
    add('🎯', 'Sharp mind', 'Clear a table in 70 moves or fewer', st.bestMoves, 70, true);
    [[3, '🔥', 'On fire'], [7, '🌋', 'Unstoppable'], [30, '☄️', 'Legendary habit']].forEach(([g, e, nm]) => add(e, nm, `Play ${g} days in a row`, st.bestStreak, g));
    [[1, '🥇', 'Challenger'], [5, '🎖️', 'Weekly regular']].forEach(([g, e, nm]) => add(e, nm, `Play ${g} weekly ${g === 1 ? 'challenge' : 'challenges'}`, st.weeks.length, g));
    const fr = social.friends ? social.friends.filter(f => f.status === 'friends').length : 0;
    const wins = social.duels ? social.duels.filter(d => net().duelWinner(d) === (me() && me().uid)).length : 0;
    [[1, '🤝', 'Not alone'], [5, '🎉', 'Reading circle']].forEach(([g, e, nm]) => add(e, nm, `Have ${g} ${g === 1 ? 'friend' : 'friends'}`, fr, g));
    [[1, '⚔️', 'First blood'], [5, '🛡️', 'Duelist']].forEach(([g, e, nm]) => add(e, nm, `Win ${g} ${g === 1 ? 'duel' : 'duels'}`, wins, g));
    const masters = [];
    CAT.groups('authors').filter(g => g.ids.length >= 3 && g.key !== 'Soliterary originals').forEach(g => masters.push({ emoji: g.emoji, name: (g.key === 'Myths & traditional tales' ? 'Myth' : g.name.split(' ').pop()) + ' master', desc: `Unlock all ${g.ids.length} stories by ${g.name}`, val: g.ids.filter(id => solved.has(id)).length, goal: g.ids.length }));
    CAT.groups('genres').forEach(g => masters.push({ emoji: g.emoji, name: g.name + ' master', desc: `Unlock all ${g.ids.length} stories in ${g.name}`, val: g.ids.filter(id => solved.has(id)).length, goal: g.ids.length }));
    masters.forEach(m => { m.on = m.val >= m.goal; });
    return { M, masters };
  }
  function medalsHtml(st) {
    const { M, masters } = medalList(st);
    const card = m => `<div class="medal ${m.on ? 'on' : ''}"><i>${m.emoji}</i><b>${esc(m.name)}</b><small>${esc(m.desc)}</small>${m.inverse || m.on ? '' : `<div class="bar"><i style="width:${Math.max(m.val / m.goal * 100, 3)}%"></i></div><small>${m.val}/${m.goal}</small>`}</div>`;
    const got = M.concat(masters).filter(m => m.on).length;
    return `<div class="note">🏅 ${got} of ${M.length + masters.length} medals won</div>
      <div class="medals">${M.map(card).join('')}</div>
      <div class="h4">Masters: unlock every story of an author or genre</div>
      <div class="medals">${masters.sort((a, b) => b.on - a.on || b.val / b.goal - a.val / a.goal).map(card).join('')}</div>`;
  }

  // ---------- friends
  async function friendsView() {
    const body = $('profBody');
    body.innerHTML = `<div class="card"><h3>➕ Add a friend</h3><div class="form"><input id="fCode" maxlength="7" placeholder="Friend code" autocomplete="off"><button class="btn main" id="fAdd">Add</button></div><div class="err" id="fMsg"></div></div><div id="fList"><div class="spin">Loading friends…</div></div>`;
    await loadFriends();
  }
  async function loadFriends() {
    const n = net(); if (!n) { $('fList').textContent = 'No connection.'; return; }
    try {
      [social.friends, social.requests] = await Promise.all([n.friends(), n.requests()]);
      updateDots();
      if (profTab !== 'friends' || !$('fList')) return;
      const reqs = social.requests.map(r => `<div class="person">${avatar(r.nick)}<div><b>${esc(r.nick)}</b><small>wants to be your friend</small></div><div class="acts"><button class="btn small main" data-acc="${r.id}">Accept</button><button class="btn small" data-dec="${r.id}">No</button></div></div>`).join('');
      const fr = social.friends.map(f => `<div class="person">${avatar(f.nick)}<div><b>${esc(f.nick)}</b>${f.status === 'friends'
        ? `<small>📖 ${f.solvedCount || 0} stories · 🧹 ${f.cleared || 0} tables${f.bestTime ? ' · ⚡ ' + P.fmtT(f.bestTime) : ''}${f.streak ? ' · 🔥 ' + f.streak : ''}</small>`
        : '<small>waiting for them to accept</small>'}</div>
        <div class="acts">${f.status === 'friends' ? `<button class="btn small main" data-duel="${f.uid}">⚔️ Duel</button>` : '<span class="tag">pending</span>'}<button class="btn small" data-rm="${f.uid}" title="Remove">✕</button></div></div>`).join('');
      $('fList').innerHTML = (reqs ? `<div class="h4">Friend requests</div>${reqs}` : '') + `<div class="h4">Your friends (${social.friends.filter(f => f.status === 'friends').length})</div>${fr || '<div class="note">No friends yet. Share your code or type theirs above!</div>'}`;
    } catch (e) { console.warn('Soliterary: friends', e); if ($('fList')) $('fList').innerHTML = '<div class="note">Friends are not available right now.<br><small>' + esc(e.message || '') + '</small></div>'; }
  }
  $('profBody').addEventListener('click', async e => {
    const n = net(), t = e.target;
    try {
      if (t.closest('#fAdd')) {
        $('fMsg').className = 'err'; $('fMsg').textContent = '';
        const name = await n.addFriend($('fCode').value);
        $('fMsg').className = 'okk'; $('fMsg').textContent = `Request sent to ${name}!`; $('fCode').value = '';
        loadFriends();
      } else if (t.closest('[data-acc]')) { await n.accept(t.closest('[data-acc]').dataset.acc); toast('Friend added!'); loadFriends(); }
      else if (t.closest('[data-dec]')) { await n.decline(t.closest('[data-dec]').dataset.dec); loadFriends(); }
      else if (t.closest('[data-rm]')) { if (confirm('Remove this friend?')) { await n.removeFriend(t.closest('[data-rm]').dataset.rm); loadFriends(); } }
      else if (t.closest('[data-duel]')) {
        const f = social.friends.find(x => x.uid === t.closest('[data-duel]').dataset.duel);
        const id = await n.createDuel(f); location.href = 'game.html?duel=' + id;
      }
    } catch (err) {
      if ($('fMsg')) { $('fMsg').className = 'err'; $('fMsg').textContent = err.message || 'Something went wrong.'; } else toast(err.message || 'Something went wrong.');
    }
  });

  // ---------- duels
  async function duelsView() {
    const body = $('profBody');
    body.innerHTML = '<div class="spin">Loading duels…</div>';
    const n = net(); if (!n) { body.textContent = 'No connection.'; return; }
    try {
      social.duels = await n.duels(); updateDots();
      if (profTab !== 'duels') return;
      const uid = me().uid;
      let w = 0, l = 0, dr = 0;
      const rows = social.duels.map(d => {
        const other = d.from === uid ? d.toNick : d.fromNick, mine = d.results && d.results[uid], their = d.results && d.results[d.players.find(p => p !== uid)];
        const win = n.duelWinner(d);
        if (win === uid) w++; else if (win === 'draw') dr++; else if (win) l++;
        const tag = win === uid ? '<span class="tag win">You won</span>' : win === 'draw' ? '<span class="tag">Draw</span>' : win ? '<span class="tag lose">You lost</span>' : !mine ? '<span class="tag turn">Your turn</span>' : '<span class="tag">Waiting</span>';
        const line = mine ? `You ${P.fmtT(mine.time)} · ${mine.moves} moves${their ? ` — ${esc(other)} ${P.fmtT(their.time)} · ${their.moves}` : ''}` : `${esc(other)} challenged you`;
        return `<div class="person">${avatar(other)}<div><b>vs ${esc(other)} ${tag}</b><small>${line}</small></div><div class="acts"><a class="btn small ${mine ? '' : 'main'}" href="game.html?duel=${d.id}">${mine ? 'See' : '▶ Play'}</a></div></div>`;
      }).join('');
      body.innerHTML = `<div class="card"><h3>⚔️ Duels</h3><p style="margin:0 0 6px;font-weight:600">Same stories, same deal. The faster time wins (then the fewer moves). Challenge a friend from the Friends tab!</p>
        <div class="wl"><span>🏅 ${w} won</span><span>💔 ${l} lost</span><span>🤝 ${dr} draws</span></div></div>
        ${rows || '<div class="note">No duels yet. Go to <b>Friends</b> and press ⚔️ Duel next to a friend.</div>'}`;
    } catch (e) { console.warn('Soliterary: duels', e); body.innerHTML = '<div class="note">Duels are not available right now.<br><small>' + esc(e.message || '') + '</small></div>'; }
  }

  // a red dot where something waits for you: a friend request, a duel you have not played
  function updateDots() {
    const u = me();
    const req = social.requests ? social.requests.length : 0;
    const turn = u && social.duels ? social.duels.filter(d => !(d.results && d.results[u.uid])).length : 0;
    $('dotFriends').hidden = !req; $('dotDuels').hidden = !turn;
    document.querySelectorAll('.tabs [data-go="profile"]').forEach(b => { let el = b.querySelector('.badge'); if ((req || turn) && !el) { el = document.createElement('span'); el.className = 'badge'; b.appendChild(el); } if (el && !(req || turn)) el.remove(); });
  }
  async function loadSocial() {       // after signing in: friends and duels in the background (for the dots and the medals)
    const n = net(), u = me();
    if (!n || !u) { social = { friends: null, requests: null, duels: null }; updateDots(); return; }
    try { [social.friends, social.requests, social.duels] = await Promise.all([n.friends(), n.requests(), n.duels()]); } catch (e) { console.warn('Soliterary: social', e); }
    updateDots();
  }

  // ============================================================ start
  let socialFor = null;
  const refresh = () => {
    render();
    const u = me(); const id = u ? u.uid : null;
    if (id !== socialFor) { socialFor = id; loadSocial(); }
  };
  window.addEventListener('soliterary:synced', refresh);
  window.addEventListener('soliterary:net', refresh);
  window.addEventListener('soliterary:stats', () => { if (screen === 'home' || screen === 'profile') render(); });
  window.addEventListener('focus', () => { if (screen === 'events' || screen === 'profile') render(); });   // coming back from a game
  fromHash();
})();
