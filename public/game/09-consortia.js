/* ===== CONSORZI (clan) =====
   Pannello del consorzio: Cerca / Crea (senza consorzio), Chat / Membri / Info (con consorzio).
   Parla solo con /api/consortia (vedi backend/consortia.mjs). Tutto il testo dei giocatori si mostra
   come testo (esc / textContent), mai come HTML. Il pannello genera da solo italiano e inglese,
   quindi e' escluso dalla traduzione automatica (translate="no").
   Piano B per la demo: con ?clan=demo, o con il bottone che compare se il server non risponde,
   le stesse schermate girano con dati finti in memoria, senza rete. */
window.GNGCLAN = (function () {
  'use strict';
  const API = '/api/consortia';
  const SHAPES = ['shield', 'circle', 'hexagon', 'star', 'diamond'];
  const SYMBOLS = ['rocket', 'satellite', 'planet', 'moon', 'star', 'comet', 'telescope', 'orbit'];
  const COLORS = ['#f07b3f', '#2f6fd6', '#1e9e5a', '#d2443a', '#8a55d0', '#f2b83a', '#1fa2a8', '#22313b'];
  const ROLES = ['member', 'chief_engineer', 'vice', 'director'];
  /* Sticker degli Zorty: la posa viene dalle immagini di Zorty gia' nel gioco (host.sprite), ritagliata su testa e spalle,
     con un tondo colorato e un effetto SVG sopra. I codici sono gli stessi che il server accetta (backend/consortia.mjs).
     Gli sticker sbloccabili con i livelli si aggiungeranno qui con un campo lvl. */
  const STICKERS = {
    zorty_happy: { pose: 'entusiasta', bg: '#F2B83A', n: ['Zorty felice', 'Happy Zorty'], emoji: '😄', x: 44, y: 5, k: 132,
      fx: '<g fill="#fff"><path d="M14 30l2.4 5.6 5.6 2.4-5.6 2.4L14 46l-2.4-5.6L6 38l5.6-2.4z"/><path d="M86 18l1.8 4.2 4.2 1.8-4.2 1.8L86 30l-1.8-4.2-4.2-1.8 4.2-1.8z"/><path d="M84 62l1.5 3.5 3.5 1.5-3.5 1.5L84 72l-1.5-3.5L79 67l3.5-1.5z"/></g>' },
    zorty_cry: { pose: 'stanco', bg: '#2F6FD6', n: ['Zorty che piange', 'Crying Zorty'], emoji: '😢', x: 50, y: 6, k: 150,
      fx: '<path d="M66 50c1 7 0 13 2 21" fill="none" stroke="#8FD3FF" stroke-width="4.5" stroke-linecap="round" opacity=".9"/><g fill="#8FD3FF" stroke="#fff" stroke-width="1.6"><path d="M69 72c-2.6 5-4.2 7.6-4.2 10.2a4.2 4.2 0 0 0 8.4 0c0-2.6-1.6-5.2-4.2-10.2z"/><path d="M80 58c-2 4-3.4 6-3.4 8a3.4 3.4 0 0 0 6.8 0c0-2-1.4-4-3.4-8z"/><path d="M22 62c-2 4-3.4 6-3.4 8a3.4 3.4 0 0 0 6.8 0c0-2-1.4-4-3.4-8z"/></g>' },
    zorty_angry: { pose: 'stop', bg: '#D2443A', n: ['Zorty arrabbiato', 'Angry Zorty'], emoji: '😠', x: 50, y: 6, k: 150,
      fx: '<g fill="none" stroke-linecap="round"><path d="M33 36l13 6M67 36l-13 6" stroke="#1B2A44" stroke-width="5"/>' +
        '<path d="M75 9c0 6 2 8 8 8M91 9c0 6-2 8-8 8M75 29c0-6 2-8 8-8M91 29c0-6-2-8-8-8" stroke="#fff" stroke-width="7"/><path d="M75 9c0 6 2 8 8 8M91 9c0 6-2 8-8 8M75 29c0-6 2-8 8-8M91 29c0-6-2-8-8-8" stroke="#E5322B" stroke-width="3.6"/></g>' +
        '<g fill="#fff" opacity=".9"><circle cx="15" cy="18" r="5"/><circle cx="9" cy="12" r="3.5"/><circle cx="21" cy="10" r="3"/></g>' },
    zorty_laugh: { pose: 'festa', bg: '#F07B3F', n: ['Zorty che ride', 'Laughing Zorty'], emoji: '😂', x: 50, y: 4, k: 165,
      fx: '<g font-family="Inter,system-ui,sans-serif" font-weight="900" fill="#fff" stroke="#22313B" stroke-width="1.4" paint-order="stroke"><text x="4" y="30" font-size="15" transform="rotate(-14 14 26)">HA</text><text x="70" y="22" font-size="13" transform="rotate(12 80 18)">HA</text><text x="76" y="86" font-size="11" transform="rotate(-8 82 82)">HA</text></g>' }
  };
  const PENDING_KEY = 'gng.clan.pending';
  let host = { en: () => false, toast: () => {}, missions: () => [], onState: () => {}, sfx: () => {}, sprite: () => '' };
  const EN = () => { try { return !!host.en(); } catch (e) { return false; } };
  const T = (it, en) => (EN() ? en : it);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const rank = r => ROLES.indexOf(r);
  const hex = c => (/^#[0-9a-f]{6}$/i.test(c) ? c : '#66777f');

  /* ---------- stemma: forma + colore + simbolo, tutto da liste chiuse ---------- */
  const SHAPE_SVG = {
    shield: '<path d="M50 4L90 16V48C90 74 72 90 50 97C28 90 10 74 10 48V16Z"/>',
    circle: '<circle cx="50" cy="50" r="46"/>',
    hexagon: '<path d="M50 3L91 26V74L50 97L9 74V26Z"/>',
    star: '<path d="M50 3L62 33L95 35L69 56L78 92L50 72L22 92L31 56L5 35L38 33Z"/>',
    diamond: '<path d="M50 3L95 50L50 97L5 50Z"/>'
  };
  const SYMBOL_SVG = {
    rocket: '<path d="M12 2c3 3 4 7 3 11l-3 3-3-3c-1-4 0-8 3-11z"/><path d="M9 13l-3 2 1 4 3-2M15 13l3 2-1 4-3-2M12 16v5"/>',
    satellite: '<path d="M4 9l5-5 4 4-5 5zM11 16l5-5 4 4-5 5zM10 10l4 4M15 9l3-3"/><path d="M17 3a4 4 0 0 1 4 4"/>',
    planet: '<circle cx="12" cy="12" r="5"/><ellipse cx="12" cy="12" rx="10.5" ry="3.5" transform="rotate(-20 12 12)"/>',
    moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
    star: '<path d="M12 3l2.5 5.5L20 10l-4.5 3.5L17 20l-5-3-5 3 1.5-6.5L4 10l5.5-1.5z"/>',
    comet: '<circle cx="15.5" cy="8.5" r="4"/><path d="M12.5 11.5L3 21M10.5 8L4 14.5M16 13.5l-6 6"/>',
    telescope: '<path d="M3 14l12-6 2.5 4.5-12 6zM15 8l1.5-3.5 4 1.5-1.5 3.5M10 16l-2.5 6M12 15l2.5 7"/>',
    orbit: '<circle cx="12" cy="12" r="3"/><ellipse cx="12" cy="12" rx="10.5" ry="5"/><circle cx="21" cy="10" r="1.6"/>'
  };
  function crestSVG(c, px) {
    c = c || {};
    const shape = SHAPE_SVG[c.shape] || SHAPE_SVG.shield, sym = c.symbol === 'none' ? '' : SYMBOL_SVG[c.symbol] || SYMBOL_SVG.rocket, col = hex(c.color);
    return '<svg xmlns="http://www.w3.org/2000/svg" class="clcrest" viewBox="0 0 100 100" width="' + (px || 40) + '" height="' + (px || 40) + '" aria-hidden="true">' +
      '<g fill="' + col + '" stroke="#fff" stroke-width="5" stroke-linejoin="round">' + shape + '</g>' +
      '<g fill="none" stroke="rgba(0,0,0,.18)" stroke-width="3" transform="translate(50 50) scale(.82) translate(-50 -50)">' + shape + '</g>' +
      '<g fill="none" stroke="#fff" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" transform="translate(26 25) scale(2)">' + sym + '</g></svg>';
  }
  /* icona del satellite (le emoji spaziali mancano in molti font di sistema) */
  const SAT = '<svg class="clsat" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + SYMBOL_SVG.satellite + '</svg> ';

  /* ---------- testi ---------- */
  const ROLE_N = { director: ['Direttore', 'Director'], vice: ['Vicedirettore', 'Deputy director'], chief_engineer: ['Ingegnere capo', 'Chief engineer'], member: ['Membro', 'Member'] };
  const roleName = r => T(...(ROLE_N[r] || ROLE_N.member));
  const KIND_N = { open: ['Aperto', 'Open'], request: ['Su richiesta', 'Request'], invite: ['Solo invito', 'Invite only'] };
  const kindName = k => T(...(KIND_N[k] || KIND_N.open));
  function sysText(d) {
    d = d || {}; const u = d.user || '?', m = d.mission || '';
    switch (d.code) {
      case 'founded': return T(u + ' ha fondato il consorzio', u + ' founded the consortium');
      case 'joined': return T(u + ' è entrato nel consorzio', u + ' joined the consortium');
      case 'left': return T(u + ' ha lasciato il consorzio', u + ' left the consortium');
      case 'kicked': return T(u + ' è stato espulso da ' + (d.by || '?'), u + ' was removed by ' + (d.by || '?'));
      case 'promoted': return T(u + ' ora è ' + roleName(d.role), u + ' is now ' + roleName(d.role));
      case 'demoted': return T(u + ' ora è ' + roleName(d.role), u + ' is now ' + roleName(d.role));
      case 'new_director': return d.reason === 'inactive' ? T(u + ' è il nuovo direttore (il precedente era assente da 14 giorni)', u + ' is the new director (the previous one was away for 14 days)') : T(u + ' è il nuovo direttore', u + ' is the new director');
      case 'settings': return T(u + ' ha cambiato le impostazioni', u + ' changed the settings');
      case 'science': return T(u + ' ha chiuso ' + (m || 'una missione') + ': +' + (d.points | 0) + ' punti scienza', u + ' closed ' + (m || 'a mission') + ': +' + (d.points | 0) + ' science points');
      case 'launch': return T(u + ' ha lanciato ' + m, u + ' launched ' + m);
      case 'success': return T(u + ': ' + m + ' è riuscita', u + ': ' + m + ' succeeded');
      case 'failure': return T(u + ': ' + m + ' non è riuscita', u + ': ' + m + ' failed');
      default: return '';
    }
  }
  function errText(r) {
    const d = (r && r.data) || {}, e = d.error;
    const M = {
      login_required: ['Accedi per usare i consorzi.', 'Sign in to use consortia.'],
      no_consortium: ['Non sei in un consorzio.', 'You are not in a consortium.'],
      already_member: ['Sei già in un consorzio.', 'You are already in a consortium.'],
      name_taken: ['Questo nome è già preso.', 'This name is already taken.'],
      full: ['Il consorzio è pieno.', 'The consortium is full.'],
      invite_only: ['Si entra solo con il codice invito.', 'You can only join with an invite code.'],
      wrong_code: ['Codice invito sbagliato.', 'Wrong invite code.'],
      forbidden: ['Il tuo ruolo non lo permette.', 'Your role does not allow it.'],
      too_many_members: ['Ci sono già più membri di così.', 'There are already more members than that.'],
      slow_down: ['Piano! Aspetta un attimo.', 'Easy! Wait a moment.'],
      link: ['I link non sono ammessi in chat.', 'Links are not allowed in chat.'],
      school_mode: ['Modalità scuola: solo sticker.', 'School mode: stickers only.'],
      not_found: ['Non trovato.', 'Not found.'],
      offline: ['Nessuna connessione.', 'No connection.'],
      unavailable: ['Servizio consorzi non disponibile.', 'Consortium service unavailable.']
    };
    if (e === 'not_enough_science') return T('Servono ' + d.required + ' punti scienza (ne hai ' + d.science + ').', 'You need ' + d.required + ' science points (you have ' + d.science + ').');
    if (e === 'invalid') {
      const F = { name: ['Nome: 3–24 lettere o numeri.', 'Name: 3–24 letters or numbers.'], motto: ['Motto: massimo 60 caratteri, senza link.', 'Motto: up to 60 characters, no links.'], text: ['Messaggio vuoto o troppo lungo (massimo 300).', 'Empty or too long message (max 300).'] };
      return T(...(F[d.field] || ['Dati non validi.', 'Invalid data.']));
    }
    return T(...(M[e] || M.unavailable));
  }
  const timeOf = at => { const d = new Date(at); return isNaN(d) ? '' : String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };

  /* ---------- rete (vera o demo) ---------- */
  let DEMO = (() => { try { return /[?&]clan=demo\b/.test(location.search) || localStorage.getItem('gng.clanDemo') === '1'; } catch (e) { return false; } })();
  async function api(method, path, body) {
    if (DEMO) return demo.call(method, path, body);
    const ctl = typeof AbortController === 'function' ? new AbortController() : null, to = ctl && setTimeout(() => ctl.abort(), 12000);
    try {
      const r = await fetch(API + path, { method, credentials: 'same-origin', signal: ctl && ctl.signal,
        headers: body === undefined ? {} : { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
      let data = {}; try { data = await r.json(); } catch (e) {}
      return { status: r.status, data };
    } catch (e) { return { status: 0, data: { error: 'offline' } }; } finally { if (to) clearTimeout(to); }
  }
  const down = r => r.status === 0 || r.status >= 500 || (r.status === 404 && (!r.data || !r.data.error || r.data.error === 'Endpoint non trovato'));
  const loggedIn = () => DEMO || !!window.gngUser;
  const myName = () => (window.gngUser && window.gngUser.username) || (DEMO ? 'Matteo' : '');

  /* ---------- stato ---------- */
  const S = { open: false, tab: 'chat', noTab: 'search', mine: null, loaded: false, down: false, list: null, q: '', free: false,
    msgs: [], lastId: 0, coolUntil: 0, draft: '', err: '', busy: false, confirm: '', share: false, codeFor: '', unread: 0, edit: null,
    form: { name: '', motto: '', kind: 'open', minScience: 0, maxMembers: 20, crest: { shape: 'shield', color: COLORS[0], symbol: 'rocket' } } };
  let root = null, chatT = 0, mineT = 0, pollT = 0, searchT = 0, confirmT = 0;
  const member = () => !!(S.mine && S.mine.consortium);
  const myRole = () => (S.mine && S.mine.me ? S.mine.me.role : 'member');
  const lead = () => rank(myRole()) >= 2;

  function pushState() {
    const c = member() ? S.mine.consortium : null;
    document.querySelectorAll('[data-clan-badge]').forEach(b => { b.textContent = S.unread > 9 ? '9+' : String(S.unread); b.hidden = !S.unread; });
    try { host.onState({ auth: loggedIn(), member: !!c, name: c ? c.name : '', crest: c ? c.crest : null, unread: S.unread }); } catch (e) {}
  }
  async function loadMine() {
    const r = await api('GET', '/mine');
    if (r.status === 200) { S.mine = r.data; S.down = false; S.unread = member() ? (r.data.unread | 0) : 0; }
    else if (r.status === 401) { S.mine = null; }
    else if (down(r)) S.down = true;
    S.loaded = true; pushState(); return r;
  }

  /* ---------- punti scienza e attività (chiamati dal gioco) ---------- */
  const readPending = () => { try { return JSON.parse(localStorage.getItem(PENDING_KEY) || '[]').slice(-20); } catch (e) { return []; } };
  const writePending = a => { try { localStorage.setItem(PENDING_KEY, JSON.stringify(a)); } catch (e) {} };
  async function flushPending() {
    if (!loggedIn()) return; const left = [];
    for (const p of readPending()) {
      const r = await api('POST', '/science', p);
      if (r.status === 0 || r.status >= 500 || r.status === 429) left.push(p);
    }
    writePending(left);
  }
  function science(mission, points, name) {
    if (!loggedIn() || !mission) return;
    const p = { mission: String(mission).replace(/[^A-Za-z0-9_.:-]/g, '').slice(0, 64), points: Math.max(0, Math.min(1000, Math.round(points) || 0)), name: String(name || '').slice(0, 24) };
    if (!p.mission) return;
    writePending(readPending().filter(x => x.mission !== p.mission).concat([p]));
    flushPending().then(() => { if (member()) loadMine().then(() => { if (S.open) draw(); }); });
  }
  function activity(type, name) {
    if (!loggedIn() || (S.loaded && !member())) return;
    api('POST', '/mine/activity', { type, mission: String(name || '').slice(0, 24) }).then(r => { if (r.status === 201 && S.open && S.tab === 'chat') pollChat(); });
  }

  /* ---------- pannello ---------- */
  function ensureRoot() {
    if (root) return root;
    injectCss();
    root = document.createElement('div'); root.id = 'clan'; root.hidden = true; root.setAttribute('translate', 'no');
    document.body.appendChild(root);
    root.addEventListener('click', onClick);
    root.addEventListener('input', onInput);
    root.addEventListener('submit', onSubmit);
    root.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    return root;
  }
  async function open(tab) {
    ensureRoot(); S.open = true; S.err = ''; S.confirm = ''; S.share = false; root.hidden = false; document.body.classList.add('clan-open');
    if (tab) { if (['chat', 'members', 'info'].includes(tab)) S.tab = tab; else S.noTab = tab; }
    draw();
    if (!loggedIn()) return;
    await loadMine(); await flushPending();
    if (!member() && !S.down) await search();
    draw(); startChat();
  }
  function close() {
    if (!root) return; S.open = false; root.hidden = true; document.body.classList.remove('clan-open'); stopChat(); if (popEl) popEl.hidden = true;
    clearTimeout(mineT);
  }
  function startChat() {
    stopChat();
    if (!S.open || !member() || S.tab !== 'chat') return;
    if (!S.msgs.length || S.msgs.cid !== S.mine.consortium.id) loadChat(); else pollChat();
    chatT = setInterval(() => { if (document.visibilityState !== 'hidden') pollChat(); }, 3000);
    clearTimeout(mineT); const again = () => { mineT = setTimeout(async () => { if (!S.open) return; await loadMine(); drawSide(); again(); }, 20000); }; again();
  }
  function stopChat() { clearInterval(chatT); chatT = 0; }
  async function loadChat() {
    const r = await api('GET', '/mine/messages');
    if (r.status !== 200) return;
    S.msgs = r.data.messages || []; S.msgs.cid = S.mine && S.mine.consortium && S.mine.consortium.id; S.lastId = r.data.lastId || 0; S.unread = 0; pushState(); drawFeed(true);
  }
  async function pollChat() {
    if (!member()) return;
    const r = await api('GET', '/mine/messages?after=' + S.lastId);
    if (r.status === 404) { await loadMine(); draw(); return; }
    if (r.status !== 200 || !r.data.messages.length) return;
    let pop = null;
    r.data.messages.forEach(m => { const i = S.msgs.findIndex(x => x.id === m.id); if (i >= 0) S.msgs[i] = m; else { S.msgs.push(m); if (m.kind === 'sticker' && !m.deleted && m.author !== myName()) pop = m.sticker; } });
    if (pop) popSticker(pop);
    S.lastId = r.data.lastId; S.msgs.splice(0, Math.max(0, S.msgs.length - 120)); S.unread = 0; pushState(); drawFeed(true);
  }
  async function search() {
    const qs = new URLSearchParams(); if (S.q.trim()) qs.set('q', S.q.trim()); if (S.free) qs.set('free', '1');
    const r = await api('GET', qs.toString() ? '?' + qs : '');
    if (r.status === 200) S.list = r.data.consortia || []; else if (down(r)) S.down = true;
  }

  /* ---------- disegno ---------- */
  function draw() {
    if (!root || !S.open) return;
    const input = root.querySelector('.clsend input'); if (input) S.draft = input.value;
    const focused = document.activeElement && root.contains(document.activeElement) ? document.activeElement.dataset.f : '';
    const c = member() ? S.mine.consortium : null;
    const tabs = !loggedIn() || S.down ? [] : c ? [['chat', T('Chat', 'Chat')], ['members', T('Membri', 'Members')], ['info', T('Info', 'Info')]] : [['search', T('Cerca', 'Search')], ['create', T('Crea', 'Create')]];
    const cur = c ? S.tab : S.noTab;
    root.innerHTML = '<div class="clw" role="dialog" aria-modal="true" aria-label="' + T('Consorzio', 'Consortium') + '">' +
      '<header class="clh">' + (c ? crestSVG(c.crest, 34) : '<span class="clico">' + crestSVG({ shape: 'shield', color: '#66777f', symbol: 'orbit' }, 34) + '</span>') +
      '<div class="clt"><b>' + esc(c ? c.name : T('Consorzi', 'Consortia')) + '</b><small>' + (c ? T('Livello ', 'Level ') + c.level + ' · ' + c.members + '/' + c.maxMembers + ' · ' + c.science + ' ◆' : T('Gioca in squadra con altre agenzie', 'Team up with other agencies')) + (DEMO ? ' · DEMO' : '') + '</small></div>' +
      '<nav class="cltabs" role="tablist">' + tabs.map(t => '<button role="tab" aria-selected="' + (t[0] === cur) + '" class="' + (t[0] === cur ? 'on' : '') + '" data-cl="tab" data-k="' + t[0] + '">' + t[1] + '</button>').join('') + '</nav>' +
      '<button class="clx" data-cl="close" aria-label="' + T('Chiudi', 'Close') + '">×</button></header>' +
      (S.err ? '<p class="clerr" role="alert">' + esc(S.err) + '</p>' : '') +
      '<div class="clb">' + body(cur) + '</div></div>';
    const back = root.querySelector('.clsend input'); if (back) back.value = S.draft;
    if (focused) { const f = root.querySelector('[data-f="' + focused + '"]'); if (f) f.focus(); }
    if (c && cur === 'chat') { drawFeed(true); drawSide(); }
  }
  function body(tab) {
    if (!loggedIn()) return '<div class="clempty">' + crestSVG({ shape: 'shield', color: '#f07b3f', symbol: 'rocket' }, 72) +
      '<h2>' + T('Entra in un consorzio', 'Join a Consortium') + '</h2><p>' + T('Chatta con altre agenzie, condividi le missioni e porta punti scienza alla tua squadra. Serve un account.', 'Chat with other agencies, share missions and bring science points to your team. You need an account.') + '</p>' +
      '<div class="clrow"><button class="clbtn pri" data-cl="login">' + T('Accedi o registrati', 'Sign in or sign up') + '</button><button class="clbtn" data-cl="demo">' + T('Prova la demo', 'Try the demo') + '</button></div></div>';
    if (S.down) return '<div class="clempty"><h2>' + T('Servizio consorzi non raggiungibile', 'Consortium service unreachable') + '</h2><p>' + T('Il server non risponde. Puoi riprovare o usare la demo con dati di esempio.', 'The server is not responding. Retry, or use the demo with sample data.') + '</p>' +
      '<div class="clrow"><button class="clbtn pri" data-cl="retry">' + T('Riprova', 'Retry') + '</button><button class="clbtn" data-cl="demo">' + T('Usa la demo', 'Use the demo') + '</button></div></div>';
    if (!S.loaded) return '<p class="clwait">' + T('Caricamento…', 'Loading…') + '</p>';
    if (!member()) return tab === 'create' ? createView() : searchView();
    if (tab === 'members') return membersView();
    if (tab === 'info') return infoView();
    return chatView();
  }
  const sci = () => (S.mine && S.mine.player ? S.mine.player.science | 0 : 0);
  function card(c) {
    const full = c.members >= c.maxMembers, low = sci() < c.minScience && c.kind !== 'invite';
    let act;
    if (full) act = '<button class="clbtn" disabled>' + T('Pieno', 'Full') + '</button>';
    else if (c.kind === 'invite') act = S.codeFor === c.id ? '<form class="clcode" data-cl-form="code" data-id="' + esc(c.id) + '"><input data-f="code" maxlength="8" autocomplete="off" placeholder="' + T('Codice', 'Code') + '" aria-label="' + T('Codice invito', 'Invite code') + '"><button class="clbtn pri">' + T('Entra', 'Join') + '</button></form>' : '<button class="clbtn" data-cl="code" data-id="' + esc(c.id) + '">' + T('Ho un codice', 'I have a code') + '</button>';
    else if (low) act = '<button class="clbtn" disabled>' + T('Servono ', 'Needs ') + c.minScience + ' ◆</button>';
    else act = '<button class="clbtn pri" data-cl="join" data-id="' + esc(c.id) + '">' + (c.kind === 'request' ? T('Chiedi di entrare', 'Ask to join') : T('Entra', 'Join')) + '</button>';
    return '<article class="clcard">' + crestSVG(c.crest, 42) + '<div class="clci"><b>' + esc(c.name) + '</b><small>' + esc(c.motto || '') + '</small>' +
      '<span class="clmeta">' + T('Liv ', 'Lv ') + c.level + ' · 👥 ' + c.members + '/' + c.maxMembers + ' · ' + c.science + ' ◆' + (c.minScience ? ' · min ' + c.minScience + ' ◆' : '') + ' · ' + kindName(c.kind) + '</span></div>' + act + '</article>';
  }
  function searchView() {
    const list = S.list || [];
    return '<div class="clsearch"><div class="clrow"><input type="search" data-f="q" data-cl-in="q" maxlength="24" value="' + esc(S.q) + '" placeholder="' + T('Cerca per nome', 'Search by name') + '" aria-label="' + T('Cerca per nome', 'Search by name') + '">' +
      '<button class="clchip' + (S.free ? ' on' : '') + '" data-cl="free" aria-pressed="' + S.free + '">' + T('Con posti liberi', 'With free places') + '</button></div>' +
      '<h3>' + (S.q.trim() ? T('Risultati', 'Results') : T('Consigliati', 'Recommended')) + ' <small>' + T('i tuoi punti: ', 'your points: ') + sci() + ' ◆</small></h3>' +
      (list.length ? list.map(card).join('') : '<p class="clwait">' + (S.list ? T('Nessun consorzio. Fondane uno tu!', 'No consortia yet. Found one!') : T('Caricamento…', 'Loading…')) + '</p>') +
      (S.list && !list.length ? '<button class="clbtn pri" data-cl="tab" data-k="create">' + T('Crea un consorzio', 'Create a consortium') + '</button>' : '') + '</div>';
  }
  function crestEditor(f) {
    const pick = (key, values, label, show) => '<div class="clpick" role="group" aria-label="' + label + '">' + values.map(v => '<button type="button" class="' + (f.crest[key] === v ? 'on' : '') + '" data-cl="crest" data-key="' + key + '" data-v="' + v + '" aria-label="' + label + ' ' + v + '" aria-pressed="' + (f.crest[key] === v) + '">' + show(v) + '</button>').join('') + '</div>';
    return '<div class="cleditor"><div class="clprev">' + crestSVG(f.crest, 84) + '</div>' +
      pick('shape', SHAPES, T('Forma', 'Shape'), v => crestSVG({ shape: v, color: '#66777f', symbol: 'none' }, 24)) +
      pick('symbol', SYMBOLS, T('Simbolo', 'Symbol'), v => '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + SYMBOL_SVG[v] + '</svg>') +
      pick('color', COLORS, T('Colore', 'Colour'), v => '<i style="background:' + v + '"></i>') + '</div>';
  }
  function settingsFields(f, creating) {
    const kinds = ['open', 'request', 'invite'];
    return (creating ? '<label>' + T('Nome', 'Name') + '<input data-f="name" data-cl-in="name" maxlength="24" required value="' + esc(f.name) + '" placeholder="Orbita Milano"></label>' : '') +
      '<label>' + T('Motto', 'Motto') + '<input data-f="motto" data-cl-in="motto" maxlength="60" value="' + esc(f.motto) + '" placeholder="' + T('Dal campus alle stelle', 'From campus to the stars') + '"></label>' +
      '<div class="clseg" role="group" aria-label="' + T('Tipo', 'Type') + '">' + kinds.map(k => '<button type="button" class="' + (f.kind === k ? 'on' : '') + '" data-cl="kind" data-k="' + k + '" aria-pressed="' + (f.kind === k) + '">' + kindName(k) + '</button>').join('') + '</div>' +
      '<div class="clrow"><label>' + T('Punti minimi', 'Min. points') + '<input type="number" inputmode="numeric" min="0" max="1000000" data-f="min" data-cl-in="minScience" value="' + (f.minScience | 0) + '"></label>' +
      '<label>' + T('Membri max', 'Max members') + '<input type="number" inputmode="numeric" min="2" max="20" data-f="max" data-cl-in="maxMembers" value="' + (f.maxMembers | 0) + '"></label></div>';
  }
  function createView() {
    const f = S.form;
    // Il bottone sta sotto lo stemma: sul telefono in orizzontale resta visibile senza scorrere.
    return '<form class="clform" data-cl-form="create"><div class="clcol">' + settingsFields(f, true) + '</div>' +
      crestEditor(f).replace(/<\/div>$/, '<button class="clbtn pri big"' + (S.busy ? ' disabled' : '') + '>' + T('Fonda il consorzio', 'Found the consortium') + '</button></div>') + '</form>';
  }
  const status = s => '<i class="cldot ' + (s === 'playing' ? 'play' : s === 'online' ? 'on' : '') + '" title="' + (s === 'playing' ? T('In missione', 'In a mission') : s === 'online' ? 'Online' : 'Offline') + '"></i>';
  function chatView() {
    const done = (host.missions() || []).slice(-6).reverse();
    return '<div class="clchat"><section class="clfeed"><ol class="clmsgs" aria-live="polite"></ol>' +
      (S.share ? '<div class="clshare" role="menu"><b>' + T('Condividi una missione', 'Share a mission') + '</b>' + (done.length ? done.map((m, i) => '<button role="menuitem" data-cl="sharem" data-i="' + i + '">' + SAT + esc(m.name) + ' <small>' + (m.sci | 0) + ' ◆</small></button>').join('') : '<p>' + T('Nessuna missione conclusa.', 'No finished missions.') + '</p>') + '</div>' : '') +
      '<div class="clbar"><div class="clstks" role="group" aria-label="Sticker">' + Object.keys(STICKERS).map(k => '<button type="button" data-cl="stk" data-k="' + k + '" aria-label="' + esc(T(...STICKERS[k].n)) + '" title="' + esc(T(...STICKERS[k].n)) + '"' + (Date.now() < S.coolUntil ? ' disabled' : '') + '>' + stickerHTML(k, 38) + '</button>').join('') + '</div>' +
      '<form class="clsend" data-cl-form="send"><button type="button" class="clico2" data-cl="share" aria-expanded="' + S.share + '" aria-label="' + T('Condividi una missione', 'Share a mission') + '">' + SAT + '</button>' +
      '<input data-f="msg" maxlength="300" autocomplete="off" enterkeyhint="send" placeholder="' + (S.mine.consortium.schoolMode ? T('Modalità scuola: solo sticker', 'School mode: stickers only') : T('Scrivi al consorzio…', 'Message your consortium…')) + '" aria-label="' + T('Messaggio', 'Message') + '"' + (S.mine.consortium.schoolMode ? ' disabled' : '') + '>' +
      '<button class="clbtn pri">' + T('Invia', 'Send') + '</button></form></div></section><aside class="clside" aria-label="' + T('Membri', 'Members') + '"></aside></div>';
  }
  /* ---------- sticker ---------- */
  let stkCss = false;
  // Le immagini vanno nel CSS una volta sola: la chat ripete solo una classe, non 15 KB per sticker.
  function stickerCss() {
    if (stkCss || typeof document === 'undefined') return; stkCss = true;
    const s = document.createElement('style'); s.id = 'clan-stk';
    s.textContent = Object.keys(STICKERS).map(k => {
      const d = STICKERS[k], src = String(host.sprite(d.pose) || '');
      return '.clz-' + k + '{--zb:' + d.bg + '}' + (/^data:image\/(webp|png);base64,[A-Za-z0-9+/=]+$/.test(src)
        ? '.clz-' + k + '>i{background-image:url("' + src + '");background-size:' + d.k + '% auto;background-position:' + d.x + '% ' + d.y + '%}'
        : '.clz-' + k + '>i::before{content:"' + d.emoji + '";font-size:calc(var(--zs)*.6)}');
    }).join('\n');
    document.head.appendChild(s);
  }
  function stickerHTML(code, px) {
    const d = Object.prototype.hasOwnProperty.call(STICKERS, code) ? STICKERS[code] : null;
    if (!d) return '<span class="clz" style="--zs:' + (px | 0) + 'px" role="img" aria-label="Sticker"><i>✨</i></span>';
    stickerCss();
    return '<span class="clz clz-' + code + '" style="--zs:' + (px | 0) + 'px" role="img" aria-label="' + esc(T(...d.n)) + '"><i></i><svg viewBox="0 0 100 100" aria-hidden="true">' + d.fx + '</svg></span>';
  }
  // Lo sticker appena arrivato compare grande per un paio di secondi, sopra il pannello (fuori dal suo innerHTML).
  let popEl = null, popT = 0;
  // force: anche a pannello chiuso (sticker mandati da chi ti guarda, o da te mentre guardi); from: chi l'ha mandato
  function popSticker(code, from, force) {
    if ((!S.open && !force) || !Object.prototype.hasOwnProperty.call(STICKERS, code)) return;
    if (!popEl) { popEl = document.createElement('div'); popEl.id = 'clpop'; popEl.setAttribute('aria-hidden', 'true'); popEl.setAttribute('translate', 'no'); document.body.appendChild(popEl); }
    popEl.innerHTML = '<div class="clpopin">' + stickerHTML(code, Math.min(180, Math.round(innerHeight * .5))) + (from ? '<b class="clpopby">' + esc(from) + '</b>' : '') + '</div>'; popEl.hidden = false;
    clearTimeout(popT); popT = setTimeout(() => { popEl.hidden = true; popEl.innerHTML = ''; }, 1900);
    try { host.sfx('tap'); } catch (e) {}
  }
  // Il server accetta un messaggio ogni 2 secondi: i bottoni degli sticker si spengono per lo stesso tempo.
  function cooldown() {
    S.coolUntil = Date.now() + 2000;
    const set = off => document.querySelectorAll('#clan [data-cl="stk"],#spect [data-sp="stk"]').forEach(b => { b.disabled = off; });
    set(true); setTimeout(() => set(false), 2050);
  }
  function msgHTML(m) {
    const me = m.author && m.author === myName();
    if (m.kind === 'system') return '<li class="clsys">' + esc(sysText(m.data)) + ' <time>' + timeOf(m.at) + '</time></li>';
    const head = '<span class="clwho"><b class="r-' + esc(m.role || 'member') + '">' + esc(m.author || '?') + '</b>' + (m.to ? ' → ' + esc(m.to) : '') + ' <time>' + timeOf(m.at) + '</time>' +
      (!m.deleted && (me || lead()) ? ' <button class="cldel" data-cl="del" data-id="' + m.id + '" aria-label="' + T('Elimina', 'Delete') + '">×</button>' : '') + '</span>';
    let inner;
    if (m.deleted) inner = '<em class="clgone">' + T('Messaggio eliminato', 'Message deleted') + '</em>';
    else if (m.kind === 'sticker') inner = stickerHTML(m.sticker, 84);
    else if (m.kind === 'mission') { const d = m.data || {}; inner = '<span class="clmis"><b>' + SAT + esc(d.name) + '</b><small>' + [d.dest, d.months != null ? d.months + T(' mesi', ' months') : '', d.sci != null ? d.sci + ' ◆' : ''].filter(Boolean).map(esc).join(' · ') + '</small>' + (d.ok != null ? '<em class="' + (d.ok ? 'ok' : 'ko') + '">' + (d.ok ? T('Riuscita', 'Success') : T('Non riuscita', 'Failed')) + '</em>' : '') + '</span>'; }
    else inner = '<span class="cltxt">' + esc(m.text) + '</span>';
    return '<li class="clm' + (me ? ' me' : '') + '">' + head + inner + '</li>';
  }
  function drawFeed(stick) {
    const ol = root && root.querySelector('.clmsgs'); if (!ol) return;
    const near = ol.scrollHeight - ol.scrollTop - ol.clientHeight < 60;
    ol.innerHTML = S.msgs.length ? S.msgs.map(msgHTML).join('') : '<li class="clsys">' + T('Ancora nessun messaggio: saluta la squadra!', 'No messages yet: say hi to the team!') + '</li>';
    if (stick && (near || !ol.dataset.seen)) { ol.scrollTop = ol.scrollHeight; ol.dataset.seen = 1; }
  }
  function drawSide() {
    const a = root && root.querySelector('.clside'); if (!a || !member()) return;
    a.innerHTML = '<h3>' + T('Membri', 'Members') + ' <small>' + S.mine.members.filter(m => m.status !== 'offline').length + ' online</small></h3><ul>' +
      S.mine.members.map(m => '<li>' + status(m.status) + '<b class="r-' + esc(m.role) + '">' + esc(m.username) + '</b>' + watchBtn(m) + '<small>' + roleName(m.role) + '</small></li>').join('') + '</ul>';
  }
  // «Guarda»: solo un compagno che sta giocando adesso e che lo permette
  const EYE = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
  const watchBtn = m => m.status === 'playing' && m.spectate !== false && m.username !== myName()
    ? '<button class="clbtn sm clwatch" data-cl="watch" data-u="' + esc(m.username) + '" aria-label="' + esc(T('Guarda ', 'Watch ') + m.username) + '">' + EYE + ' ' + T('Guarda', 'Watch') + '</button>' : '';
  function memberActions(m) {
    if (m.username === myName()) return '';
    const R = rank(myRole()), Tg = rank(m.role), out = [];
    const btn = (act, label, danger) => { const key = act + ':' + m.username, sure = S.confirm === key; return '<button class="clbtn sm' + (danger ? ' bad' : '') + (sure ? ' sure' : '') + '" data-cl="member" data-act="' + act + '" data-u="' + esc(m.username) + '">' + (sure ? T('Confermi?', 'Confirm?') : label) + '</button>'; };
    if (Tg + 1 < 3 && R > Tg + 1) out.push(btn('promote', T('Promuovi', 'Promote')));
    if (Tg > 0 && R > Tg) out.push(btn('demote', T('Retrocedi', 'Demote')));
    if (R >= 2 && R > Tg) out.push(btn('kick', T('Espelli', 'Remove'), true));
    if (myRole() === 'director') out.push(btn('transfer', T('Passa la direzione', 'Hand over'), true));
    return out.length ? '<div class="clacts">' + out.join('') + '</div>' : '';
  }
  function membersView() {
    const reqs = lead() ? S.mine.requests || [] : [];
    return '<div class="clmembers">' + (reqs.length ? '<h3>' + T('Richieste di ingresso', 'Join requests') + '</h3>' + reqs.map(r => '<article class="clreq"><b>' + esc(r.username) + '</b><small>' + r.science + ' ◆' + (r.message ? ' · «' + esc(r.message) + '»' : '') + '</small>' +
      '<div class="clacts"><button class="clbtn sm pri" data-cl="req" data-id="' + r.id + '" data-ok="1">' + T('Accetta', 'Accept') + '</button><button class="clbtn sm" data-cl="req" data-id="' + r.id + '" data-ok="0">' + T('Rifiuta', 'Reject') + '</button></div></article>').join('') : '') +
      '<h3>' + T('Membri', 'Members') + ' · ' + S.mine.members.length + '/' + S.mine.consortium.maxMembers + '</h3>' +
      S.mine.members.map(m => '<article class="clmem">' + status(m.status) + '<div><b class="r-' + esc(m.role) + '">' + esc(m.username) + (m.username === myName() ? ' <small>(' + T('tu', 'you') + ')</small>' : '') + '</b><small>' + roleName(m.role) + ' · ' + m.science + ' ◆</small></div>' + watchBtn(m) + memberActions(m) + '</article>').join('') + '</div>';
  }
  function infoView() {
    const c = S.mine.consortium, ed = lead();
    if (ed && !S.edit) S.edit = { motto: c.motto || '', kind: c.kind, minScience: c.minScience, maxMembers: c.maxMembers, schoolMode: !!c.schoolMode, crest: Object.assign({}, c.crest) };
    const sure = S.confirm === 'leave';
    return '<div class="clinfo"><div class="clcol"><div class="clhero">' + crestSVG(c.crest, 64) + '<div><b>' + esc(c.name) + '</b><small>' + esc(c.motto || '') + '</small>' +
      '<span class="clmeta">' + kindName(c.kind) + ' · ' + T('Livello ', 'Level ') + c.level + ' · ' + c.science + ' ◆' + (c.minScience ? ' · min ' + c.minScience + ' ◆' : '') + '</span></div></div>' +
      (ed && c.inviteCode ? '<div class="clinv"><span>' + T('Codice invito', 'Invite code') + '</span><b class="clcodev">' + esc(c.inviteCode) + '</b><button class="clbtn sm" data-cl="newcode">' + T('Nuovo codice', 'New code') + '</button></div><p class="clnote">' + T('Dallo a chi vuoi invitare: con il codice si entra sempre, anche se il consorzio è su invito.', 'Give it to the people you invite: the code always lets them in, even when the consortium is invite only.') + '</p>' : '') +
      '<label class="cltog"><input type="checkbox" data-cl-in="spectate"' + (S.mine.me.spectate !== false ? ' checked' : '') + '> ' + T('I compagni possono guardarmi mentre gioco', 'Teammates can watch me play') + '</label>' +
      '<button class="clbtn bad' + (sure ? ' sure' : '') + '" data-cl="leave">' + (sure ? T('Confermi? Tocca di nuovo', 'Sure? Tap again') : T('Lascia il consorzio', 'Leave the consortium')) + '</button></div>' +
      (ed ? '<form class="clform" data-cl-form="settings"><div class="clcol"><h3>' + T('Impostazioni', 'Settings') + '</h3>' + settingsFields(S.edit, false) +
        '<label class="cltog"><input type="checkbox" data-cl-in="schoolMode"' + (S.edit.schoolMode ? ' checked' : '') + '> ' + T('Modalità scuola (solo sticker)', 'School mode (stickers only)') + '</label>' +
        '<button class="clbtn pri"' + (S.busy ? ' disabled' : '') + '>' + T('Salva', 'Save') + '</button></div>' + crestEditor(S.edit) + '</form>' : '') + '</div>';
  }

  /* ---------- azioni ---------- */
  async function run(fn) {
    if (S.busy) return; S.busy = true; S.err = '';
    try { await fn(); } finally { S.busy = false; draw(); }
  }
  const fail = r => { S.err = errText(r); try { host.sfx('bad'); } catch (e) {} };
  function arm(key) { S.confirm = key; clearTimeout(confirmT); confirmT = setTimeout(() => { S.confirm = ''; draw(); }, 4000); draw(); }
  async function afterJoin(r) {
    if (r.status === 202) { host.toast(T('Richiesta inviata: aspetta che il direttore ti accetti.', 'Request sent: wait for the director to accept you.')); return; }
    if (r.status !== 200) return fail(r);
    S.msgs = []; S.lastId = 0; S.tab = 'chat'; await loadMine(); startChat();
    try { host.sfx('ok'); } catch (e) {}
  }
  function onClick(e) {
    const b = e.target.closest('[data-cl]'); if (!b || !root.contains(b)) return;
    const a = b.dataset.cl;
    if (a === 'close') return close();
    if (a === 'tab') { if (member()) S.tab = b.dataset.k; else S.noTab = b.dataset.k; S.err = ''; S.share = false; draw(); if (member()) startChat(); else if (S.noTab === 'search' && !S.list) run(search); return; }
    if (a === 'login') { close(); if (window.gngRequireAccount) window.gngRequireAccount().then(u => { if (u) open(); }); return; }
    if (a === 'demo') { setDemo(true); S.loaded = false; S.down = false; S.list = null; S.msgs = []; S.lastId = 0; open(); return; }
    if (a === 'retry') { S.down = false; S.loaded = false; open(); return; }
    if (a === 'free') { S.free = !S.free; return run(search); }
    if (a === 'code') { S.codeFor = b.dataset.id; draw(); const i = root.querySelector('[data-f="code"]'); if (i) i.focus(); return; }
    if (a === 'join') return run(async () => afterJoin(await api('POST', '/' + b.dataset.id + '/join', {})));
    if (a === 'crest' || a === 'kind') {
      const f = member() ? S.edit : S.form; if (!f) return;
      if (a === 'kind') f.kind = b.dataset.k; else f.crest[b.dataset.key] = b.dataset.v;
      draw(); return;
    }
    if (a === 'share') { S.share = !S.share; draw(); return; }
    if (a === 'watch') return watch(b.dataset.u);
    if (a === 'stk') {
      const code = b.dataset.k; if (!STICKERS[code] || Date.now() < S.coolUntil) return;
      popSticker(code); cooldown();
      return run(async () => { const r = await api('POST', '/mine/messages', { kind: 'sticker', sticker: code }); if (r.status !== 201) fail(r); else await pollChat(); });
    }
    if (a === 'sharem') {
      const m = (host.missions() || []).slice(-6).reverse()[+b.dataset.i]; S.share = false; if (!m) return draw();
      return run(async () => { const r = await api('POST', '/mine/messages', { kind: 'mission', mission: m }); if (r.status !== 201) fail(r); else await pollChat(); });
    }
    if (a === 'del') return run(async () => { const r = await api('DELETE', '/mine/messages/' + b.dataset.id); if (r.status !== 200) fail(r); else { const m = S.msgs.find(x => String(x.id) === b.dataset.id); if (m) { m.deleted = true; delete m.text; } } });
    if (a === 'req') return run(async () => { const r = await api('POST', '/mine/requests/' + b.dataset.id, { accept: b.dataset.ok === '1' }); if (r.status !== 200) fail(r); await loadMine(); });
    if (a === 'member') {
      const act = b.dataset.act, key = act + ':' + b.dataset.u;
      if ((act === 'kick' || act === 'transfer') && S.confirm !== key) return arm(key);
      S.confirm = '';
      return run(async () => { const r = await api('POST', '/mine/members/' + encodeURIComponent(b.dataset.u), { action: act }); if (r.status !== 200) fail(r); await loadMine(); S.edit = null; });
    }
    if (a === 'newcode') return run(async () => { const r = await api('POST', '/mine/invite-code', {}); if (r.status !== 200) fail(r); else S.mine.consortium.inviteCode = r.data.inviteCode; });
    if (a === 'leave') {
      if (S.confirm !== 'leave') return arm('leave');
      S.confirm = '';
      return run(async () => { const r = await api('POST', '/leave', {}); if (r.status !== 200) return fail(r); S.msgs = []; S.lastId = 0; S.edit = null; S.noTab = 'search'; await loadMine(); await search(); });
    }
  }
  function onInput(e) {
    const k = e.target.dataset.clIn; if (!k) return;
    if (k === 'q') { S.q = e.target.value; clearTimeout(searchT); searchT = setTimeout(() => run(search), 350); return; }
    if (k === 'spectate') { const v = e.target.checked; api('POST', '/mine/preferences', { spectate: v }).then(r => { if (r.status === 200) S.mine.me.spectate = v; else { fail(r); draw(); } }); return; }
    const f = member() ? S.edit : S.form; if (!f) return;
    if (k === 'schoolMode') f.schoolMode = e.target.checked;
    else if (k === 'minScience' || k === 'maxMembers') f[k] = Math.round(+e.target.value) || 0;
    else f[k] = e.target.value;
  }
  function onSubmit(e) {
    const form = e.target.closest('[data-cl-form]'); if (!form) return; e.preventDefault();
    const kind = form.dataset.clForm;
    if (kind === 'send') {
      const input = form.querySelector('input'), text = input.value.trim(); if (!text) return;
      return run(async () => { const r = await api('POST', '/mine/messages', { kind: 'text', text }); if (r.status !== 201) { fail(r); return; } input.value = ''; S.draft = ''; cooldown(); await pollChat(); });
    }
    if (kind === 'code') {
      const code = form.querySelector('input').value.trim();
      return run(async () => afterJoin(await api('POST', '/' + form.dataset.id + '/join', { code })));
    }
    if (kind === 'create') {
      const f = S.form;
      return run(async () => {
        const r = await api('POST', '', { name: f.name, motto: f.motto, kind: f.kind, crest: f.crest, minScience: Math.max(0, f.minScience | 0), maxMembers: Math.min(20, Math.max(2, f.maxMembers | 0)) });
        if (r.status !== 201) return fail(r);
        S.msgs = []; S.lastId = 0; S.tab = 'chat'; await loadMine(); startChat(); try { host.sfx('ok'); } catch (err) {}
      });
    }
    if (kind === 'settings') {
      const f = S.edit;
      return run(async () => {
        const r = await api('PATCH', '/mine', { motto: f.motto, kind: f.kind, crest: f.crest, minScience: Math.max(0, f.minScience | 0), maxMembers: Math.min(20, Math.max(2, f.maxMembers | 0)), schoolMode: f.schoolMode });
        if (r.status !== 200) return fail(r);
        S.edit = null; await loadMine(); host.toast(T('Impostazioni salvate.', 'Settings saved.'));
      });
    }
  }

  /* ---------- spectate: guardare un compagno mentre gioca ---------- */
  // Lo stato della partita viaggia compresso (gzip, base64). Senza CompressionStream si manda in chiaro.
  const b64 = {
    enc: u8 => { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); },
    dec: s => { const b = atob(s), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
  };
  async function pack(json) {
    const raw = new TextEncoder().encode(json);
    if (typeof CompressionStream === 'function') {
      const buf = await new Response(new Blob([raw]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer();
      return { enc: 'gz', data: b64.enc(new Uint8Array(buf)) };
    }
    return { enc: 'raw', data: b64.enc(raw) };
  }
  async function unpack(p) {
    const u = b64.dec(p.data);
    if (p.enc === 'gz') return new Response(new Blob([u]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
    return new TextDecoder().decode(u);
  }
  const MAX_STATE = 160000;

  // Chi gioca: un battito ogni 8 s; se qualcuno guarda, la partita ogni 5 s. Gli sticker di chi guarda tornano nella risposta.
  const LIVE = { t: 0, watched: false, since: 0, warned: false };
  async function liveBeat() {
    clearTimeout(LIVE.t);
    let next = 8000;
    try {
      const snap = !DEMO && loggedIn() && member() && !W.user && host.liveState ? host.liveState() : null;
      if (snap) {
        const allowed = !(S.mine.me && S.mine.me.spectate === false), body = { view: snap.view, mission: snap.mission, since: LIVE.since };
        if (LIVE.watched && allowed) {
          const p = await pack(snap.json);
          if (p.data.length <= MAX_STATE) body.state = p; else if (!LIVE.warned) { LIVE.warned = true; console.warn('spectate: game state too large', p.data.length); }
        }
        const r = await api('PUT', '/live', body);
        if (r.status === 200) {
          const was = LIVE.watched; LIVE.watched = !!r.data.watched; LIVE.since = r.data.lastId || LIVE.since;
          (r.data.reactions || []).forEach((x, i) => setTimeout(() => popSticker(x.sticker, x.author, true), i * 1000));
          if (LIVE.watched && !was) host.toast(T('Un compagno di consorzio ti sta guardando 👀', 'A teammate is watching you 👀'));
          if (LIVE.watched) next = body.state ? 5000 : 300; // qualcuno ha appena cominciato a guardare: la partita parte subito
        } else if (r.status === 404 || r.status === 401) next = 30000;
      } else next = 15000;
    } catch (e) { next = 15000; }
    LIVE.t = setTimeout(liveBeat, next);
  }

  // Chi guarda: legge ogni 5 s; il gioco disegna la partita del compagno con il suo motore, a comandi spenti.
  const VIEW_N = { hub: ['Campus', 'Campus'], admin: ['Amministrazione', 'Administration'], build: ['Costruzione', 'Assembly'], test: ['Prove', 'Testing'], mcc: ['Sala controllo', 'Mission control'], pad: ['Rampa di lancio', 'Launch pad'], fd: ['Dinamica del volo', 'Flight dynamics'] };
  const W = { user: null, t: 0, key: '', got: false, view: '', mission: '', fails: 0, demo: null };
  let spectEl = null, shieldEl = null;
  function onSpectKey(e) {
    if (!W.user || (spectEl && spectEl.contains(e.target))) return;
    e.stopPropagation(); e.preventDefault();
    if (e.key === 'Escape') stopWatch();
  }
  function spectBar() {
    if (!spectEl) return;
    const where = W.got ? (W.mission ? W.mission + ' · ' : '') + T(...(VIEW_N[W.view] || VIEW_N.hub)) : T('In collegamento…', 'Connecting…');
    spectEl.innerHTML = '<span class="spl"><i class="spdot' + (W.got ? ' on' : '') + '"></i><span><b>' + esc(T('Stai guardando ', 'Watching ') + W.user) + '</b><small>' + esc(where) + '</small></span></span>' +
      '<div class="clstks" role="group" aria-label="Sticker">' + Object.keys(STICKERS).map(k => '<button type="button" data-sp="stk" data-k="' + k + '" aria-label="' + esc(T(...STICKERS[k].n)) + '"' + (Date.now() < S.coolUntil ? ' disabled' : '') + '>' + stickerHTML(k, 34) + '</button>').join('') + '</div>' +
      '<button class="clbtn" data-sp="exit">' + T('Esci', 'Leave') + '</button>';
  }
  function spectUI(on) {
    injectCss();
    if (on) {
      if (!shieldEl) { shieldEl = document.createElement('div'); shieldEl.id = 'spectshield'; shieldEl.setAttribute('aria-hidden', 'true'); document.body.appendChild(shieldEl); }
      if (!spectEl) {
        spectEl = document.createElement('div'); spectEl.id = 'spect'; spectEl.setAttribute('role', 'region'); spectEl.setAttribute('translate', 'no'); document.body.appendChild(spectEl);
        spectEl.addEventListener('click', e => {
          const b = e.target.closest('[data-sp]'); if (!b) return;
          if (b.dataset.sp === 'exit') return stopWatch();
          if (b.dataset.sp === 'stk') react(b.dataset.k);
        });
      }
      spectEl.setAttribute('aria-label', T('Spettatore', 'Spectator'));
      shieldEl.hidden = spectEl.hidden = false; document.body.classList.add('spect');
      document.addEventListener('keydown', onSpectKey, true);
      spectBar();
    } else {
      if (spectEl) spectEl.hidden = true; if (shieldEl) shieldEl.hidden = true; document.body.classList.remove('spect');
      document.removeEventListener('keydown', onSpectKey, true);
    }
  }
  async function watch(name) {
    if (!member() || W.user || !host.spectate) return;
    W.demo = DEMO && host.liveState ? host.liveState() : null; // demo: la tua partita al posto di quella del compagno
    close(); Object.assign(W, { user: name, key: '', got: false, view: '', mission: '', fails: 0 });
    spectUI(true); await watchTick();
  }
  async function watchTick() {
    clearTimeout(W.t); if (!W.user) return;
    const name = W.user, r = await api('GET', '/live/' + encodeURIComponent(name));
    if (W.user !== name) return;
    if (r.status === 200) {
      W.fails = 0; W.view = r.data.view || 'hub'; W.mission = r.data.mission || '';
      let st = r.data.state, json = null;
      if (r.data.demo && W.demo) { json = W.demo.json; W.view = W.demo.view; st = { data: 'demo' }; }
      const key = st ? W.view + ':' + st.data.length + ':' + st.data.slice(-80) : '';
      if (st && key !== W.key) {
        try { if (!json) json = await unpack(st); if (W.user === name && host.spectate.show(JSON.parse(json), W.view)) { W.key = key; W.got = true; } }
        catch (e) { console.warn('spectate: cannot read the game state', e); }
      }
      spectBar(); W.t = setTimeout(watchTick, 5000); return;
    }
    if ((r.status === 0 || r.status >= 500) && ++W.fails < 4) { W.t = setTimeout(watchTick, 5000); return; }
    const e = r.data && r.data.error;
    stopWatch(e === 'not_live' ? T(name + ' ha smesso di giocare.', name + ' stopped playing.') : e === 'spectate_off' ? T(name + ' ha disattivato lo spettatore.', name + ' turned spectating off.') : errText(r));
  }
  function stopWatch(msg) {
    clearTimeout(W.t); if (!W.user) return;
    W.user = null; W.demo = null; spectUI(false);
    try { host.spectate.end(); } catch (e) {}
    if (msg) host.toast(msg);
    clearTimeout(LIVE.t); LIVE.t = setTimeout(liveBeat, 1000);
  }
  function react(code) {
    if (!W.user || !Object.prototype.hasOwnProperty.call(STICKERS, code) || Date.now() < S.coolUntil) return;
    popSticker(code, null, true); cooldown();
    api('POST', '/mine/messages', { kind: 'sticker', sticker: code, to: W.user }).then(r => { if (r.status !== 201) host.toast(errText(r)); });
  }

  /* ---------- badge dei non letti, anche a pannello chiuso ---------- */
  async function poll() {
    if (!loggedIn() || (S.open && S.tab === 'chat' && member())) return;
    if (!S.loaded) { await loadMine(); return; }
    if (!member()) return;
    const r = await api('GET', '/mine/unread');
    if (r.status === 200) { if (!r.data.member) { await loadMine(); return; } if (r.data.unread !== S.unread) { S.unread = r.data.unread; pushState(); } }
  }
  function init(opts) {
    host = Object.assign(host, opts || {});
    injectCss();
    clearInterval(pollT);
    pollT = setInterval(() => { if (document.visibilityState !== 'hidden') poll().then(flushPending); }, 30000);
    setTimeout(() => { poll().then(flushPending); }, 2500);
    clearTimeout(LIVE.t); LIVE.t = setTimeout(liveBeat, 4000);
  }
  function setDemo(on) { DEMO = !!on; try { if (on) localStorage.setItem('gng.clanDemo', '1'); else localStorage.removeItem('gng.clanDemo'); } catch (e) {} }
  const badgeHTML = () => '<b class="clbdg" data-clan-badge' + (S.unread ? '' : ' hidden') + '>' + (S.unread > 9 ? '9+' : S.unread || '') + '</b>';

  /* ---------- Piano B: consorzi finti in memoria ---------- */
  const demo = (() => {
    let db = null, seq = 0;
    const iso = (minAgo) => new Date(Date.now() - minAgo * 60000).toISOString();
    function seed() {
      const en = EN(), L = (it, e) => (en ? e : it);
      // un compagno finto con lo stesso nome del giocatore lo farebbe sembrare gia' membro: lo saltiamo
      const team = (list) => list.filter(([u]) => u.toLowerCase() !== myName().toLowerCase()).map(([u, role, sci, st]) => ({ username: u, role, science: sci, status: st, spectate: true }));
      db = { me: null, consortia: [
        { id: 'demo-milano', name: 'Orbita Milano', crest: { shape: 'shield', color: '#f07b3f', symbol: 'rocket' }, motto: L('Dal Politecnico alle stelle', 'From Politecnico to the stars'), kind: 'open', level: 2, science: 1240, minScience: 0, maxMembers: 20, schoolMode: false, inviteCode: 'MILANO26',
          members: team([['Giulia', 'director', 420, 'playing'], ['Marco', 'vice', 310, 'online'], ['Sara', 'chief_engineer', 260, 'online'], ['Luca', 'member', 150, 'offline'], ['Aisha', 'member', 100, 'offline']]), requests: [], msgs: [] },
        { id: 'demo-kuiper', name: 'Kuiper Crew', crest: { shape: 'hexagon', color: '#8a55d0', symbol: 'comet' }, motto: L('Più lontano di Plutone', 'Further than Pluto'), kind: 'request', level: 3, science: 2810, minScience: 100, maxMembers: 15, inviteCode: 'KUIPER77',
          members: team([['Nora', 'director', 900, 'online'], ['Ivo', 'vice', 700, 'offline'], ['Kai', 'member', 610, 'offline']]), requests: [], msgs: [] },
        { id: 'demo-torino', name: 'Deep Space Torino', crest: { shape: 'circle', color: '#2f6fd6', symbol: 'telescope' }, motto: L('Occhi sul cielo profondo', 'Eyes on deep space'), kind: 'invite', level: 1, science: 380, minScience: 0, maxMembers: 10, inviteCode: 'TORINO01',
          members: team([['Elena', 'director', 380, 'offline']]), requests: [], msgs: [] }
      ] };
      const m = db.consortia[0], add = (minAgo, author, kind, extra) => m.msgs.push(Object.assign({ id: ++seq, kind, author, role: author && (m.members.find(x => x.username === author) || {}).role, at: iso(minAgo) }, extra));
      add(300, null, 'system', { data: { code: 'founded', user: 'Giulia' } });
      add(120, 'Giulia', 'text', { text: L('Benvenuti nel consorzio! Stasera proviamo una missione su Marte?', 'Welcome to the consortium! Shall we try a Mars mission tonight?') });
      add(95, 'Marco', 'sticker', { sticker: 'zorty_laugh' });
      add(60, null, 'system', { data: { code: 'launch', user: 'Marco', mission: 'AURASAT' } });
      add(42, 'Sara', 'text', { text: L('Qualcuno ha un pannello solare in più? Il mio 12U non ci sta dentro con la potenza 😅', 'Anyone got a spare solar panel? My 12U is short on power 😅') });
      add(30, 'Giulia', 'mission', { data: { name: 'LUNA-ICE', type: 'obs', dest: L('Luna', 'Moon'), sci: 180, months: 12, ok: true } });
      add(29, null, 'system', { data: { code: 'science', user: 'Giulia', mission: 'LUNA-ICE', points: 180 } });
      add(8, 'Marco', 'sticker', { sticker: 'zorty_happy' });
    }
    const R = (status, data) => Promise.resolve({ status, data });
    const summary = c => ({ id: c.id, name: c.name, crest: c.crest, motto: c.motto, kind: c.kind, level: c.level, science: c.science, minScience: c.minScience, maxMembers: c.maxMembers, members: c.members.length });
    const mineC = () => db.consortia.find(c => c.members.some(m => m.username === myName()));
    const sys = (c, data) => c.msgs.push({ id: ++seq, kind: 'system', author: null, at: new Date().toISOString(), data });
    const lines = () => EN() ? ['Nice one! 🚀', 'Welcome aboard!', 'Who is launching next?', 'GO for launch!'] : ['Grande! 🚀', 'Benvenuto a bordo!', 'Chi lancia per primo?', 'GO per il lancio!'];
    function bot(c) {
      const others = c.members.filter(m => m.username !== myName() && m.status !== 'offline'); if (!others.length) return;
      setTimeout(() => { const who = others[seq % others.length], st = seq % 3 === 0; c.msgs.push({ id: ++seq, author: who.username, role: who.role, at: new Date().toISOString(), kind: st ? 'sticker' : 'text', ...(st ? { sticker: Object.keys(STICKERS)[seq % 4] } : { text: lines()[seq % 4] }) }); }, 2500);
    }
    function call(method, path, body) {
      if (!db) seed();
      body = body || {};
      const c = mineC(), me = c && c.members.find(m => m.username === myName());
      const [p, qs] = path.split('?'), q = new URLSearchParams(qs || '');
      if (method === 'GET' && p === '') {
        const t = (q.get('q') || '').toLowerCase();
        return R(200, { consortia: db.consortia.filter(x => (t ? x.name.toLowerCase().includes(t) : x.kind !== 'invite') && (!q.get('free') || x.members.length < x.maxMembers)).map(summary) });
      }
      if (method === 'POST' && p === '') {
        if (c) return R(409, { error: 'already_member' });
        if (!/^.{3,24}$/.test(String(body.name || '').trim())) return R(400, { error: 'invalid', field: 'name' });
        if (db.consortia.some(x => x.name.toLowerCase() === body.name.trim().toLowerCase())) return R(409, { error: 'name_taken' });
        const n = { id: 'demo-' + (++seq), name: body.name.trim(), crest: body.crest, motto: body.motto || '', kind: body.kind || 'open', level: 1, science: 0, minScience: body.minScience | 0, maxMembers: body.maxMembers || 20, schoolMode: false, inviteCode: 'NEW' + (1000 + seq), members: [{ username: myName(), role: 'director', science: 0, status: 'online', spectate: true }], requests: [], msgs: [] };
        db.consortia.push(n); sys(n, { code: 'founded', user: myName() }); return R(201, { consortium: summary(n) });
      }
      const join = p.match(/^\/([^/]+)\/join$/);
      if (join) {
        const t = db.consortia.find(x => x.id === join[1]); if (!t) return R(404, { error: 'not_found' });
        if (c) return R(409, { error: 'already_member' });
        if (t.members.length >= t.maxMembers) return R(409, { error: 'full' });
        const viaCode = body.code && String(body.code).toUpperCase() === t.inviteCode;
        if (!viaCode && t.kind === 'invite') return R(403, { error: body.code ? 'wrong_code' : 'invite_only' });
        if (!viaCode && t.kind === 'request') return R(202, { requested: true });
        t.members.push({ username: myName(), role: 'member', science: 0, status: 'online', spectate: true }); sys(t, { code: 'joined', user: myName() }); bot(t);
        return R(200, { joined: true });
      }
      if (method === 'GET' && p === '/mine') {
        if (!c) return R(200, { consortium: null, player: { science: db.me || 0 } });
        const unread = c.msgs.filter(m => m.id > (me.read || 0) && m.author !== myName()).length;
        return R(200, { consortium: Object.assign(summary(c), { schoolMode: !!c.schoolMode }, rank(me.role) >= 2 ? { inviteCode: c.inviteCode } : {}), me: { username: me.username, role: me.role, science: me.science, spectate: me.spectate }, members: c.members.slice().sort((a, b) => rank(b.role) - rank(a.role) || b.science - a.science), requests: rank(me.role) >= 2 ? c.requests : [], unread, player: { science: db.me || 0 } });
      }
      if (!c && p.startsWith('/mine')) return R(404, { error: 'no_consortium' });
      if (method === 'GET' && p === '/mine/unread') return R(200, { member: true, unread: c.msgs.filter(m => m.id > (me.read || 0) && m.author !== myName()).length });
      if (method === 'GET' && p === '/mine/messages') {
        const after = q.get('after'), list = after != null ? c.msgs.filter(m => m.id > +after).slice(0, 50) : c.msgs.slice(-50);
        const lastId = list.length ? list[list.length - 1].id : +(after || 0); me.read = Math.max(me.read || 0, lastId);
        return R(200, { messages: list.map(m => Object.assign({}, m)), lastId, more: false });
      }
      if (method === 'POST' && p === '/mine/messages') {
        const m = { id: ++seq, author: myName(), role: me.role, at: new Date().toISOString(), kind: body.kind };
        if (body.kind === 'text') { const t = String(body.text || '').trim(); if (!t || t.length > 300) return R(400, { error: 'invalid', field: 'text' }); if (/https?:\/\/|www\./i.test(t)) return R(400, { error: 'link' }); m.text = t; }
        else if (body.kind === 'sticker') { if (!Object.prototype.hasOwnProperty.call(STICKERS, body.sticker)) return R(400, { error: 'invalid', field: 'sticker' }); m.sticker = body.sticker; }
        else if (body.kind === 'mission') m.data = body.mission;
        else return R(400, { error: 'invalid', field: 'kind' });
        c.msgs.push(m); bot(c); return R(201, { message: m });
      }
      const del = p.match(/^\/mine\/messages\/(\d+)$/);
      if (method === 'DELETE' && del) { const m = c.msgs.find(x => x.id === +del[1]); if (!m) return R(404, { error: 'message_not_found' }); m.deleted = true; delete m.text; return R(200, { deleted: true }); }
      if (method === 'PATCH' && p === '/mine') { if (rank(me.role) < 2) return R(403, { error: 'forbidden' }); ['motto', 'kind', 'crest', 'minScience', 'maxMembers', 'schoolMode'].forEach(k => { if (body[k] !== undefined) c[k] = body[k]; }); sys(c, { code: 'settings', user: myName() }); return R(200, { consortium: summary(c) }); }
      if (method === 'POST' && p === '/mine/invite-code') { c.inviteCode = 'D' + Math.random().toString(36).slice(2, 9).toUpperCase(); return R(200, { inviteCode: c.inviteCode }); }
      if (method === 'POST' && p === '/mine/preferences') { me.spectate = !!body.spectate; return R(200, { spectate: me.spectate }); }
      const mem = p.match(/^\/mine\/members\/(.+)$/);
      if (method === 'POST' && mem) {
        const t = c.members.find(x => x.username === decodeURIComponent(mem[1])); if (!t) return R(404, { error: 'member_not_found' });
        const Rk = rank(me.role), Tk = rank(t.role);
        if (body.action === 'promote' && Tk + 1 < 3 && Rk > Tk + 1) { t.role = ROLES[Tk + 1]; sys(c, { code: 'promoted', user: t.username, role: t.role }); }
        else if (body.action === 'demote' && Tk > 0 && Rk > Tk) { t.role = ROLES[Tk - 1]; sys(c, { code: 'demoted', user: t.username, role: t.role }); }
        else if (body.action === 'kick' && Rk >= 2 && Rk > Tk) { c.members.splice(c.members.indexOf(t), 1); sys(c, { code: 'kicked', user: t.username, by: myName() }); }
        else if (body.action === 'transfer' && me.role === 'director') { me.role = 'vice'; t.role = 'director'; sys(c, { code: 'new_director', user: t.username, reason: 'transfer' }); }
        else return R(403, { error: 'forbidden' });
        return R(200, { ok: true });
      }
      if (method === 'POST' && p === '/leave') {
        c.members.splice(c.members.indexOf(me), 1);
        if (!c.members.length) { db.consortia.splice(db.consortia.indexOf(c), 1); return R(200, { left: true, disbanded: true }); }
        sys(c, { code: 'left', user: myName() });
        if (me.role === 'director') { const n = c.members.slice().sort((a, b) => rank(b.role) - rank(a.role))[0]; n.role = 'director'; sys(c, { code: 'new_director', user: n.username, reason: 'left' }); }
        return R(200, { left: true, disbanded: false });
      }
      if (method === 'POST' && p === '/science') {
        db.awarded = db.awarded || {}; const counted = !db.awarded[body.mission]; db.awarded[body.mission] = 1;
        if (counted) { db.me = (db.me || 0) + (body.points | 0); if (c && body.points > 0) { me.science += body.points | 0; c.science += body.points | 0; sys(c, { code: 'science', user: myName(), mission: body.name || '', points: body.points | 0 }); } }
        return R(200, { counted, player: { science: db.me }, consortium: c ? { science: c.science } : null });
      }
      if (!c && p.startsWith('/live')) return R(404, { error: 'no_consortium' });
      const live = p.match(/^\/live\/(.+)$/);
      if (method === 'GET' && live) { const t = c.members.find(x => x.username === decodeURIComponent(live[1])); return t && t.status !== 'offline' ? R(200, { username: t.username, view: 'hub', mission: 'LUNA-ICE', state: null, demo: true }) : R(404, { error: 'not_live' }); }
      if (method === 'PUT' && p === '/live') return R(200, { watched: false, reactions: [], lastId: 0 });
      if (method === 'POST' && p === '/mine/activity') { sys(c, { code: body.type, user: myName(), mission: body.mission }); return R(201, { posted: true }); }
      return R(404, { error: 'not_found' });
    }
    return { call, reset: () => { db = null; seq = 0; } };
  })();

  /* ---------- stile (qui, per non far crescere index.html) ---------- */
  function injectCss() {
    if (document.getElementById('clan-css')) return;
    const s = document.createElement('style'); s.id = 'clan-css';
    s.textContent = `
#clan{position:fixed;inset:0;z-index:150;display:flex;align-items:center;justify-content:center;background:rgba(10,12,16,.72);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px);padding:max(8px,env(safe-area-inset-top)) max(8px,env(safe-area-inset-right)) max(8px,env(safe-area-inset-bottom)) max(8px,env(safe-area-inset-left))}
#clan[hidden]{display:none}
body.clan-open #tbub,body.clan-open #zbtn,body.clan-open #zpanel{display:none!important}
#clan .clw{width:min(980px,100%);height:min(620px,100%);display:flex;flex-direction:column;background:#15171D;color:#F1ECE6;border-radius:12px;box-shadow:0 0 0 2px #2E3442,0 20px 50px rgba(0,0,0,.6);overflow:hidden;font-size:14px}
#clan .clh{display:flex;align-items:center;gap:10px;padding:8px 10px 8px 12px;border-bottom:1px solid #262B36;flex:none}
#clan .clt{display:flex;flex-direction:column;min-width:0;flex:1}
#clan .clt b{font-size:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#clan .clt small,#clan small{color:#ADA49C;font-size:12px}
#clan .cltabs{display:flex;gap:4px;flex:none}
#clan .cltabs button,#clan .clchip,#clan .clseg button{background:#222631;color:#D9D2CA;border:0;border-radius:999px;padding:7px 14px;font:600 13px/1 inherit;cursor:pointer;min-height:32px}
#clan .cltabs button.on,#clan .clchip.on,#clan .clseg button.on{background:#F07B3F;color:#1A1210}
#clan .clx{background:#222631;color:#F1ECE6;border:0;border-radius:50%;width:34px;height:34px;font-size:22px;line-height:1;cursor:pointer;flex:none}
#clan .clb{flex:1;min-height:0;overflow:auto;padding:10px 12px}
#clan .clerr{margin:0;padding:6px 12px;background:rgba(210,68,58,.22);color:#FFB4AB;font-size:13px}
#clan .clbtn{background:#2A2F3B;color:#F1ECE6;border:0;border-radius:8px;padding:8px 14px;font:700 13px/1.1 inherit;cursor:pointer;min-height:34px;white-space:nowrap}
#clan .clbtn.pri{background:#F07B3F;color:#1A1210}
#clan .clbtn.bad{background:rgba(210,68,58,.25);color:#FFB4AB}
#clan .clbtn.sure{background:#D2443A;color:#fff}
#clan .clbtn.sm{padding:6px 10px;min-height:30px;font-size:12px}
#clan .clbtn.big{padding:12px 18px;font-size:15px}
#clan .clbtn:disabled{opacity:.45;cursor:default}
#clan .clrow{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
#clan input:not([type=checkbox]){background:#0F1117;color:#F1ECE6;border:1px solid #2E3442;border-radius:8px;padding:8px 10px;font:14px inherit;min-height:34px;min-width:0}
#clan label{display:flex;flex-direction:column;gap:4px;font-size:12px;color:#ADA49C;flex:1}
#clan h2{margin:6px 0;font-size:20px}
#clan h3{margin:8px 0 6px;font-size:13px;text-transform:uppercase;letter-spacing:.04em;color:#7FD8CC;display:flex;gap:8px;align-items:baseline}
#clan .clempty{max-width:520px;margin:auto;text-align:center;display:flex;flex-direction:column;align-items:center;gap:6px;padding:10px}
#clan .clempty p{margin:0 0 6px;color:#CFC6BE}
#clan .clwait{color:#ADA49C;text-align:center;margin:20px 0}
#clan .clsearch input[type=search]{flex:1}
#clan .clcard,#clan .clmem,#clan .clreq{display:flex;align-items:center;gap:10px;background:#1C1F27;border-radius:10px;padding:8px 10px;margin-bottom:6px}
#clan .clci{flex:1;min-width:0;display:flex;flex-direction:column}
#clan .clci small{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#clan .clmeta{font-size:12px;color:#7FD8CC}
#clan .clcode{display:flex;gap:6px}#clan .clcode input{width:96px;text-transform:uppercase}
#clan .clform{display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap}
#clan .clcol{flex:1 1 260px;display:flex;flex-direction:column;gap:8px;min-width:0}
#clan .clseg{display:flex;gap:4px;flex-wrap:wrap}
#clan .cleditor{flex:0 1 300px;display:flex;flex-direction:column;gap:6px;align-items:center}
#clan .clpick{display:flex;gap:4px;flex-wrap:wrap;justify-content:center}
#clan .clpick button{width:36px;height:36px;border-radius:8px;border:2px solid transparent;background:#222631;color:#F1ECE6;display:grid;place-items:center;cursor:pointer;padding:0}
#clan .clpick button.on{border-color:#F07B3F}
#clan .clpick i{width:20px;height:20px;border-radius:50%;display:block}
#clan .clchat{display:flex;gap:10px;height:100%}
#clan .clfeed{flex:1;min-width:0;display:flex;flex-direction:column;position:relative}
#clan .clmsgs{flex:1;min-height:0;overflow:auto;list-style:none;margin:0;padding:0 4px 0 0;display:flex;flex-direction:column;gap:6px}
#clan .clm{align-self:flex-start;max-width:82%;background:#222631;border-radius:4px 12px 12px 12px;padding:6px 10px;display:flex;flex-direction:column;gap:2px}
#clan .clm.me{align-self:flex-end;background:#2B3A3A;border-radius:12px 4px 12px 12px}
#clan .clwho{font-size:12px;color:#ADA49C}
#clan .clwho time,#clan .clsys time{font-size:11px;color:#7A736C}
#clan .cltxt{white-space:pre-wrap;word-break:break-word}
#clan .clsys{align-self:center;text-align:center;font-size:12px;color:#ADA49C;padding:2px 8px;max-width:92%}
.clz{position:relative;display:inline-block;width:var(--zs);height:var(--zs);flex:none;vertical-align:middle}
.clz>i{position:absolute;inset:0;border-radius:50%;background-color:var(--zb,#66777f);background-repeat:no-repeat;border:max(2px,calc(var(--zs)*.045)) solid #fff;box-sizing:border-box;box-shadow:0 2px 6px rgba(0,0,0,.35);display:grid;place-items:center;font-style:normal;overflow:hidden}
.clz>svg{position:absolute;inset:-6%;width:112%;height:112%;overflow:visible;pointer-events:none}
#clan .clm .clz{margin:2px 0}
#clan .clbar{display:flex;flex-direction:column;flex:none}
#clan .clstks{display:flex;gap:6px;padding-top:6px}
#clan .clstks button{background:#222631;border:0;border-radius:10px;padding:3px;cursor:pointer;min-width:44px;min-height:44px;display:grid;place-items:center;transition:transform .08s}
#clan .clstks button:active{transform:scale(.9)}#clan .clstks button:disabled{opacity:.4;cursor:default}
#clpop{position:fixed;inset:0;z-index:152;display:grid;place-items:center;pointer-events:none}#clpop[hidden]{display:none}
#clpop .clpopin{display:flex;flex-direction:column;align-items:center;gap:8px;animation:clzpop 1.85s ease-out forwards}
#clpop .clz{filter:drop-shadow(0 12px 26px rgba(0,0,0,.5))}
#clpop .clpopby{background:rgba(21,23,29,.92);color:#fff;padding:4px 14px;border-radius:999px;font:700 15px/1.2 Inter,system-ui,sans-serif}
#spectshield{position:fixed;inset:0;z-index:148;background:transparent;touch-action:none}
#spectshield[hidden],#spect[hidden]{display:none}
#spect{position:fixed;left:50%;bottom:max(8px,env(safe-area-inset-bottom));transform:translateX(-50%);z-index:151;display:flex;align-items:center;gap:10px;background:rgba(21,23,29,.94);color:#F1ECE6;border-radius:14px;padding:6px 8px 6px 12px;box-shadow:0 0 0 2px #F07B3F,0 10px 30px rgba(0,0,0,.5);max-width:calc(100vw - 16px);font:14px/1.2 Inter,system-ui,sans-serif}
#spect .spl{display:flex;align-items:center;gap:8px;min-width:0}
#spect .spl>span{display:flex;flex-direction:column;min-width:0}
#spect b,#spect small{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#spect small{color:#ADA49C;font-size:12px}
#spect .spdot{width:10px;height:10px;border-radius:50%;background:#7A736C;flex:none}
#spect .spdot.on{background:#E5322B;animation:sppulse 1.4s infinite}
@keyframes sppulse{0%{box-shadow:0 0 0 0 rgba(229,50,43,.55)}100%{box-shadow:0 0 0 9px rgba(229,50,43,0)}}
#spect .clstks{display:flex;gap:4px}
#spect .clstks button{background:#222631;border:0;border-radius:10px;padding:2px;cursor:pointer;min-width:40px;min-height:40px;display:grid;place-items:center}
#spect .clstks button:disabled{opacity:.4;cursor:default}
#spect .clbtn{background:#2A2F3B;color:#F1ECE6;border:0;border-radius:8px;padding:8px 14px;font:700 13px/1.1 inherit;cursor:pointer;min-height:38px}
#spect button:focus-visible{outline:2px solid #7FD8CC;outline-offset:2px}
body.spect #dock,body.spect #tbub,body.spect #zbtn,body.spect #zpanel,body.spect #coach,body.spect #chand,body.spect #clan{display:none!important}
#clan .clwatch{background:rgba(229,50,43,.18);color:#FFB4AB;display:inline-flex;align-items:center;gap:4px}
@media (max-width:520px){#spect .spl small{display:none}}
@keyframes clzpop{0%{transform:scale(.3);opacity:0}12%{transform:scale(1.12);opacity:1}22%{transform:scale(1)}78%{opacity:1;transform:scale(1)}100%{transform:scale(.92) translateY(-18px);opacity:0}}
@media (prefers-reduced-motion:reduce){#clpop .clpopin{animation:clzfade 1.85s linear forwards}@keyframes clzfade{0%,78%{opacity:1}100%{opacity:0}}}
#clan .clmis{display:flex;flex-direction:column;background:#15171D;border:1px solid #2E3442;border-radius:8px;padding:6px 10px}
#clan .clmis em{font-style:normal;font-size:12px;font-weight:700}#clan .clmis em.ok{color:#5FD38D}#clan .clmis em.ko{color:#FF8A7E}
#clan .clgone{color:#7A736C}
#clan .cldel{background:none;border:0;color:#7A736C;cursor:pointer;font-size:15px;padding:0 4px}
#clan .clsend{display:flex;gap:6px;padding-top:8px;flex:none}
#clan .clsend input{flex:1}
#clan .clico2{background:#222631;border:0;border-radius:8px;min-width:38px;font-size:18px;cursor:pointer}
#clan .clshare{position:absolute;left:0;bottom:50px;background:#1C1F27;border:1px solid #2E3442;border-radius:10px;padding:8px;display:flex;flex-direction:column;gap:4px;max-height:70%;overflow:auto;z-index:2;min-width:220px}
#clan .clsat{vertical-align:-3px;color:#7FD8CC}
#clan .cleditor .clbtn.big{align-self:stretch;margin-top:4px}
#clan .clshare button{background:#222631;color:#F1ECE6;border:0;border-radius:6px;padding:8px;text-align:left;cursor:pointer}
#clan .clside{flex:0 0 190px;background:#1C1F27;border-radius:10px;padding:4px 10px;overflow:auto}
#clan .clside ul{list-style:none;margin:0;padding:0}
#clan .clside li{display:grid;grid-template-columns:12px 1fr auto;align-items:center;column-gap:6px;padding:4px 0}
#clan .clside li small{grid-column:2}#clan .clside li .clwatch{grid-row:span 2;padding:4px 8px;min-height:26px}
#clan .cldot{width:9px;height:9px;border-radius:50%;background:#555B66;display:inline-block;align-self:center;flex:none}
#clan .cldot.on{background:#5FD38D}#clan .cldot.play{background:#F2B83A;box-shadow:0 0 0 3px rgba(242,184,58,.25)}
#clan .r-director{color:#F2B83A}#clan .r-vice{color:#7FD8CC}#clan .r-chief_engineer{color:#9DB8FF}
#clan .clmem>div{flex:1;min-width:0;display:flex;flex-direction:column}
#clan .clreq{flex-wrap:wrap}#clan .clreq small{flex:1}
#clan .clacts{display:flex;gap:4px;flex-wrap:wrap;justify-content:flex-end}
#clan .clinfo{display:flex;gap:16px;flex-wrap:wrap;align-items:flex-start}
#clan .clinfo>.clcol{flex:1 1 280px}
#clan .clhero{display:flex;gap:12px;align-items:center}
#clan .clhero>div{display:flex;flex-direction:column}
#clan .clhero b{font-size:18px}
#clan .clinv{display:flex;align-items:center;gap:10px;background:#1C1F27;border-radius:10px;padding:8px 10px}
#clan .clcodev{font:700 18px/1 ui-monospace,monospace;letter-spacing:.12em;color:#F2B83A;flex:1}
#clan .clnote{margin:0;font-size:12px;color:#ADA49C}
#clan .cltog{flex-direction:row;align-items:center;gap:8px;color:#D9D2CA;font-size:13px}
#clan .clinfo .clform{flex:2 1 420px}
#clan button:focus-visible,#clan input:focus-visible{outline:2px solid #7FD8CC;outline-offset:2px}
.rs.clanb{position:relative}
.clbdg{position:absolute;top:-5px;right:-5px;min-width:17px;height:17px;padding:0 4px;border-radius:9px;background:#D2443A;color:#fff;font:700 11px/17px Inter,system-ui,sans-serif;text-align:center;box-shadow:0 0 0 2px #131313}
.clbdg[hidden]{display:none}
@media (max-height:420px){#clan .clbar{flex-direction:row;align-items:center;gap:6px}#clan .clbar .clsend{flex:1;min-width:0;padding-top:6px}#clan .clstks{gap:4px}#clan .clstks button{min-width:40px;min-height:40px;padding:2px}#clan .clw{height:100%;border-radius:8px}#clan .clh{padding:4px 8px}#clan .clb{padding:6px 10px}#clan .clt b{font-size:14px}#clan .clempty .clcrest{width:48px;height:48px}#clan h2{font-size:17px;margin:2px 0}#clan .cleditor .clprev .clcrest{width:56px;height:56px}#clan .clpick button{width:30px;height:30px}}
@media (max-width:640px){#clan .clside{display:none}#clan .clt small{display:none}#clan .cltabs button{padding:7px 10px}}
@media (prefers-reduced-motion:no-preference){#clan .clw{animation:clin .16s ease-out}@keyframes clin{from{transform:translateY(8px);opacity:0}}}
`;
    document.head.appendChild(s);
  }

  return { init, open, close, isOpen: () => S.open, unread: () => S.unread, badgeHTML, crestSVG, science, activity, setDemo,
    stickerHTML, stickers: () => Object.keys(STICKERS), watching: () => W.user, stopWatch: () => stopWatch(),
    _test: { sysText, errText, demo, state: S, loadMine, pack, unpack } };
})();
