// Entry flow: splash -> account -> game. Session tokens remain in HttpOnly cookies.
const root = document.querySelector('#account-entry');
const splash = root.querySelector('#entry-splash');
const panel = root.querySelector('#entry-panel');
const artwork = root.querySelector('#entry-art');
artwork.innerHTML = window.gngEntryArtwork?.() || '';
const form = root.querySelector('#account-form');
const message = root.querySelector('#account-message');
const submit = root.querySelector('#account-submit');
const toggle = root.querySelector('#account-toggle');
const password = form.elements.password;
let register = true, busy = false, advanced = false, sessionUser = null;
let sessionError = '';
const en = (() => { try { return localStorage.getItem('gngLang') === 'en'; } catch { return false; } })();
const t = (it, eng) => en ? eng : it;
root.querySelectorAll('[data-it]').forEach(el => { el.textContent = t(el.dataset.it, el.dataset.en); });
function mode() {
  root.querySelector('#account-heading').textContent = register ? t('La tua missione inizia qui.', 'Your mission starts here.') : t('Bentornato, comandante.', 'Welcome back, commander.');
  root.querySelector('#account-description').textContent = register ? t('Crea il tuo account. Il prossimo lancio porta il tuo nome.', 'Create your account. The next launch has your name on it.') : t('La tua agenzia ti aspetta. Pronto al prossimo lancio?', 'Your agency awaits. Ready for the next launch?');
  submit.textContent = register ? t('Crea account e gioca', 'Create account & play') : t('Accedi e gioca', 'Sign in & play');
  toggle.textContent = register ? t('Hai già un account? Accedi', 'Already have an account? Sign in') : t('Prima missione? Crea un account', 'First mission? Create an account');
  password.minLength = 1;
  password.autocomplete = register ? 'new-password' : 'current-password';
  root.querySelector('#password-hint').textContent = register ? t('Fino a 128 caratteri. Una frase lunga va benissimo.', 'Up to 128 characters. A long phrase works great.') : t('Inserisci la password del tuo account.', 'Enter your account password.');
  form.elements.username.autocomplete = 'username';
  message.textContent = sessionError;
}
async function request(path, data) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`/api/auth/${path}`, { signal: controller.signal, ...(data === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || t('Servizio account non disponibile. Riprova tra poco.', 'Account service unavailable. Please try again shortly.'));
    return result;
  } catch (error) {
    if (error.name === 'AbortError' || error instanceof TypeError) throw new Error(t('Connessione non disponibile. Controlla la rete e riprova.', 'Connection unavailable. Check your network and try again.'));
    throw error;
  } finally { clearTimeout(timeout); }
}
const accountButton = document.createElement('button');
accountButton.id = 'account-open'; accountButton.type = 'button'; accountButton.hidden = true;
const dialog = document.createElement('dialog');
dialog.id = 'account-dialog'; dialog.setAttribute('aria-labelledby', 'session-heading');
dialog.innerHTML = `<h2 id="session-heading">${t('Il tuo account', 'Your account')}</h2><p id="session-user"></p><p>${t('Le partite restano in questo browser.', 'Missions stay in this browser.')}</p><p id="session-message" role="status"></p><button id="account-logout" type="button">${t('Esci dall’account', 'Sign out')}</button><button id="account-close" type="button">${t('Torna al gioco', 'Back to game')}</button>`;
document.body.append(accountButton, dialog);
function enter(user) {
  if (!user?.username) throw new Error(t('Sessione non valida. Accedi di nuovo.', 'Invalid session. Please sign in again.'));
  sessionUser = user;
  form.reset();
  root.remove();
  document.body.classList.remove('auth-pending');
  accountButton.textContent = `Account: ${user.username}`;
  accountButton.hidden = false;
  dialog.querySelector('#session-user').textContent = user.username;
  window.dispatchEvent(new CustomEvent('gng-authenticated', { detail: { username: user.username } }));
  document.querySelector('#view')?.focus();
}
const sessionReady = request('me').then(({user}) => { sessionUser = user; }).catch(error => { sessionError = error.message; });
async function advance() {
  if (advanced) return;
  advanced = true;
  splash.disabled = true;
  root.classList.add('entry-checking');
  await sessionReady;
  if (sessionUser) { enter(sessionUser); return; }
  splash.hidden = true;
  panel.hidden = false;
  root.classList.remove('entry-checking');
  root.classList.add('entry-login');
  mode();
  // Do not summon a phone keyboard before the visitor chooses a field.
  root.querySelector('#account-heading').focus();
}
splash.addEventListener('click', advance);
toggle.addEventListener('click', () => { if (busy) return; register = !register; sessionError = ''; mode(); });
root.querySelector('#password-show').addEventListener('click', event => {
  const shown = password.type === 'password'; password.type = shown ? 'text' : 'password';
  event.currentTarget.textContent = shown ? t('Nascondi', 'Hide') : t('Mostra', 'Show');
  event.currentTarget.setAttribute('aria-pressed', String(shown));
});
form.addEventListener('submit', async event => {
  event.preventDefault(); if (busy) return;
  busy = true; submit.disabled = toggle.disabled = true; form.setAttribute('aria-busy', 'true');
  submit.textContent = t('Prepariamo il lancio…', 'Preparing for launch…'); message.textContent = '';
  try {
    const username = form.elements.username.value.trim();
    const data = register ? { username, password: password.value } : { login: username, password: password.value };
    enter((await request(register ? 'register' : 'login', data)).user);
  } catch (error) { sessionError = error.message; mode(); }
  finally { busy = false; submit.disabled = toggle.disabled = false; form.removeAttribute('aria-busy'); }
});
accountButton.onclick = () => dialog.showModal();
dialog.querySelector('#account-close').onclick = () => dialog.close();
dialog.querySelector('#account-logout').onclick = async event => {
  event.currentTarget.disabled = true;
  try { await request('logout', {}); location.reload(); }
  catch (error) { dialog.querySelector('#session-message').textContent = error.message; event.currentTarget.disabled = false; }
};
mode();
