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
    // sbloccati con il livello del consorzio (lvl), come STICKER_LEVEL nel server
    zorty_cheer: { pose: 'incoraggia', lvl: 2, bg: '#1E9E5A', n: ['Zorty pollice in su', 'Thumbs-up Zorty'], emoji: '👍', x: 48, y: 5, k: 135,
      fx: '<g fill="#FFD24A" stroke="#fff" stroke-width="1.2"><path d="M86 14l2.2 5 5 2.2-5 2.2L86 28l-2.2-4.6-5-2.2 5-2.2z"/><path d="M14 66l1.6 3.6 3.6 1.6-3.6 1.6L14 76l-1.6-3.6-3.6-1.6 3.6-1.6z"/></g>' },
    zorty_think: { pose: 'pensoso', lvl: 3, bg: '#8A55D0', n: ['Zorty pensieroso', 'Thinking Zorty'], emoji: '🤔', x: 50, y: 4, k: 140,
      fx: '<g font-family="Inter,system-ui,sans-serif" font-weight="900" fill="#fff" stroke="#22313B" stroke-width="1.4" paint-order="stroke"><text x="72" y="26" font-size="20">?</text><text x="84" y="16" font-size="13">?</text></g>' },
    zorty_wow: { pose: 'spaventato', lvl: 4, bg: '#1FA2A8', n: ['Zorty sbalordito', 'Amazed Zorty'], emoji: '😲', x: 50, y: 4, k: 135,
      fx: '<g font-family="Inter,system-ui,sans-serif" font-weight="900" fill="#FFD24A" stroke="#22313B" stroke-width="1.4" paint-order="stroke"><text x="6" y="28" font-size="20" transform="rotate(-12 12 22)">!</text><text x="82" y="26" font-size="20" transform="rotate(12 86 20)">!</text></g>' },
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
  // gold: bordo d'oro (vantaggio del consorzio dal livello 4)
  function crestSVG(c, px, gold) {
    c = c || {};
    const shape = SHAPE_SVG[c.shape] || SHAPE_SVG.shield, sym = c.symbol === 'none' ? '' : SYMBOL_SVG[c.symbol] || SYMBOL_SVG.rocket, col = hex(c.color);
    return '<svg xmlns="http://www.w3.org/2000/svg" class="clcrest" viewBox="0 0 100 100" width="' + (px || 40) + '" height="' + (px || 40) + '" aria-hidden="true">' +
      '<g fill="' + col + '" stroke="' + (gold ? '#F2B83A' : '#fff') + '" stroke-width="' + (gold ? 7 : 5) + '" stroke-linejoin="round">' + shape + '</g>' +
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
      case 'joint_new': return T(u + ' ha aperto la missione congiunta ' + m + ': prendi un ruolo!', u + ' opened the joint mission ' + m + ': take a role!');
      case 'challenge_points': return T(u + ': ' + (m || 'una missione') + ' vale per la sfida della settimana, +' + (d.points | 0), u + ': ' + (m || 'a mission') + ' counts for the weekly challenge, +' + (d.points | 0));
      case 'level_up': return T('Il consorzio sale al livello ' + d.level + '! I nuovi vantaggi sono nella scheda Info', 'The consortium reaches level ' + d.level + '! The new perks are in the Info tab');
      case 'challenge_won': return T('Sfida della settimana: ' + d.place + '° posto! Trofeo e +' + (d.bonus | 0) + ' punti scienza al consorzio', 'Weekly challenge: place ' + d.place + '! A trophy and +' + (d.bonus | 0) + ' science points to the consortium');
      case 'joint_done': return T('Missione congiunta ' + m + ': GO da tutti! +' + (d.points | 0) + ' punti scienza a ' + (d.users || []).join(', '), 'Joint mission ' + m + ': GO from everyone! +' + (d.points | 0) + ' science points to ' + (d.users || []).join(', '));
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
      school_mode: ['Modalità scuola: solo sticker e frasi pronte.', 'School mode: stickers and preset phrases only.'],
      language: ['Linguaggio non adatto: riformula, per favore.', 'That language is not allowed: please rephrase.'],
      self: ['Non si può fare su sé stessi.', 'You cannot do that to yourself.'],
      message_not_found: ['Messaggio non trovato.', 'Message not found.'],
      not_found: ['Non trovato.', 'Not found.'],
      offline: ['Nessuna connessione.', 'No connection.'],
      unavailable: ['Servizio consorzi non disponibile.', 'Consortium service unavailable.'],
      stale: ['Un compagno ha appena cambiato qualcosa: aggiorno.', 'A teammate just changed something: refreshing.'],
      not_your_turn: ['Non è il tuo turno.', 'It is not your turn.'],
      not_your_role: ['Questa scelta spetta a un altro ruolo.', 'This choice belongs to another role.'],
      pending_request: ['Prima va risolta la richiesta in sospeso.', 'The pending request must be settled first.'],
      incomplete: ['Mancano ancora delle scelte del tuo ruolo.', 'Your role still has choices to make.'],
      need_two: ['Servono almeno due giocatori.', 'At least two players are needed.'],
      role_taken: ['Ruolo già preso.', 'Role already taken.'],
      has_role: ['Hai già un ruolo.', 'You already have a role.'],
      checks_failed: ['La revisione non passa ancora.', 'The review does not pass yet.'],
      too_many_joint: ['Ci sono già 3 missioni congiunte aperte.', 'There are already 3 open joint missions.'],
      closed: ['La missione è chiusa.', 'The mission is closed.'],
      started: ['La missione è già partita.', 'The mission has already started.']
    };
    if (e === 'sticker_locked') return T('Questo sticker si sblocca al livello ' + d.level + ' del consorzio.', 'This sticker unlocks at consortium level ' + d.level + '.');
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
  /* Moderazione: frasi predefinite (modalita' scuola; stessi codici di PHRASES nel server), compagni silenziati
     (solo in questo browser), segnalazioni (direttore e vice le controllano nella scheda Membri). */
  const PHRASES_T = { nice_launch: ['Bel lancio!', 'Nice launch!'], need_solar: ['Mi serve un pannello solare', 'I need a solar panel'], go: ['GO per il lancio!', 'GO for launch!'],
    help: ['Mi aiutate?', 'Can you help me?'], thanks: ['Grazie!', 'Thanks!'], well_done: ['Ben fatto, squadra!', 'Well done, team!'],
    joint: ['Entro nella missione congiunta', 'I am joining the joint mission'], watch_me: ['Guardatemi giocare!', 'Watch me play!'] };
  const MUTE_KEY = 'gng.clan.muted';
  const muted = () => { try { return JSON.parse(localStorage.getItem(MUTE_KEY) || '[]'); } catch (e) { return []; } };
  const isMuted = u => !!u && muted().indexOf(u) >= 0;
  const setMuted = (u, on) => { const l = muted().filter(x => x !== u); if (on) l.push(u); try { localStorage.setItem(MUTE_KEY, JSON.stringify(l.slice(-50))); } catch (e) {} };
  const MOD = { reported: {}, show: {}, reports: null };
  const FLAG = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 21V4M5 4h11l-2 4 2 4H5"/></svg>';
  async function loadReports() { if (!lead()) { MOD.reports = null; return; } const r = await api('GET', '/mine/reports'); if (r.status === 200) MOD.reports = r.data.reports || []; }
  // Livelli del consorzio: soglie come LEVELS nel server. Vantaggi: sconto sui lanci, stazione di terra condivisa (liv. 3), stemma d'oro (liv. 4), sticker.
  const LEVELS = [0, 400, 1200, 3000, 6000];
  const LAUNCH_K = [1, 0.95, 0.95, 0.9, 0.85];
  const goldOf = lvl => (lvl | 0) >= 4;
  const myLevel = () => (member() ? (S.mine.consortium.level | 0) || 1 : 0);
  const locked = code => ((STICKERS[code] && STICKERS[code].lvl) || 1) > Math.max(1, myLevel());
  const LOCK = '<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" aria-hidden="true"><path d="M7 10V7a5 5 0 0 1 10 0v3h1a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1zm2 0h6V7a3 3 0 0 0-6 0z"/></svg>';
  const lockTag = code => (locked(code) ? '<i class="cllock" title="' + T('Si sblocca al livello ', 'Unlocks at level ') + STICKERS[code].lvl + '">' + LOCK + STICKERS[code].lvl + '</i>' : '');
  function perks() { const l = myLevel(); return { level: l, launch: l ? LAUNCH_K[l - 1] : 1, ground: l >= 3, gold: goldOf(l) }; }
  function levelCard(c) {
    const l = c.level || 1, next = LEVELS[l], prev = LEVELS[l - 1] || 0, pc = next ? Math.max(0, Math.min(100, Math.round((c.science - prev) / (next - prev) * 100))) : 100;
    const list = [[2, T('Sconto 5% sui lanci', '5% off launches'), 'zorty_cheer'], [3, T('Stazione di terra condivisa: +20% di dati in volo', 'Shared ground station: +20% flight data'), 'zorty_think'],
      [4, T('Sconto 10% sui lanci e stemma d’oro', '10% off launches and a golden crest'), 'zorty_wow'], [5, T('Sconto 15% sui lanci', '15% off launches'), null]];
    return '<div class="cllvl"><div class="cllvlh"><b>' + T('Livello ', 'Level ') + l + '</b><small>' + (next ? c.science + ' / ' + next + ' ◆ ' + T('per il livello ', 'to level ') + (l + 1) : T('Livello massimo', 'Top level')) + '</small></div>' +
      '<i class="cllvlbar"><u style="width:' + pc + '%"></u></i><ul>' + list.map(([lv, t, stk]) => '<li class="' + (l >= lv ? 'on' : '') + '"><b>' + T('Liv ', 'Lv ') + lv + '</b><span>' + t +
      (stk ? ' · ' + T('sticker ', 'sticker ') + esc(T(...STICKERS[stk].n)) : '') + '</span><em>' + (l >= lv ? '✓' : LOCK) + '</em></li>').join('') + '</ul></div>';
  }
  const myRole = () => (S.mine && S.mine.me ? S.mine.me.role : 'member');
  const lead = () => rank(myRole()) >= 2;

  function pushState() {
    const c = member() ? S.mine.consortium : null;
    if (typeof document !== 'undefined') document.querySelectorAll('[data-clan-badge]').forEach(b => { b.textContent = S.unread > 9 ? '9+' : String(S.unread); b.hidden = !S.unread; });
    try { host.onState({ auth: loggedIn(), member: !!c, name: c ? c.name : '', crest: c ? c.crest : null, unread: S.unread, level: c ? c.level || 1 : 0 }); } catch (e) {}
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
      else if (r.status === 200 && r.data.challenge && r.data.challenge.matched) host.toast(T('Vale per la sfida della settimana! +' + r.data.challenge.points + ' punti al consorzio.', 'It counts for the weekly challenge! +' + r.data.challenge.points + ' points to your consortium.'));
    }
    writePending(left);
  }
  // facts: i dati della missione (esito, destinazione, tipo, costo, mesi) per la sfida della settimana
  function science(mission, points, name, facts) {
    if (!loggedIn() || !mission) return;
    const p = { mission: String(mission).replace(/[^A-Za-z0-9_.:-]/g, '').slice(0, 64), points: Math.max(0, Math.min(1000, Math.round(points) || 0)), name: String(name || '').slice(0, 24) };
    if (facts && typeof facts === 'object' && /^[a-z]{2,12}$/.test(facts.dest) && /^[a-z]{2,8}$/.test(facts.type))
      p.facts = { ok: !!facts.ok, dest: facts.dest, type: facts.type, cost: Math.max(0, Math.min(1e6, Math.round(facts.cost) || 0)), months: Math.max(0, Math.min(600, Math.round(facts.months) || 0)) };
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
    // l'animazione d'ingresso solo all'apertura: i ridisegni (schede, azioni) non devono far lampeggiare il pannello
    root.classList.add('opening'); setTimeout(() => root.classList.remove('opening'), 300);
    if (tab === 'challenge') { S.tab = S.noTab = 'challenge'; }
    else if (tab) { if (['chat', 'members', 'info'].includes(tab)) S.tab = tab; else S.noTab = tab; }
    draw();
    if (!loggedIn()) return;
    await loadMine(); await flushPending();
    if (!member() && !S.down) await search();
    if ((member() ? S.tab : S.noTab) === 'challenge' && !S.down) await loadChallenge();
    draw(); startChat();
  }
  function close() {
    if (!root) return; S.open = false; root.hidden = true; document.body.classList.remove('clan-open'); stopChat(); if (popEl) popEl.hidden = true;
    clearTimeout(mineT); clearTimeout(J.t);
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
    r.data.messages.forEach(m => { const i = S.msgs.findIndex(x => x.id === m.id); if (i >= 0) S.msgs[i] = m; else { S.msgs.push(m); if (m.kind === 'sticker' && !m.deleted && m.author !== myName() && !isMuted(m.author)) pop = m.sticker; } });
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
    const tabs = !loggedIn() || S.down ? [] : c ? [['chat', T('Chat', 'Chat')], ['missions', T('Missioni', 'Missions')], ['challenge', T('Sfida', 'Challenge')], ['members', T('Membri', 'Members') + (S.mine && S.mine.reports ? ' · ' + S.mine.reports : '')], ['info', T('Info', 'Info')]] : [['search', T('Cerca', 'Search')], ['create', T('Crea', 'Create')], ['challenge', T('Classifica', 'Ranking')]];
    const cur = c ? S.tab : S.noTab;
    root.innerHTML = '<div class="clw" role="dialog" aria-modal="true" aria-label="' + T('Consorzio', 'Consortium') + '">' +
      '<header class="clh">' + (c ? crestSVG(c.crest, 34, goldOf(c.level)) : '<span class="clico">' + crestSVG({ shape: 'shield', color: '#66777f', symbol: 'orbit' }, 34) + '</span>') +
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
    if (!member()) return tab === 'create' ? createView() : tab === 'challenge' ? challengeView() : searchView();
    if (tab === 'members') return membersView();
    if (tab === 'info') return infoView();
    if (tab === 'missions') return jointsView();
    if (tab === 'challenge') return challengeView();
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
    return '<article class="clcard">' + crestSVG(c.crest, 42, goldOf(c.level)) + '<div class="clci"><b>' + esc(c.name) + trophyTag(c.trophies) + '</b><small>' + esc(c.motto || '') + '</small>' +
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
    const out = '<div class="clchat"><section class="clfeed"><ol class="clmsgs" aria-live="polite"></ol>' +
      (S.share ? '<div class="clshare" role="menu"><b>' + T('Condividi una missione', 'Share a mission') + '</b>' + (done.length ? done.map((m, i) => '<button role="menuitem" data-cl="sharem" data-i="' + i + '">' + SAT + esc(m.name) + ' <small>' + (m.sci | 0) + ' ◆</small></button>').join('') : '<p>' + T('Nessuna missione conclusa.', 'No finished missions.') + '</p>') + '</div>' : '') +
      '<div class="clbar"><div class="clstks" role="group" aria-label="Sticker">' + Object.keys(STICKERS).map(k => '<button type="button" data-cl="stk" data-k="' + k + '" aria-label="' + esc(T(...STICKERS[k].n)) + '" title="' + esc(T(...STICKERS[k].n)) + '"' + (Date.now() < S.coolUntil || locked(k) ? ' disabled' : '') + '>' + stickerHTML(k, 38) + lockTag(k) + '</button>').join('') + '</div>' +
      (S.mine.consortium.schoolMode ? '<div class="clphr" role="group" aria-label="' + T('Frasi della modalità scuola', 'School mode phrases') + '">' + Object.keys(PHRASES_T).map(k => '<button type="button" class="clchip" data-cl="phrase" data-k="' + k + '">' + esc(T(...PHRASES_T[k])) + '</button>').join('') + '</div></div></section><aside class="clside" aria-label="' + T('Membri', 'Members') + '"></aside></div>' : '') +
      '<form class="clsend" data-cl-form="send"><button type="button" class="clico2" data-cl="share" aria-expanded="' + S.share + '" aria-label="' + T('Condividi una missione', 'Share a mission') + '">' + SAT + '</button>' +
      '<input data-f="msg" maxlength="300" autocomplete="off" enterkeyhint="send" placeholder="' + (S.mine.consortium.schoolMode ? T('Modalità scuola: solo sticker', 'School mode: stickers only') : T('Scrivi al consorzio…', 'Message your consortium…')) + '" aria-label="' + T('Messaggio', 'Message') + '"' + (S.mine.consortium.schoolMode ? ' disabled' : '') + '>' +
      '<button class="clbtn pri">' + T('Invia', 'Send') + '</button></form></div></section><aside class="clside" aria-label="' + T('Membri', 'Members') + '"></aside></div>';
    // in modalita' scuola la fila delle frasi chiude la barra: il modulo di testo non si disegna
    return S.mine.consortium.schoolMode ? out.slice(0, out.indexOf('<form class="clsend"')) : out;
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
    const set = off => document.querySelectorAll('#clan [data-cl="stk"],#spect [data-sp="stk"]').forEach(b => { b.disabled = off || locked(b.dataset.k); });
    set(true); setTimeout(() => set(false), 2050);
  }
  function msgHTML(m) {
    const me = m.author && m.author === myName();
    if (m.kind === 'system') return '<li class="clsys">' + esc(sysText(m.data)) + ' <time>' + timeOf(m.at) + '</time>' +
      (m.data && m.data.code === 'joint_new' && typeof m.data.id === 'string' ? ' <button class="clbtn sm" data-cl="jopen" data-id="' + esc(m.data.id) + '">' + T('Apri', 'Open') + '</button>' : '') + '</li>';
    const head = '<span class="clwho"><b class="r-' + esc(m.role || 'member') + '">' + esc(m.author || '?') + '</b>' + (m.to ? ' → ' + esc(m.to) : '') + ' <time>' + timeOf(m.at) + '</time>' +
      (!m.deleted && (me || lead()) ? ' <button class="cldel" data-cl="del" data-id="' + m.id + '" aria-label="' + T('Elimina', 'Delete') + '">×</button>' : '') +
      (!m.deleted && !me ? (MOD.reported[m.id] ? ' <span class="clrep done">' + FLAG + T('Segnalato', 'Reported') + '</span>'
        : ' <button class="clrep' + (S.confirm === 'rep:' + m.id ? ' sure' : '') + '" data-cl="report" data-id="' + m.id + '" aria-label="' + T('Segnala', 'Report') + '" title="' + T('Segnala', 'Report') + '">' + FLAG + (S.confirm === 'rep:' + m.id ? T('Segnalare?', 'Report?') : '') + '</button>') : '') + '</span>';
    if (!me && !m.deleted && isMuted(m.author) && !MOD.show[m.id]) return '<li class="clm muted">' + head + '<em class="clgone">' + esc(T('Hai silenziato ' + m.author + '. ', 'You muted ' + m.author + '. ')) + '<button class="clbtn sm" data-cl="unhide" data-id="' + m.id + '">' + T('Mostra', 'Show') + '</button></em></li>';
    let inner;
    if (m.deleted) inner = '<em class="clgone">' + T('Messaggio eliminato', 'Message deleted') + '</em>';
    else if (m.kind === 'sticker') inner = stickerHTML(m.sticker, 84);
    else if (m.kind === 'mission') { const d = m.data || {}; inner = '<span class="clmis"><b>' + SAT + esc(d.name) + '</b><small>' + [d.dest, d.months != null ? d.months + T(' mesi', ' months') : '', d.sci != null ? d.sci + ' ◆' : ''].filter(Boolean).map(esc).join(' · ') + '</small>' + (d.ok != null ? '<em class="' + (d.ok ? 'ok' : 'ko') + '">' + (d.ok ? T('Riuscita', 'Success') : T('Non riuscita', 'Failed')) + '</em>' : '') + '</span>'; }
    else inner = '<span class="cltxt">' + esc(m.phrase && PHRASES_T[m.phrase] ? T(...PHRASES_T[m.phrase]) : m.text) + '</span>';
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
    const btn = (act, label, danger) => { const key = act + ':' + m.username, sure = S.confirm === key; return '<button class="clbtn sm' + (danger ? ' bad' : '') + (sure ? ' sure' : '') + '" data-cl="member" data-op="' + act + '" data-u="' + esc(m.username) + '">' + (sure ? T('Confermi?', 'Confirm?') : label) + '</button>'; };
    if (Tg + 1 < 3 && R > Tg + 1) out.push(btn('promote', T('Promuovi', 'Promote')));
    if (Tg > 0 && R > Tg) out.push(btn('demote', T('Retrocedi', 'Demote')));
    if (R >= 2 && R > Tg) out.push(btn('kick', T('Espelli', 'Remove'), true));
    if (myRole() === 'director') out.push(btn('transfer', T('Passa la direzione', 'Hand over'), true));
    return out.length ? '<div class="clacts">' + out.join('') + '</div>' : '';
  }
  function reportsView() {
    if (!lead() || !MOD.reports || !MOD.reports.length) return '';
    const why = { rude: T('offensivo', 'offensive'), spam: 'spam', other: T('altro', 'other') };
    return '<h3>' + FLAG + ' ' + T('Segnalazioni da controllare', 'Reports to review') + '</h3>' + MOD.reports.map(r => '<article class="clreq clrepv"><b>' + esc(r.author || '?') + '</b>' +
      '<small>' + (r.kind === 'text' ? '«' + esc(r.text) + '»' : r.kind === 'sticker' ? 'sticker' : T('scheda missione', 'mission card')) + ' · ' + r.reports + ' ' + T('segnalazioni', 'reports') + ' (' + (r.reasons || []).map(x => why[x] || x).join(', ') + ')' + (r.hidden ? ' · ' + T('nascosto', 'hidden') : '') + '</small>' +
      '<div class="clacts"><button class="clbtn sm bad" data-cl="review" data-op="delete" data-id="' + r.id + '">' + T('Elimina', 'Delete') + '</button><button class="clbtn sm" data-cl="review" data-op="dismiss" data-id="' + r.id + '">' + T('Va bene così', 'It is fine') + '</button></div></article>').join('');
  }
  const muteBtn = m => m.username === myName() ? '' : '<button class="clbtn sm" data-cl="mute" data-u="' + esc(m.username) + '">' + (isMuted(m.username) ? T('Riattiva', 'Unmute') : T('Silenzia', 'Mute')) + '</button>';
  function membersView() {
    const reqs = lead() ? S.mine.requests || [] : [];
    return '<div class="clmembers">' + reportsView() + (reqs.length ? '<h3>' + T('Richieste di ingresso', 'Join requests') + '</h3>' + reqs.map(r => '<article class="clreq"><b>' + esc(r.username) + '</b><small>' + r.science + ' ◆' + (r.message ? ' · «' + esc(r.message) + '»' : '') + '</small>' +
      '<div class="clacts"><button class="clbtn sm pri" data-cl="req" data-id="' + r.id + '" data-ok="1">' + T('Accetta', 'Accept') + '</button><button class="clbtn sm" data-cl="req" data-id="' + r.id + '" data-ok="0">' + T('Rifiuta', 'Reject') + '</button></div></article>').join('') : '') +
      '<h3>' + T('Membri', 'Members') + ' · ' + S.mine.members.length + '/' + S.mine.consortium.maxMembers + '</h3>' +
      S.mine.members.map(m => '<article class="clmem">' + status(m.status) + '<div><b class="r-' + esc(m.role) + '">' + esc(m.username) + (m.username === myName() ? ' <small>(' + T('tu', 'you') + ')</small>' : '') + '</b><small>' + roleName(m.role) + ' · ' + m.science + ' ◆</small></div>' + watchBtn(m) + muteBtn(m) + memberActions(m) + '</article>').join('') + '</div>';
  }
  function infoView() {
    const c = S.mine.consortium, ed = lead();
    if (ed && !S.edit) S.edit = { motto: c.motto || '', kind: c.kind, minScience: c.minScience, maxMembers: c.maxMembers, schoolMode: !!c.schoolMode, crest: Object.assign({}, c.crest) };
    const sure = S.confirm === 'leave';
    return '<div class="clinfo"><div class="clcol"><div class="clhero">' + crestSVG(c.crest, 64, goldOf(c.level)) + '<div><b>' + esc(c.name) + trophyTag(c.trophies) + '</b><small>' + esc(c.motto || '') + '</small>' +
      '<span class="clmeta">' + kindName(c.kind) + ' · ' + T('Livello ', 'Level ') + c.level + ' · ' + c.science + ' ◆' + (c.minScience ? ' · min ' + c.minScience + ' ◆' : '') + '</span></div></div>' + levelCard(c) +
      (ed && c.inviteCode ? '<div class="clinv"><span>' + T('Codice invito', 'Invite code') + '</span><b class="clcodev">' + esc(c.inviteCode) + '</b><button class="clbtn sm" data-cl="newcode">' + T('Nuovo codice', 'New code') + '</button></div><p class="clnote">' + T('Dallo a chi vuoi invitare: con il codice si entra sempre, anche se il consorzio è su invito.', 'Give it to the people you invite: the code always lets them in, even when the consortium is invite only.') + '</p>' : '') +
      '<label class="cltog"><input type="checkbox" data-cl-in="spectate"' + (S.mine.me.spectate !== false ? ' checked' : '') + '> ' + T('I compagni possono guardarmi mentre gioco', 'Teammates can watch me play') + '</label>' +
      '<button class="clbtn bad' + (sure ? ' sure' : '') + '" data-cl="leave">' + (sure ? T('Confermi? Tocca di nuovo', 'Sure? Tap again') : T('Lascia il consorzio', 'Leave the consortium')) + '</button></div>' +
      (ed ? '<form class="clform" data-cl-form="settings"><div class="clcol"><h3>' + T('Impostazioni', 'Settings') + '</h3>' + settingsFields(S.edit, false) +
        '<label class="cltog"><input type="checkbox" data-cl-in="schoolMode"' + (S.edit.schoolMode ? ' checked' : '') + '> ' + T('Modalità scuola (solo sticker)', 'School mode (stickers only)') + '</label>' +
        '<button class="clbtn pri"' + (S.busy ? ' disabled' : '') + '>' + T('Salva', 'Save') + '</button></div>' + crestEditor(S.edit) + '</form>' : '') + '</div>';
  }

  /* ---------- azioni ---------- */
  async function run(fn) {
    if (S.busy) return Promise.resolve(); S.busy = true; S.err = '';
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
    if (a === 'tab') {
      if (member()) S.tab = b.dataset.k; else S.noTab = b.dataset.k; S.err = ''; S.share = false; clearTimeout(J.t);
      if (member() && S.tab === 'members' && lead()) { stopChat(); draw(); run(loadReports); return; }
      if (member() && S.tab === 'missions') { J.id = null; J.m = null; J.list = null; draw(); run(jList).then(jPoll); return; }
      if ((member() ? S.tab : S.noTab) === 'challenge') { stopChat(); draw(); run(loadChallenge); return; }
      draw(); if (member()) startChat(); else if (S.noTab === 'search' && !S.list) run(search); return;
    }
    if (a === 'board') { CH.board = b.dataset.k; draw(); return; }
    if (a === 'jopen') { S.tab = 'missions'; stopChat(); J.id = b.dataset.id; J.m = null; return run(() => jLoad(J.id, true)).then(jPoll); }
    if (a === 'jback') { J.id = null; J.m = null; return run(jList).then(jPoll); }
    if (a === 'jset') { const key = b.dataset.key, value = key === 'budget' ? +b.dataset.v : b.dataset.v, req = jNeedReq(J.m.state, key, value, myName()); return jAct(Object.assign({ type: 'set', key, value }, req ? { req } : {})); }
    if (a === 'jact') {
      const x = b.dataset.a;
      if (x === 'abandon' && S.confirm !== 'jabandon') return arm('jabandon');
      S.confirm = '';
      if (x === 'join') return jAct({ type: 'join', role: b.dataset.role });
      if (x === 'go') return jAct({ type: 'vote', go: true, ok: jChecks(J.m.state.design).ok });
      if (x === 'nogo') return jAct({ type: 'vote', go: false, rework: b.dataset.role });
      if (x === 'accept' || x === 'reject') return jAct({ type: 'answer', decision: x });
      if (x === 'counter') return jAct({ type: 'answer', decision: 'counter', value: b.dataset.v });
      return jAct({ type: x });
    }
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
    if (a === 'report') {
      const id = b.dataset.id; if (S.confirm !== 'rep:' + id) { arm('rep:' + id); drawFeed(); return; }
      S.confirm = '';
      return run(async () => { const r = await api('POST', '/mine/messages/' + id + '/report', { reason: 'rude' }); if (r.status !== 200) return fail(r);
        MOD.reported[id] = 1; host.toast(r.data.hidden ? T('Segnalato: il messaggio è stato nascosto. Direttore e vice lo controlleranno.', 'Reported: the message is now hidden. The director and deputy will review it.') : T('Segnalato, grazie: direttore e vice lo controlleranno.', 'Reported, thanks: the director and deputy will review it.'));
        if (r.data.hidden) { const m = S.msgs.find(x => String(x.id) === id); if (m) m.deleted = true; } });
    }
    if (a === 'unhide') { MOD.show[b.dataset.id] = 1; drawFeed(); return; }
    if (a === 'mute') { const u = b.dataset.u; setMuted(u, !isMuted(u)); host.toast(isMuted(u) ? T('Hai silenziato ' + u + ': i suoi messaggi restano nascosti per te.', 'You muted ' + u + ': their messages stay hidden for you.') : T(u + ' riattivato.', u + ' unmuted.')); draw(); return; }
    if (a === 'phrase') {
      const k = b.dataset.k; if (!PHRASES_T[k] || Date.now() < S.coolUntil) return;
      cooldown(); return run(async () => { const r = await api('POST', '/mine/messages', { kind: 'phrase', phrase: k }); if (r.status !== 201) fail(r); else await pollChat(); });
    }
    if (a === 'review') return run(async () => { const r = await api('POST', '/mine/reports/' + b.dataset.id, { action: b.dataset.op }); if (r.status !== 200) fail(r); await loadReports(); await loadMine(); });
    if (a === 'stk') {
      const code = b.dataset.k; if (!STICKERS[code] || locked(code) || Date.now() < S.coolUntil) return;
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
      const act = b.dataset.op, key = act + ':' + b.dataset.u;
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
    if (k === 'jname') { J.name = e.target.value; return; }
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
    if (kind === 'jnew') {
      const name = J.name.trim();
      return run(async () => {
        const r = await api('POST', '/mine/joint', { name });
        if (r.status !== 201) return fail(r);
        J.name = ''; J.id = r.data.id; J.m = r.data; try { host.sfx('ok'); } catch (err) {}
      }).then(jPoll);
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

  /* ---------- sfida della settimana e classifica dei consorzi ----------
     L'obiettivo, i punti e i premi li decide il server (backend/consortia.mjs, CHALLENGES): qui si mostrano. */
  const CH = { data: null, board: 'week' };
  const CUP = '<svg class="clcup" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4M12 14v3M8 21h8M9 21l1-4h4l1 4"/></svg>';
  const trophyTag = n => n ? ' <span class="cltro" title="' + T('Trofei', 'Trophies') + '">' + CUP + n + '</span>' : '';
  async function loadChallenge() { const r = await api('GET', '/challenge'); if (r.status === 200) CH.data = r.data; else if (down(r)) S.down = true; }
  function timeLeft(endsAt) {
    const ms = Date.parse(endsAt) - Date.now(); if (!(ms > 0)) return T('in chiusura', 'closing');
    const d = Math.floor(ms / 864e5), h = Math.floor(ms % 864e5 / 36e5), m = Math.floor(ms % 36e5 / 6e4);
    return d ? T(d + ' g ' + h + ' h', d + 'd ' + h + 'h') : T(h + ' h ' + m + ' min', h + 'h ' + m + 'm');
  }
  function goalTags(g) {
    const typeN = g.type && typeof O !== 'undefined' && O.TYPES && O.TYPES[g.type] ? tr(O.TYPES[g.type].n) : g.type;
    return [g.dest ? jName('dest', g.dest) : null, typeN || null, g.maxCost ? '≤ ' + g.maxCost + ' cr' : null, g.minMonths ? '≥ ' + g.minMonths + T(' mesi', ' months') : null, T('riuscita', 'successful')].filter(Boolean);
  }
  function challengeView() {
    const c = CH.data; if (!c) return '<p class="clwait">' + T('Caricamento…', 'Loading…') + '</p>';
    const g = c.goal, mine = c.mine, my = mine && mine.id, all = CH.board === 'all', list = all ? c.allTime : c.ranking;
    const rows = list.length ? list.map((r, i) => '<li class="' + (r.id === my ? 'me' : '') + '"><b class="num">' + (i + 1) + '</b>' + crestSVG(r.crest, 26, goldOf(r.level)) + '<span>' + esc(r.name) + (all ? trophyTag(r.trophies) : '') + '</span><small>' + T('Liv ', 'Lv ') + r.level + '</small><b>' + r.points + ' ◆</b></li>').join('')
      : '<li class="empty">' + (all ? T('Ancora nessun punto.', 'No points yet.') : T('Nessun punto questa settimana: sii il primo!', 'No points this week yet: be the first!')) + '</li>';
    return '<div class="clch">' +
      '<section class="chgoal"><small>' + T('Sfida della settimana', 'Weekly challenge') + ' · ' + T('finisce tra ', 'ends in ') + timeLeft(c.endsAt) + '</small><b>' + esc(T(g.it, g.en)) + '</b>' +
      '<span class="chcrit">' + goalTags(g).map(x => '<i>' + esc(x) + '</i>').join('') + '</span>' +
      '<small>' + T('Le missioni riuscite che rispettano l’obiettivo portano i loro punti scienza anche alla sfida. Premi ai primi tre: ', 'Successful missions that meet the goal also bring their science points to the challenge. Prizes for the top three: ') + c.prizes.map((p, i) => (i + 1) + '° +' + p + ' ◆').join(' · ') + '</small></section>' +
      (mine ? '<div class="chmine"><div><small>' + T('Questa settimana', 'This week') + '</small><b>' + mine.week.points + ' ◆' + (mine.week.rank ? ' · ' + mine.week.rank + '°' : '') + '</b></div><div><small>' + T('Di sempre', 'All time') + '</small><b>' + mine.allTime.points + ' ◆ · ' + mine.allTime.rank + '°</b></div><div><small>' + T('Trofei', 'Trophies') + '</small><b>' + CUP + ' ' + (mine.trophies || []).length + '</b></div></div>'
        : '<p class="clnote">' + T('Entra in un consorzio per partecipare alla sfida.', 'Join a consortium to take part in the challenge.') + '</p>') +
      '<div class="clseg chboard" role="group">' + [['week', T('Questa settimana', 'This week')], ['all', T('Di sempre', 'All time')]].map(x => '<button class="' + (CH.board === x[0] ? 'on' : '') + '" data-cl="board" data-k="' + x[0] + '" aria-pressed="' + (CH.board === x[0]) + '">' + x[1] + '</button>').join('') + '</div>' +
      '<ol class="chrank">' + rows + '</ol>' +
      (c.last && c.last.podium && c.last.podium.length ? '<h3>' + T('Settimana scorsa', 'Last week') + '</h3><ol class="chpod">' + c.last.podium.map(p => '<li class="p' + p.place + (p.id === my ? ' me' : '') + '">' + CUP + '<b>' + p.place + '°</b><span>' + esc(p.name) + '</span><small>' + p.points + ' ◆ · +' + p.bonus + '</small></li>').join('') + '</ol>' : '') +
      '</div>';
  }

  /* ---------- missione congiunta (lite) ----------
     Le regole stanno sul server (backend/consortia.mjs, jointReduce): qui si disegna e si calcola la fisica con i dati
     del gioco (E: pezzi, massa, potenza, costi, revisione). Ogni azione porta la versione vista: se un compagno ha
     cambiato qualcosa nel frattempo, il server rifiuta (stale) e si ricarica. */
  const JROLES = ['plan', 'sat', 'sci', 'com'];
  const JROLE_N = { plan: ['Pianificazione', 'Planning'], sat: ['Satellite', 'Satellite'], sci: ['Scienza', 'Science'], com: ['Comunicazioni', 'Comms'] };
  const JNEED = { plan: ['dest', 'budget'], sat: ['ride', 'avi', 'adcs', 'bat', 'sol'], sci: ['ray'], com: ['com'] };
  const JOWN = { mass: 'sat', power: 'sat', cost: 'plan' };
  const JKEY_N = { dest: ['Destinazione', 'Destination'], budget: ['Budget', 'Budget'], ride: ['Piattaforma', 'Bus'], avi: ['Computer', 'Computer'], adcs: ['Assetto', 'Attitude control'], bat: ['Batteria', 'Battery'], sol: ['Pannelli solari', 'Solar panels'], ray: ['Payload', 'Payload'], com: ['Radio', 'Radio'] };
  const jRole = r => T(...(JROLE_N[r] || ['?', '?']));
  const jKey = k => T(...(JKEY_N[k] || [k, k]));
  const J = { list: null, id: null, m: null, t: 0, busy: false, name: '' };
  const hasE = () => typeof E !== 'undefined' && !!E && !!E.PARTS;
  const tr = s => { try { return EN() && window.GNG && GNG.tr ? GNG.tr(s) : s; } catch (e) { return s; } };
  const num = (x, d) => (Math.round(x * Math.pow(10, d)) / Math.pow(10, d)).toLocaleString(EN() ? 'en' : 'it');

  // Il satellite del progetto comune, costruito con le regole del gioco (pezzi messi in griglia da E.autoPlace).
  function jSat(ds) {
    const d = E.fresh(); d.ride = ds.ride || 'S3'; d.dest = ds.dest || 'leo'; d.sol = ds.sol || ''; d.tutB = ds.budget || 1000; d.stake = [];
    const cost = k => E.lvCost(Object.assign({}, d, { lv: k }));
    d.lv = Object.keys(E.LV).filter(k => { const L = E.LV[k]; return !L.pad && !L.surf && L.dest.indexOf(d.dest) >= 0 && L.fits.indexOf(d.ride) >= 0; }).sort((a, b) => cost(a) - cost(b))[0] || null;
    ['avi', 'adcs', 'bat', 'ray', 'com'].forEach(cat => { const id = ds[cat]; if (id && E.PARTS[id] && E.PARTS[id].cat === cat) { const pl = E.autoPlace(d, id, 0); if (pl) d.placed[cat] = pl; } });
    return d;
  }
  function jMetrics(ds) {
    if (!hasE()) return null;
    const d = jSat(ds), b = E.budget(d);
    return { d, b, mass: b.wet, lim: b.massLim, gen: b.gen, dem: b.demand, cost: b.cost, budget: ds.budget || 1000 };
  }
  const jPart = (k, p, sol) => ({ v: k, n: tr(p.n), s: (sol ? '+' + p.gen + ' W · ' : '') + num(p.m, 2) + ' kg · ' + (p.p ? num(p.p, 1) + ' W · ' : '') + p.c + ' cr' });
  function jOptions(key, ds) {
    if (!hasE()) return [];
    if (key === 'dest') return ['leo', 'moon', 'mars'].map(k => ({ v: k, n: tr(E.DEST[k].n), s: T('punti ', 'points ') + ({ leo: 60, moon: 120, mars: 200 })[k] }));
    if (key === 'budget') return [600, 1000, 1600, 2400, 3600, 5000].map(v => ({ v, n: v + ' cr' }));
    if (key === 'ride') return ['S3', 'S6', 'S12'].map(k => ({ v: k, n: E.RIDES[k].n, s: T('fino a ', 'up to ') + E.RIDES[k].massLim + ' kg · ' + E.RIDES[k].c + ' cr' }));
    if (key === 'sol') return Object.keys(E.SOLAR).filter(k => E.solOK({ ride: ds.ride || 'S3' }, k)).sort((a, b) => E.SOLAR[a].lvl - E.SOLAR[b].lvl).slice(0, 4).map(k => jPart(k, E.SOLAR[k], true));
    const U = E.RIDES[ds.ride || 'S3'].U;
    return Object.keys(E.PARTS).filter(k => { const p = E.PARTS[k]; return p.cat === key && (E.RANK[p.cls || '3U'] || 3) <= U && !(p.pays && p.pays.indexOf('land') >= 0); })
      .sort((a, b) => E.PARTS[a].lvl - E.PARTS[b].lvl || E.PARTS[a].c - E.PARTS[b].c).slice(0, key === 'ray' ? 6 : 5).map(k => jPart(k, E.PARTS[k]));
  }
  function jName(key, v) {
    if (v == null) return '—';
    if (!hasE()) return String(v);
    if (key === 'dest') return E.DEST[v] ? tr(E.DEST[v].n) : v;
    if (key === 'budget') return v + ' cr';
    if (key === 'ride') return E.RIDES[v] ? E.RIDES[v].n : v;
    const p = E.PARTS[v] || E.SOLAR[v]; return p ? tr(p.n) : v;
  }
  // Una scelta che sfora un budget di un altro ruolo diventa una richiesta a quel ruolo (massa e potenza: Satellite; costo: Pianificazione).
  function jNeedReq(s, key, value, me) {
    const a = jMetrics(s.design), b = jMetrics(Object.assign({}, s.design, { [key]: value })); if (!a || !b) return null;
    const list = [
      ['mass', b.mass > b.lim && b.mass > a.mass + 1e-9, b.mass - Math.max(b.lim, a.mass)],
      ['power', b.dem > b.gen && b.dem - b.gen > a.dem - a.gen + 1e-9, (b.dem - b.gen) - Math.max(0, a.dem - a.gen)],
      ['cost', b.cost > b.budget && b.cost > a.cost, b.cost - Math.max(b.budget, a.cost)]];
    for (const [kind, over, delta] of list) if (over && s.roles[JOWN[kind]] !== me) return { to: JOWN[kind], kind, delta: Math.round(delta * 100) / 100 };
    return null;
  }
  // Contro-proposte: le altre opzioni della stessa voce che restano nei limiti.
  function jCounter(s) {
    const q = s.request, fits = o => { const m = jMetrics(Object.assign({}, s.design, { [q.key]: o.v })); return m && (q.kind === 'mass' ? m.mass <= m.lim : q.kind === 'power' ? m.gen >= m.dem : m.cost <= m.budget); };
    return jOptions(q.key, s.design).filter(o => o.v !== q.value && fits(o)).slice(-3).reverse();
  }
  function jChecks(ds) {
    const m = jMetrics(ds); if (!m) return { list: [], ok: false };
    const c = E.checks(m.d), b = c.b, L = {
      parts: [T('Tutti i sottosistemi a bordo', 'All subsystems on board'), T('Manca qualche pezzo', 'Some parts are missing')],
      place: [T('Ogni pezzo trova posto', 'Every part fits'), T('Qualche pezzo non entra nella piattaforma', 'Some parts do not fit the bus')],
      mass: [T('Massa ', 'Mass ') + num(b.wet, 1) + ' / ' + b.massLim + ' kg', T('Massa ', 'Mass ') + num(b.wet, 1) + ' / ' + b.massLim + ' kg'],
      pow: [T('Potenza ', 'Power ') + num(b.gen, 1) + ' W ≥ ' + num(b.demand, 1) + ' W', T('Potenza: i pannelli non bastano', 'Power: the panels are not enough')],
      bat: [T('La batteria regge l’eclisse', 'The battery lasts the eclipse'), T('La batteria non regge l’eclisse', 'The battery does not last the eclipse')],
      cost: [T('Costo ', 'Cost ') + b.cost + ' / ' + b.budget + ' cr', T('Costo ', 'Cost ') + b.cost + ' / ' + b.budget + ' cr'],
      point: [T('Puntamento giusto per il payload', 'Pointing fits the payload'), T('Il payload chiede un assetto più preciso', 'The payload needs finer attitude control')] };
    const list = c.list.map(x => ({ t: (L[x.k] || [x.t, x.t])[x.ok ? 0 : 1], ok: x.ok }));
    list.unshift({ t: m.d.lv ? T('Lancio: ', 'Launch: ') + tr(E.LV[m.d.lv].n) : T('Nessun lancio per questa piattaforma e destinazione', 'No launch for this bus and destination'), ok: !!m.d.lv });
    return { list, ok: c.ok && !!m.d.lv };
  }
  async function jList() { const r = await api('GET', '/mine/joint'); if (r.status === 200) J.list = r.data.joint || []; }
  async function jLoad(id, force) {
    const r = await api('GET', '/mine/joint/' + id + (J.m && J.m.id === id && !force ? '?v=' + J.m.version : ''));
    if (r.status === 200) {
      if (r.data.same) return false;
      const was = J.m && J.m.id === id ? J.m.status : null;
      if (J.id === id) J.m = r.data;
      if (r.data.status === 'done' && was && was !== 'done') await loadMine(); // i punti appena assegnati
      return true;
    }
    if (r.status === 404) { J.id = null; J.m = null; return true; }
    return false;
  }
  function jPoll() {
    clearTimeout(J.t);
    if (!S.open || S.tab !== 'missions' || !member()) return;
    J.t = setTimeout(async () => {
      if (S.busy || J.busy) return jPoll();
      if (J.id) { if (await jLoad(J.id)) draw(); } else { await jList(); if (!(document.activeElement && document.activeElement.dataset && document.activeElement.dataset.f === 'jname')) draw(); }
      jPoll();
    }, 3000);
  }
  async function jAct(body) {
    if (!J.m || J.busy) return; J.busy = true; S.err = '';
    try {
      const send = () => api('POST', '/mine/joint/' + J.m.id + '/actions', Object.assign({ v: J.m.version }, body));
      let r = await send();
      // un compagno ha cambiato qualcosa nel frattempo: si ricarica e si riprova una volta (il server ricontrolla le regole)
      if (r.data && r.data.error === 'stale') { await jLoad(J.m.id, true); if (J.m) r = await send(); }
      if (r.status === 200) { J.m = r.data; try { host.sfx(r.data.status === 'done' ? 'ok' : 'tap'); } catch (e) {} if (r.data.status === 'done') await loadMine(); }
      else if (r.data && r.data.error === 'stale') { host.toast(errText(r)); await jLoad(J.m.id, true); }
      else fail(r);
    } finally { J.busy = false; draw(); }
  }

  function jointsView() {
    if (J.id) return J.m ? jointView(J.m) : '<p class="clwait">' + T('Caricamento…', 'Loading…') + '</p>';
    const list = J.list;
    return '<div class="cljoint"><form class="clrow" data-cl-form="jnew"><input data-f="jname" data-cl-in="jname" maxlength="24" value="' + esc(J.name) + '" placeholder="' + T('Nome della missione', 'Mission name') + '" aria-label="' + T('Nome della missione', 'Mission name') + '"><button class="clbtn pri">' + T('Nuova missione congiunta', 'New joint mission') + '</button></form>' +
      '<p class="clnote">' + T('Da 2 a 4 compagni progettano un satellite insieme, un ruolo NASA a testa: Pianificazione, Satellite, Scienza, Comunicazioni. A turni; le scelte che sforano massa, potenza o budget vanno approvate da chi ne è responsabile.', '2 to 4 teammates design one satellite together, one NASA role each: Planning, Satellite, Science, Comms. Turn by turn; choices that break mass, power or budget need the approval of whoever owns them.') + '</p>' +
      (list ? (list.length ? list.map(jCard).join('') : '<p class="clwait">' + T('Nessuna missione congiunta: aprine una!', 'No joint missions yet: start one!') + '</p>') : '<p class="clwait">' + T('Caricamento…', 'Loading…') + '</p>') + '</div>';
  }
  function jPhase(s) {
    return s.phase === 'lobby' ? T('In attesa dei compagni', 'Waiting for teammates') : s.phase === 'review' ? T('Revisione finale', 'Final review') : s.phase === 'done' ? T('Completata', 'Completed')
      : s.phase === 'abandoned' ? T('Abbandonata', 'Abandoned') : T('Tocca a ', 'Turn: ') + jRole(s.turn) + ' (' + (s.roles[s.turn] || '?') + ')';
  }
  function jCard(j) {
    const me = myName(), mine = JROLES.some(r => j.roles[r] === me), myTurn = j.turn && j.roles[j.turn] === me;
    return '<article class="clcard jcard' + (myTurn ? ' myturn' : '') + '"><div class="clci"><b>' + esc(j.name) + '</b><small>' + esc(jPhase(j)) + '</small><span class="clmeta">' +
      JROLES.map(r => esc(jRole(r) + ': ' + (j.roles[r] || '—'))).join(' · ') + '</span></div>' + (myTurn ? '<em class="jtag">' + T('Tocca a te', 'Your turn') + '</em>' : '') +
      '<button class="clbtn' + (mine || j.phase === 'lobby' ? ' pri' : '') + '" data-cl="jopen" data-id="' + esc(j.id) + '">' + T('Apri', 'Open') + '</button></article>';
  }
  function jGauge(label, val, max, unit, d, inv) {
    const over = inv ? val > max : val > max, pc = Math.max(0, Math.min(100, max > 0 ? val / max * 100 : 100));
    return '<div class="jg' + (over ? ' bad' : '') + '"><span>' + label + '</span><b>' + num(val, d) + ' / ' + num(max, d) + ' ' + unit + '</b><i><u style="width:' + pc.toFixed(0) + '%"></u></i></div>';
  }
  function jLog(e) {
    const u = e.user;
    switch (e.code) {
      case 'join': return T(u + ' prende ' + jRole(e.role), u + ' takes ' + jRole(e.role));
      case 'start': return T(u + ' fa partire la missione', u + ' starts the mission');
      case 'set': return u + ': ' + jKey(e.key) + ' → ' + jName(e.key, e.value);
      case 'request': return T(u + ' chiede a ' + jRole(e.to) + ': ', u + ' asks ' + jRole(e.to) + ': ') + jKey(e.key) + ' → ' + jName(e.key, e.value);
      case 'answer': return u + ': ' + ({ accept: T('accettato', 'accepted'), reject: T('rifiutato', 'rejected'), counter: T('contro-proposta', 'counter-offer') })[e.decision] + ' (' + jName(e.key, e.value) + ')';
      case 'done': return T(u + ' ha finito: ' + jRole(e.role), u + ' is done: ' + jRole(e.role));
      case 'go': return u + ': GO';
      case 'nogo': return T(u + ': NO-GO, da rifare ', u + ': NO-GO, to redo: ') + jRole(e.role);
      case 'done_all': return T('GO da tutti!', 'GO from everyone!');
      case 'abandon': return T(u + ' ha abbandonato la missione', u + ' abandoned the mission');
      case 'leave': return T(u + ' ha lasciato il ruolo', u + ' left their role');
      default: return '';
    }
  }
  function jointView(m) {
    const s = m.state, me = myName(), mine = r => s.roles[r] === me, players = [...new Set(JROLES.map(r => s.roles[r]).filter(Boolean))], met = jMetrics(s.design);
    let h = '<div class="jhead"><button class="clbtn sm" data-cl="jback">‹ ' + T('Missioni', 'Missions') + '</button><b>' + esc(s.name) + '</b><small>' + esc(jPhase(s)) + '</small></div>' +
      '<div class="jroles">' + JROLES.map(r => { const u = s.roles[r]; return '<span class="jrole' + (s.turn === r ? ' turn' : s.done[r] ? ' done' : '') + (u === me ? ' me' : '') + '"><small>' + jRole(r) + '</small><b>' + (u ? esc(u) : '—') + '</b>' + (s.turn === r ? '<i>●</i>' : s.done[r] ? '<i>✓</i>' : '') + '</span>'; }).join('') + '</div>';
    if (met && s.phase !== 'lobby') h += '<div class="jmeter">' + jGauge(T('Massa', 'Mass'), met.mass, met.lim, 'kg', 1) + jGauge(T('Consumo', 'Power use'), met.dem, met.gen, 'W', 1) + jGauge(T('Costo', 'Cost'), met.cost, met.budget, 'cr', 0) + '</div>';
    if (s.phase === 'lobby') {
      h += '<p class="clnote">' + T('Prendi un ruolo. Quando siete almeno in due, chi ha aperto la missione la fa partire: i ruoli liberi vengono divisi tra i presenti.', 'Take a role. When at least two of you are in, whoever opened the mission starts it: free roles are shared among the players.') + '</p><div class="clrow">' +
        (players.indexOf(me) < 0 ? JROLES.filter(r => !s.roles[r]).map(r => '<button class="clbtn pri" data-cl="jact" data-a="join" data-role="' + r + '">' + T('Prendi ', 'Take ') + jRole(r) + '</button>').join('') : '') +
        (players.indexOf(me) >= 0 && s.by !== me ? '<button class="clbtn" data-cl="jact" data-a="leave">' + T('Lascia il ruolo', 'Leave the role') + '</button>' : '') +
        (s.by === me || lead() ? '<button class="clbtn pri big" data-cl="jact" data-a="start"' + (players.length < 2 ? ' disabled' : '') + '>' + T('Fai partire la missione', 'Start the mission') + '</button>' : '') + '</div>';
    } else if (s.phase === 'design') {
      if (s.request) {
        const q = s.request, k = { mass: T('kg oltre il limite della piattaforma', 'kg over the bus limit'), power: T('W oltre quello che producono i pannelli', 'W more than the panels produce'), cost: T('cr oltre il budget', 'cr over budget') }[q.kind];
        h += '<div class="jreq" role="alert"><b>' + esc(q.by + ' (' + jRole(q.from) + ') ' + T('chiede: ', 'asks: ') + jKey(q.key) + ' → ' + jName(q.key, q.value)) + '</b><small>+' + num(q.delta, q.kind === 'cost' ? 0 : 2) + ' ' + k + '</small>';
        if (mine(q.to)) {
          const alt = jCounter(s);
          h += '<div class="clacts"><button class="clbtn sm pri" data-cl="jact" data-a="accept">' + (q.kind === 'cost' ? T('Accetta e alza il budget', 'Accept and raise the budget') : T('Accetta', 'Accept')) + '</button>' +
            alt.map(o => '<button class="clbtn sm" data-cl="jact" data-a="counter" data-v="' + esc(o.v) + '">' + T('Proponi: ', 'Offer: ') + esc(o.n) + '</button>').join('') +
            '<button class="clbtn sm bad" data-cl="jact" data-a="reject">' + T('Rifiuta', 'Reject') + '</button></div>';
        } else h += '<small>' + esc(T('In attesa di ', 'Waiting for ') + s.roles[q.to] + ' (' + jRole(q.to) + ')') + '</small>';
        h += '</div>';
      }
      if (s.turn && mine(s.turn) && !s.request) {
        const solBad = s.turn === 'sat' && hasE() && !E.solOK({ ride: s.design.ride }, s.design.sol), complete = JNEED[s.turn].every(k => s.design[k] != null) && !solBad;
        h += '<h3>' + T('Tocca a te', 'Your turn') + ' · ' + jRole(s.turn) + '</h3>' + JNEED[s.turn].map(key => '<div class="jgroup"><b>' + jKey(key) + '</b><div class="jopts">' +
          jOptions(key, s.design).map(o => '<button class="jopt' + (String(s.design[key]) === String(o.v) ? ' on' : '') + '" data-cl="jset" data-key="' + key + '" data-v="' + esc(o.v) + '"' + (J.busy ? ' disabled' : '') + '><b>' + esc(o.n) + '</b>' + (o.s ? '<small>' + esc(o.s) + '</small>' : '') + '</button>').join('') + '</div></div>').join('') +
          (solBad ? '<p class="clnote">' + T('I pannelli solari scelti non sono della taglia di questa piattaforma.', 'The chosen solar panels do not fit this bus.') + '</p>' : '') +
          '<button class="clbtn pri big" data-cl="jact" data-a="done"' + (complete ? '' : ' disabled') + '>' + T('Fatto: passa il turno', 'Done: pass the turn') + '</button>';
      } else if (s.turn && !s.request) h += '<p class="jwait">' + esc(T('Sta decidendo ', 'Deciding now: ') + s.roles[s.turn] + ' (' + jRole(s.turn) + ')…') + '</p>';
    } else if (s.phase === 'review') {
      const c = jChecks(s.design);
      h += '<h3>' + T('Revisione finale: GO / NO-GO', 'Final review: GO / NO-GO') + '</h3><ul class="jchecks">' + c.list.map(x => '<li class="' + (x.ok ? 'ok' : 'ko') + '">' + (x.ok ? '✓ ' : '✗ ') + esc(x.t) + '</li>').join('') + '</ul>' +
        '<p class="clmeta">' + players.map(p => esc(p) + ': ' + (s.votes[p] === 'go' ? 'GO' : '…')).join(' · ') + '</p>';
      if (players.indexOf(me) >= 0 && s.votes[me] !== 'go') h += '<div class="clacts jvote"><button class="clbtn pri big" data-cl="jact" data-a="go"' + (c.ok ? '' : ' disabled') + '>GO</button>' +
        JROLES.map(r => '<button class="clbtn sm bad" data-cl="jact" data-a="nogo" data-role="' + r + '">' + T('NO-GO: rifà ', 'NO-GO: redo ') + jRole(r) + '</button>').join('') + '</div>';
    } else if (s.phase === 'done') {
      h += '<div class="jdone"><b>GO! ' + esc(s.name) + '</b><span>+' + (s.points | 0) + ' ◆ ' + T('a testa, e al consorzio', 'each, and to the consortium') + '</span></div>';
    }
    if (s.phase !== 'lobby') h += '<details class="jsum"' + (s.phase === 'done' ? ' open' : '') + '><summary>' + T('Il progetto', 'The design') + '</summary><ul>' + Object.keys(JKEY_N).map(k => '<li><span>' + jKey(k) + '</span><b>' + esc(jName(k, s.design[k])) + '</b></li>').join('') + '</ul></details>';
    h += '<ol class="jlog">' + s.log.slice(-4).reverse().map(e => '<li>' + esc(jLog(e)) + ' <time>' + timeOf(e.at) + '</time></li>').join('') + '</ol>';
    if ((s.by === me || lead()) && s.phase !== 'done' && s.phase !== 'abandoned') h += '<button class="clbtn sm bad' + (S.confirm === 'jabandon' ? ' sure' : '') + '" data-cl="jact" data-a="abandon">' + (S.confirm === 'jabandon' ? T('Confermi?', 'Confirm?') : T('Abbandona la missione', 'Abandon the mission')) + '</button>';
    return '<div class="cljointv">' + h + '</div>';
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

  // Chi gioca: un battito ogni 5 s (piccolo); se qualcuno guarda, con la partita. Gli sticker di chi guarda tornano nella risposta.
  const LIVE = { t: 0, watched: false, since: 0, warned: false };
  async function liveBeat() {
    clearTimeout(LIVE.t);
    let next = 5000;
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
      } else next = 5000; // nessuna richiesta in questo caso: si ricontrolla presto (per esempio appena entri in un consorzio)
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
      '<div class="clstks" role="group" aria-label="Sticker">' + Object.keys(STICKERS).map(k => '<button type="button" data-sp="stk" data-k="' + k + '" aria-label="' + esc(T(...STICKERS[k].n)) + '"' + (Date.now() < S.coolUntil || locked(k) ? ' disabled' : '') + '>' + stickerHTML(k, 34) + lockTag(k) + '</button>').join('') + '</div>' +
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
      // finche' non arriva la prima immagine si chiede piu' spesso: chi gioca la manda appena sa di essere guardato
      spectBar(); W.t = setTimeout(watchTick, W.got ? 5000 : 1500); return;
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
    if (!W.user || !Object.prototype.hasOwnProperty.call(STICKERS, code) || locked(code) || Date.now() < S.coolUntil) return;
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
        { id: 'demo-milano', name: 'Orbita Milano', crest: { shape: 'shield', color: '#f07b3f', symbol: 'rocket' }, motto: L('Dal Politecnico alle stelle', 'From Politecnico to the stars'), kind: 'open', level: 2, science: 1040, minScience: 0, maxMembers: 20, schoolMode: false, inviteCode: 'MILANO26',
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
      // sfida della settimana: punti di questa settimana e trofei gia' vinti
      Object.assign(db.consortia[0], { weekly: 140, trophies: [{ place: 2 }] }); Object.assign(db.consortia[1], { weekly: 210, trophies: [{ place: 1 }, { place: 1 }] });
    }
    const R = (status, data) => Promise.resolve({ status, data });
    const summary = c => ({ id: c.id, name: c.name, crest: c.crest, motto: c.motto, kind: c.kind, level: c.level, science: c.science, minScience: c.minScience, maxMembers: c.maxMembers, members: c.members.length, trophies: (c.trophies || []).length });
    const mineC = () => db.consortia.find(c => c.members.some(m => m.username === myName()));
    const sys = (c, data) => c.msgs.push({ id: ++seq, kind: 'system', author: null, at: new Date().toISOString(), data });
    const lines = () => EN() ? ['Nice one! 🚀', 'Welcome aboard!', 'Who is launching next?', 'GO for launch!'] : ['Grande! 🚀', 'Benvenuto a bordo!', 'Chi lancia per primo?', 'GO per il lancio!'];
    function bot(c) {
      const others = c.members.filter(m => m.username !== myName() && m.status !== 'offline'); if (!others.length) return;
      setTimeout(() => { const who = others[seq % others.length], st = seq % 3 === 0; c.msgs.push({ id: ++seq, author: who.username, role: who.role, at: new Date().toISOString(), kind: st ? 'sticker' : 'text', ...(st ? { sticker: Object.keys(STICKERS)[seq % 4] } : { text: lines()[seq % 4] }) }); }, 2500);
    }
    function demoLevel(c) { const l = LEVELS.reduce((a, min, i) => (c.science >= min ? i + 1 : a), 1); if (l > c.level) { c.level = l; sys(c, { code: 'level_up', level: l }); } }
    // filtro del linguaggio per la demo: stessa idea del server (backend/consortia.mjs, rude), in breve
    const demoRude = t => /(^|[^a-z])(c+a+z+z+|s+t+r+o+n+z+|m+e+r+d+[ae]|f+u+c+k+|s+h+i+t+|b+i+t+c+h+|v+a+f+a+n+c+u+l+)/.test(String(t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[0134@]/g, ch => ({ 0: 'o', 1: 'i', 3: 'e', 4: 'a', '@': 'a' })[ch]));
    // La sfida della settimana nella demo: stesso calendario del server (lunedi' UTC), obiettivi d'esempio.
    const DEMO_GOALS = [
      { id: 'moon-budget', dest: 'moon', maxCost: 1800, it: 'Una missione riuscita sulla Luna che costa meno di 1800 crediti', en: 'A successful Moon mission costing under 1,800 credits' },
      { id: 'observe', type: 'obs', it: 'Una missione di osservazione e mappatura riuscita', en: 'A successful observation and mapping mission' },
      { id: 'leo-cheap', dest: 'leo', maxCost: 400, it: 'Una missione riuscita in orbita terrestre con meno di 400 crediti', en: 'A successful Earth-orbit mission under 400 credits' }];
    function demoGoal() {
      const d = new Date(), m = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())); m.setUTCDate(m.getUTCDate() - (m.getUTCDay() + 6) % 7);
      const week = m.toISOString().slice(0, 10), prev = new Date(m.getTime() - 7 * 864e5).toISOString().slice(0, 10);
      return { week, prev, endsAt: new Date(m.getTime() + 7 * 864e5).toISOString(), goal: DEMO_GOALS[Math.floor(m.getTime() / (7 * 864e5)) % DEMO_GOALS.length] };
    }
    // Le regole della missione congiunta, come jointReduce in backend/consortia.mjs (qui per la demo senza rete).
    function demoJoint(state, a, user, admin) {
      const s = JSON.parse(JSON.stringify(state)), mine = r => s.roles[r] === user, players = [...new Set(JROLES.map(r => s.roles[r]).filter(Boolean))];
      const KEYS = { dest: 'plan', budget: 'plan', ride: 'sat', avi: 'sat', adcs: 'sat', bat: 'sat', sol: 'sat', ray: 'sci', com: 'com' };
      const log = (code, extra) => { s.log.push(Object.assign({ code, user, at: new Date().toISOString() }, extra)); s.log = s.log.slice(-30); };
      const no = error => ({ error });
      if (s.phase === 'done' || s.phase === 'abandoned') return no('closed');
      if (a.type === 'join') { if (s.phase !== 'lobby') return no('started'); if (s.roles[a.role]) return no('role_taken'); if (players.indexOf(user) >= 0) return no('has_role'); s.roles[a.role] = user; log('join', { role: a.role }); }
      else if (a.type === 'leave') { if (s.phase !== 'lobby' || user === s.by) return no('started'); JROLES.forEach(r => { if (s.roles[r] === user) s.roles[r] = null; }); log('leave'); }
      else if (a.type === 'start') { if (s.phase !== 'lobby') return no('started'); if (user !== s.by && !admin) return no('forbidden'); if (players.length < 2) return no('need_two'); let i = 0; JROLES.forEach(r => { if (!s.roles[r]) s.roles[r] = players[i++ % players.length]; }); s.phase = 'design'; s.turn = 'plan'; log('start'); }
      else if (a.type === 'set') {
        const owner = KEYS[a.key]; if (s.phase !== 'design') return no('not_design'); if (!owner) return no('invalid'); if (!mine(owner)) return no('not_your_role'); if (s.turn !== owner) return no('not_your_turn'); if (s.request) return no('pending_request');
        if (a.req && !mine(a.req.to)) { s.request = { id: ++s.seq, from: owner, by: user, to: a.req.to, key: a.key, value: a.value, kind: a.req.kind, delta: a.req.delta }; log('request', { key: a.key, value: a.value, to: a.req.to }); }
        else { s.design[a.key] = a.value; log('set', { key: a.key, value: a.value }); }
      } else if (a.type === 'answer') {
        const q = s.request; if (!q) return no('no_request'); if (!mine(q.to)) return no('not_your_role');
        if (a.decision === 'accept') { s.design[q.key] = q.value; if (q.kind === 'cost') s.design.budget = Math.min(20000, s.design.budget + Math.ceil(q.delta / 50) * 50); }
        else if (a.decision === 'counter') s.design[q.key] = a.value;
        log('answer', { decision: a.decision, key: q.key, value: a.decision === 'counter' ? a.value : q.value, to: q.by }); s.request = null;
      } else if (a.type === 'done') {
        if (s.phase !== 'design') return no('not_design'); if (!mine(s.turn)) return no('not_your_turn'); if (s.request) return no('pending_request'); if (JNEED[s.turn].some(k => s.design[k] == null)) return no('incomplete');
        s.done[s.turn] = true; log('done', { role: s.turn }); const next = JROLES.find(r => !s.done[r]); if (next) s.turn = next; else { s.phase = 'review'; s.turn = null; s.votes = {}; }
      } else if (a.type === 'vote') {
        if (s.phase !== 'review') return no('not_review'); if (players.indexOf(user) < 0) return no('forbidden');
        if (a.go) { if (a.ok !== true) return no('checks_failed'); s.votes[user] = 'go'; log('go'); if (players.every(p => s.votes[p] === 'go')) { s.phase = 'done'; s.points = Math.round(({ leo: 60, moon: 120, mars: 200 }[s.design.dest] || 60) * (1 + 0.1 * (players.length - 1))); log('done_all'); } }
        else { s.phase = 'design'; s.turn = a.rework; s.done[a.rework] = false; s.votes = {}; log('nogo', { role: a.rework }); }
      } else if (a.type === 'abandon') { if (user !== s.by && !admin) return no('forbidden'); s.phase = 'abandoned'; log('abandon'); }
      else return no('invalid');
      return { s };
    }
    function jointCommit(j, s, c) {
      const was = j.state.phase; j.state = s; j.version++; j.status = s.phase === 'lobby' ? 'open' : s.phase === 'done' ? 'done' : s.phase === 'abandoned' ? 'abandoned' : 'active';
      if (s.phase === 'done' && was !== 'done') {
        const players = [...new Set(JROLES.map(r => s.roles[r]).filter(Boolean))];
        players.forEach(u => { const m = c.members.find(x => x.username === u); if (m) m.science += s.points; if (u === myName()) db.me = (db.me || 0) + s.points; });
        c.science += s.points * players.length; demoLevel(c); sys(c, { code: 'joint_done', mission: s.name, users: players, points: s.points });
      }
      jointBots(j, c);
    }
    // I compagni finti: prendono i ruoli liberi, fanno le loro scelte con i dati del gioco, accettano le richieste e votano GO.
    function jointBots(j, c) {
      if (!hasE()) return;
      clearTimeout(j.bt);
      j.bt = setTimeout(() => {
        const s = j.state, bots = c.members.filter(m => m.username !== myName() && m.status !== 'offline').map(m => m.username);
        const act = (who, a) => { const out = demoJoint(j.state, a, who, false); if (!out.error) jointCommit(j, out.s, c); return !out.error; };
        if (s.phase === 'lobby') { const free = JROLES.filter(r => !s.roles[r]), bot = bots.find(b => JROLES.every(r => s.roles[r] !== b)); if (free.length && bot) act(bot, { type: 'join', role: free[0] }); return; }
        if (s.phase === 'design') {
          if (s.request && bots.indexOf(s.roles[s.request.to]) >= 0) { act(s.roles[s.request.to], { type: 'answer', decision: 'accept' }); return; }
          const who = s.roles[s.turn]; if (s.request || bots.indexOf(who) < 0) return;
          const pick = { ride: { leo: 'S3', moon: 'S6', mars: 'S12' }[s.design.dest] || 'S3', avi: 'BASE-OBC', adcs: 'BASE-MAG', bat: 'BASE-BAT40', ray: 'BASE-CAM', com: 'BASE-UHF', dest: 'moon', budget: 1600 };
          if (s.turn === 'sat') { const sols = jOptions('sol', s.design).map(o => o.v); pick.sol = sols.find(k => /D$/.test(k)) || sols[0]; }
          // se hai rifiutato una sua richiesta, la volta dopo sceglie l'opzione piu' economica
          const last = s.log[s.log.length - 1]; j.rej = j.rej || {};
          if (last && last.code === 'answer' && last.decision === 'reject' && last.to === who) j.rej[last.key] = 1;
          Object.keys(j.rej).forEach(k => { const o = jOptions(k, s.design); if (o.length) pick[k] = o.slice().sort((x, y) => (jMetrics(Object.assign({}, s.design, { [k]: x.v })) || {}).cost - (jMetrics(Object.assign({}, s.design, { [k]: y.v })) || {}).cost)[0].v; });
          const key = JNEED[s.turn].find(k => s.design[k] !== pick[k]);
          if (key && !(j.tried && j.tried[key + pick[key]] > 2)) {
            j.tried = j.tried || {}; j.tried[key + pick[key]] = (j.tried[key + pick[key]] || 0) + 1;
            const req = jNeedReq(s, key, pick[key], who); act(who, Object.assign({ type: 'set', key, value: pick[key] }, req ? { req } : {})); return;
          }
          act(who, { type: 'done' }); return;
        }
        if (s.phase === 'review' && jChecks(s.design).ok) { const bot = bots.find(b => JROLES.some(r => s.roles[r] === b) && s.votes[b] !== 'go'); if (bot) act(bot, { type: 'vote', go: true, ok: true }); }
      }, 1600);
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
      const rp = p.match(/^\/mine\/messages\/(\d+)\/report$/);
      if (method === 'POST' && rp) { const m = c.msgs.find(x => x.id === +rp[1]); if (!m || m.kind === 'system') return R(404, { error: 'message_not_found' }); if (m.author === myName()) return R(400, { error: 'self' }); m.reports = (m.reports || 0) + (m.reportedByMe ? 0 : 1); m.reportedByMe = true; return R(200, { reported: true, reports: m.reports, hidden: false }); }
      if (method === 'GET' && p === '/mine/reports') return rank(me.role) < 2 ? R(403, { error: 'forbidden' }) : R(200, { reports: c.msgs.filter(m => m.reports && !m.reviewed).map(m => ({ id: m.id, author: m.author, kind: m.kind, text: m.text, sticker: m.sticker, reports: m.reports, reasons: ['rude'], hidden: !!m.deleted })) });
      const rv = p.match(/^\/mine\/reports\/(\d+)$/);
      if (method === 'POST' && rv) { const m = c.msgs.find(x => x.id === +rv[1]); if (!m) return R(404, { error: 'message_not_found' }); m.reviewed = true; if (body.action === 'delete') { m.deleted = true; delete m.text; } return R(200, { reviewed: true, action: body.action }); }
      if (method === 'GET' && p === '/mine/unread') return R(200, { member: true, unread: c.msgs.filter(m => m.id > (me.read || 0) && m.author !== myName()).length });
      if (method === 'GET' && p === '/mine/messages') {
        const after = q.get('after'), list = after != null ? c.msgs.filter(m => m.id > +after).slice(0, 50) : c.msgs.slice(-50);
        const lastId = list.length ? list[list.length - 1].id : +(after || 0); me.read = Math.max(me.read || 0, lastId);
        return R(200, { messages: list.map(m => Object.assign({}, m)), lastId, more: false });
      }
      if (method === 'POST' && p === '/mine/messages') {
        const m = { id: ++seq, author: myName(), role: me.role, at: new Date().toISOString(), kind: body.kind };
        if (body.kind === 'text') { const t = String(body.text || '').trim(); if (!t || t.length > 300) return R(400, { error: 'invalid', field: 'text' }); if (/https?:\/\/|www\./i.test(t)) return R(400, { error: 'link' }); if (demoRude(t)) return R(400, { error: 'language' }); if (c.schoolMode) return R(403, { error: 'school_mode' }); m.text = t; }
        else if (body.kind === 'phrase') { if (!PHRASES_T[body.phrase]) return R(400, { error: 'invalid', field: 'phrase' }); m.kind = 'text'; m.text = PHRASES_T[body.phrase][0]; m.phrase = body.phrase; }
        else if (body.kind === 'sticker') { if (!Object.prototype.hasOwnProperty.call(STICKERS, body.sticker)) return R(400, { error: 'invalid', field: 'sticker' }); if ((STICKERS[body.sticker].lvl || 1) > c.level) return R(403, { error: 'sticker_locked', level: STICKERS[body.sticker].lvl }); m.sticker = body.sticker; }
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
        let challenge = null;
        if (counted) {
          db.me = (db.me || 0) + (body.points | 0);
          if (c && body.points > 0) {
            me.science += body.points | 0; c.science += body.points | 0; sys(c, { code: 'science', user: myName(), mission: body.name || '', points: body.points | 0 }); demoLevel(c);
            const g = demoGoal().goal, f = body.facts;
            if (f && f.ok && (!g.dest || f.dest === g.dest) && (!g.type || f.type === g.type) && (g.maxCost == null || f.cost <= g.maxCost) && (g.minMonths == null || f.months >= g.minMonths)) {
              c.weekly = (c.weekly || 0) + (body.points | 0); challenge = { matched: true, points: body.points | 0, goal: g.id };
              sys(c, { code: 'challenge_points', user: myName(), mission: body.name || '', points: body.points | 0 });
            }
          }
        }
        return R(200, Object.assign({ counted, player: { science: db.me }, consortium: c ? { science: c.science } : null }, challenge ? { challenge } : {}));
      }
      if (method === 'GET' && p === '/challenge') {
        const w = demoGoal(), row = x => ({ id: x.id, name: x.name, crest: x.crest, level: x.level });
        const ranking = db.consortia.filter(x => x.weekly > 0).sort((a, b) => b.weekly - a.weekly).map(x => Object.assign(row(x), { points: x.weekly }));
        const allTime = db.consortia.slice().sort((a, b) => b.science - a.science).map(x => Object.assign(row(x), { points: x.science, trophies: (x.trophies || []).length }));
        const mine = c ? { id: c.id, week: { points: c.weekly || 0, rank: c.weekly ? ranking.findIndex(x => x.id === c.id) + 1 : null }, allTime: { points: c.science, rank: allTime.findIndex(x => x.id === c.id) + 1 }, trophies: c.trophies || [] } : null;
        return R(200, { week: w.week, endsAt: w.endsAt, goal: w.goal, prizes: [300, 200, 100], ranking, allTime, mine,
          last: { week: w.prev, podium: [{ place: 1, id: 'demo-kuiper', name: 'Kuiper Crew', points: 420, bonus: 300 }, { place: 2, id: 'demo-milano', name: 'Orbita Milano', points: 310, bonus: 200 }] } });
      }
      // missione congiunta: stesse regole del server (versione compatta) e compagni finti che giocano i loro ruoli
      if (p.startsWith('/mine/joint')) {
        db.joint = db.joint || [];
        const full = j => ({ id: j.id, status: j.status, version: j.version, state: j.state });
        if (method === 'GET' && p === '/mine/joint') return R(200, { joint: db.joint.filter(j => j.cid === c.id).map(j => ({ id: j.id, name: j.state.name, status: j.status, phase: j.state.phase, turn: j.state.turn, roles: j.state.roles, by: j.state.by, version: j.version })) });
        if (method === 'POST' && p === '/mine/joint') {
          const name = String(body.name || '').trim(); if (name.length < 3 || name.length > 24) return R(400, { error: 'invalid', field: 'name' });
          const j = { id: 'demo-j' + (++seq), cid: c.id, version: 1, status: 'open', state: { name, by: myName(), phase: 'lobby', turn: null, roles: { plan: myName(), sat: null, sci: null, com: null }, design: { dest: 'leo', budget: 1000, ride: 'S3', sol: 'BASE-SOL3D' }, done: {}, request: null, votes: {}, log: [], seq: 0, points: 0 } };
          db.joint.unshift(j); sys(c, { code: 'joint_new', user: myName(), mission: name, id: j.id }); jointBots(j, c);
          return R(201, full(j));
        }
        const jm = p.match(/^\/mine\/joint\/([^/]+)(\/actions)?$/), j = jm && db.joint.find(x => x.id === jm[1] && x.cid === c.id);
        if (!j) return R(404, { error: 'not_found' });
        if (method === 'GET') return q.get('v') === String(j.version) ? R(200, { same: true, version: j.version }) : R(200, full(j));
        if (body.v !== j.version) return R(409, { error: 'stale', version: j.version });
        const out = demoJoint(j.state, body, myName(), rank(me.role) >= 2);
        if (out.error) return R(out.error === 'invalid' ? 400 : 409, { error: out.error });
        jointCommit(j, out.s, c); return R(200, full(j));
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
#clan .clrep{background:none;border:0;color:#7A736C;cursor:pointer;padding:0 4px;display:inline-flex;align-items:center;gap:3px;font:600 11px/1 inherit;vertical-align:middle}
#clan .clrep:hover,#clan .clrep:focus-visible{color:#FFB4AB}#clan .clrep.sure{color:#fff;background:#D2443A;border-radius:6px;padding:3px 6px}
#clan .clrep.done{cursor:default;color:#F2B83A}
#clan .clm.muted{opacity:.75}#clan .clm.muted .clgone{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
#clan .clphr{display:flex;flex-wrap:wrap;gap:4px;padding-top:6px;flex:1;min-width:0;max-height:84px;overflow:auto}
#clan .clphr .clchip{padding:6px 10px;font-size:12px;min-height:30px}
#clan .clrepv{border:1px solid rgba(210,68,58,.5)}
#clan .clstks button,#spect .clstks button{position:relative}
.cllock{position:absolute;right:-3px;bottom:-3px;display:inline-flex;align-items:center;gap:1px;background:#15171D;color:#F2B83A;border-radius:999px;padding:1px 4px;font:700 10px/1.3 Inter,system-ui,sans-serif;font-style:normal;box-shadow:0 0 0 1px #2E3442}
#clan .cllvl{background:#1C1F27;border-radius:10px;padding:8px 10px;display:flex;flex-direction:column;gap:6px}
#clan .cllvlh{display:flex;align-items:baseline;gap:8px}#clan .cllvlh b{font-size:16px;color:#F2B83A}
#clan .cllvlbar{height:6px;border-radius:3px;background:#2A2F3B;display:block;overflow:hidden}#clan .cllvlbar u{display:block;height:100%;background:#F2B83A}
#clan .cllvl ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:3px}
#clan .cllvl li{display:grid;grid-template-columns:42px 1fr auto;gap:6px;align-items:center;font-size:12px;color:#7A736C}
#clan .cllvl li.on{color:#D9D2CA}#clan .cllvl li em{font-style:normal;color:#7A736C}#clan .cllvl li.on em{color:#5FD38D}
#clan .cltro{display:inline-flex;align-items:center;gap:2px;color:#F2B83A;font-size:12px;font-weight:700;vertical-align:1px}
#clan .clcup{vertical-align:-2px}
#clan .clch{display:flex;flex-direction:column;gap:10px}
#clan .chgoal{background:linear-gradient(135deg,rgba(240,123,63,.22),rgba(127,216,204,.10));border:2px solid #F07B3F;border-radius:12px;padding:10px 12px;display:flex;flex-direction:column;gap:6px}
#clan .chgoal>b{font-size:17px;line-height:1.25}
#clan .chcrit{display:flex;flex-wrap:wrap;gap:4px}#clan .chcrit i{font-style:normal;font-size:12px;font-weight:700;background:#15171D;color:#7FD8CC;border-radius:999px;padding:3px 9px}
#clan .chmine{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
#clan .chmine>div{background:#1C1F27;border-radius:10px;padding:6px 10px;display:flex;flex-direction:column}#clan .chmine b{font-size:15px;color:#F2B83A}
#clan .chboard{align-self:flex-start}
#clan .chrank{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:4px}
#clan .chrank li{display:grid;grid-template-columns:26px 26px 1fr auto auto;gap:8px;align-items:center;background:#1C1F27;border-radius:10px;padding:5px 10px}
#clan .chrank li.me{box-shadow:inset 0 0 0 2px #7FD8CC}#clan .chrank li.empty{display:block;color:#ADA49C;text-align:center}
#clan .chrank .num{color:#ADA49C;text-align:right}#clan .chrank span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#clan .chpod{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}
#clan .chpod li{background:#1C1F27;border-radius:10px;padding:6px 10px;display:flex;flex-direction:column;align-items:center;text-align:center;color:#F2B83A}
#clan .chpod li.p2{color:#C9CED6}#clan .chpod li.p3{color:#C2875A}#clan .chpod li.me{box-shadow:inset 0 0 0 2px #7FD8CC}
#clan .chpod span{color:#F1ECE6;font-weight:700;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
@media (max-width:640px){#clan .chmine,#clan .chpod{grid-template-columns:1fr}}
#clan .cljoint>form input{flex:1}
#clan .jcard.myturn{box-shadow:inset 3px 0 0 #F2B83A}
#clan .jtag{font-style:normal;font-size:12px;font-weight:700;color:#1A1210;background:#F2B83A;border-radius:999px;padding:3px 8px;white-space:nowrap}
#clan .cljointv{display:flex;flex-direction:column;gap:8px}
#clan .jhead{display:flex;align-items:center;gap:10px;flex-wrap:wrap}#clan .jhead b{font-size:17px}
#clan .jroles{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}
#clan .jrole{position:relative;background:#1C1F27;border-radius:10px;padding:6px 8px;display:flex;flex-direction:column;min-width:0;border:2px solid transparent}
#clan .jrole b{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#clan .jrole i{position:absolute;top:4px;right:8px;font-style:normal;font-size:12px}
#clan .jrole.turn{border-color:#F2B83A}#clan .jrole.turn i{color:#F2B83A}
#clan .jrole.done i{color:#5FD38D}#clan .jrole.me b{color:#7FD8CC}
#clan .jmeter{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
#clan .jg{background:#1C1F27;border-radius:10px;padding:6px 10px;display:flex;flex-direction:column;gap:3px;min-width:0}
#clan .jg span{font-size:12px;color:#ADA49C}#clan .jg b{font-size:14px;white-space:nowrap}
#clan .jg i{height:5px;border-radius:3px;background:#2A2F3B;display:block;overflow:hidden}#clan .jg u{display:block;height:100%;background:#5FD38D}
#clan .jg.bad b{color:#FF8A7E}#clan .jg.bad u{background:#E5322B}
#clan .jgroup>b{display:block;font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:#7FD8CC;margin:2px 0 4px}
#clan .jopts{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:6px}
#clan .jopt{background:#1C1F27;color:#F1ECE6;border:2px solid transparent;border-radius:10px;padding:6px 8px;text-align:left;cursor:pointer;display:flex;flex-direction:column;gap:2px;min-height:44px;font:inherit}
#clan .jopt b{font-size:13px;line-height:1.2}#clan .jopt small{font-size:11px}
#clan .jopt.on{border-color:#F07B3F;background:#2A1F1A}#clan .jopt:disabled{opacity:.5}
#clan .jreq{background:rgba(242,184,58,.12);border:2px solid #F2B83A;border-radius:10px;padding:8px 10px;display:flex;flex-direction:column;gap:6px}
#clan .jreq .clacts{justify-content:flex-start}
#clan .jwait{color:#ADA49C;text-align:center;margin:10px 0}
#clan .jchecks{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:4px}
#clan .jchecks li{background:#1C1F27;border-radius:8px;padding:6px 10px;font-size:13px}#clan .jchecks li.ok{color:#5FD38D}#clan .jchecks li.ko{color:#FF8A7E}
#clan .jvote{justify-content:flex-start}
#clan .jdone{background:rgba(95,211,141,.14);border:2px solid #5FD38D;border-radius:12px;padding:12px;display:flex;flex-direction:column;gap:4px;align-items:center;text-align:center}
#clan .jdone b{font-size:20px;color:#5FD38D}
#clan .jsum summary{cursor:pointer;color:#7FD8CC;font-size:13px}
#clan .jsum ul{list-style:none;margin:6px 0 0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:2px 12px}
#clan .jsum li{display:flex;justify-content:space-between;gap:8px;font-size:13px;border-bottom:1px solid #262B36;padding:3px 0}#clan .jsum li span{color:#ADA49C}
#clan .jlog{list-style:none;margin:0;padding:0;font-size:12px;color:#ADA49C}#clan .jlog time{color:#7A736C}
@media (max-width:640px){#clan .jroles{grid-template-columns:repeat(2,minmax(0,1fr))}#clan .jmeter{grid-template-columns:1fr}}
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
#clan .clmem>div:not(.clacts){flex:1;min-width:0;display:flex;flex-direction:column}#clan .clmem{flex-wrap:wrap}
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
@media (max-height:420px){#clan .clbar{flex-direction:row;align-items:center;gap:6px}#clan .clbar .clsend{flex:1;min-width:0;padding-top:6px}#clan .clstks{gap:3px}#clan .clstks button{min-width:34px;min-height:38px;padding:1px}#clan .clbar .clz{--zs:30px !important}#clan .clbar .clsend input{min-width:120px}#clan .clw{height:100%;border-radius:8px}#clan .clh{padding:4px 8px}#clan .clb{padding:6px 10px}#clan .clt b{font-size:14px}#clan .clempty .clcrest{width:48px;height:48px}#clan h2{font-size:17px;margin:2px 0}#clan .cleditor .clprev .clcrest{width:56px;height:56px}#clan .clpick button{width:30px;height:30px}}
@media (max-width:640px){#clan .clside{display:none}#clan .clt small{display:none}#clan .cltabs button{padding:7px 10px}}
@media (prefers-reduced-motion:no-preference){#clan.opening .clw{animation:clin .16s ease-out}@keyframes clin{from{transform:translateY(8px);opacity:0}}}
`;
    document.head.appendChild(s);
  }

  return { init, open, close, isOpen: () => S.open, unread: () => S.unread, badgeHTML, crestSVG, science, activity, setDemo,
    stickerHTML, stickers: () => Object.keys(STICKERS), perks: () => perks(), levels: LEVELS, watching: () => W.user, stopWatch: () => stopWatch(),
    _test: { sysText, errText, demo, state: S, loadMine, pack, unpack, jNeedReq, jChecks, jOptions, jCounter } };
})();
