// Account gate: the game's own title screen is the home page. The account form opens over it when the
// player tries to enter the game (Continue / New game). Session tokens remain in HttpOnly cookies.
const root = document.querySelector('#account-entry');
const panel = root.querySelector('#entry-panel');
const form = root.querySelector('#account-form');
const message = root.querySelector('#account-message');
const submit = root.querySelector('#account-submit');
const back = root.querySelector('#account-back');
const password = form.elements.password;
let busy = false, sessionUser = null, waiting = null;
let sessionError = '';
const en = (() => { try { return localStorage.getItem('gngLang') === 'en'; } catch { return false; } })();
const t = (it, eng) => en ? eng : it;
root.querySelectorAll('[data-it]').forEach(el => { el.textContent = t(el.dataset.it, el.dataset.en); });
function mode() {
  root.querySelector('#account-heading').textContent = t('Entra', 'Enter');
  submit.textContent = t('Entra e gioca', 'Enter & play');
  password.minLength = 1;
  password.autocomplete = 'current-password';
  message.textContent = sessionError;
}
async function request(path, data) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`/api/auth/${path}`, { signal: controller.signal, ...(data === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw Object.assign(new Error(result.error || t('Servizio account non disponibile. Riprova tra poco.', 'Account service unavailable. Please try again shortly.')), { status: response.status });
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
  window.gngUser = { username: user.username };
  form.reset();
  root.hidden = true;
  accountButton.textContent = `Account: ${user.username}`;
  accountButton.hidden = false;
  dialog.querySelector('#session-user').textContent = user.username;
  const done = waiting; waiting = null;
  done?.(window.gngUser);
}
const sessionReady = request('me').then(({user}) => { if (user?.username) enter(user); }).catch(error => { sessionError = error.message; });
function cancel() {
  if (busy || root.hidden) return;
  root.hidden = true;
  const done = waiting; waiting = null;
  done?.(null);
}
// The game calls this before letting the player in. It resolves with the user, or null if the form is dismissed.
window.gngRequireAccount = async () => {
  await sessionReady;
  if (sessionUser) return window.gngUser;
  waiting?.(null);
  return new Promise(resolve => {
    waiting = resolve;
    root.hidden = false;
    mode();
    // Do not summon a phone keyboard before the visitor chooses a field.
    form.elements.username.focus({preventScroll:true});
  });
};
back.addEventListener('click', cancel);
document.addEventListener('keydown', event => { if (event.key === 'Escape' && !root.hidden) cancel(); });
form.addEventListener('submit', async event => {
  event.preventDefault(); if (busy) return;
  busy = true; submit.disabled = true; form.setAttribute('aria-busy', 'true');
  submit.textContent = t('Prepariamo il lancio…', 'Preparing for launch…'); message.textContent = '';
  try {
    const username = form.elements.username.value.trim();
    // One form for both cases: try to sign in; if the name is unknown, create the account.
    try {
      enter((await request('login', { login: username, password: password.value })).user);
    } catch (error) {
      if (error.status !== 401) throw error;
      try {
        enter((await request('register', { username, password: password.value })).user);
      } catch (regError) {
        if (regError.status !== 409) throw regError;
        // The name exists but the password does not match.
        throw new Error(t(`Il nome «${username}» esiste già e la password non corrisponde. Riprova la password oppure scegli un altro nome.`, `The name “${username}” already exists and the password doesn't match. Try the password again or pick another name.`));
      }
    }
  } catch (error) { sessionError = error.message; mode(); password.focus({preventScroll:true}); }
  finally { busy = false; submit.disabled = false; form.removeAttribute('aria-busy'); }
});
accountButton.onclick = () => dialog.showModal();
dialog.querySelector('#account-close').onclick = () => dialog.close();
dialog.querySelector('#account-logout').onclick = async event => {
  event.currentTarget.disabled = true;
  try { await request('logout', {}); location.reload(); }
  catch (error) { dialog.querySelector('#session-message').textContent = error.message; event.currentTarget.disabled = false; }
};
mode();
