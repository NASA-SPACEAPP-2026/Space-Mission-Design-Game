// Account UI is independent of the game and never stores credentials in localStorage.
const style = document.createElement('style');
style.textContent = `#account-open{position:fixed;bottom:12px;right:12px;z-index:1000;background:#15232d;color:#fff;border:1px solid #f07b3f;padding:10px 16px;border-radius:10px}#account-dialog{background:#15232d;color:#fff;border:1px solid #f07b3f;border-radius:16px;width:min(420px,90vw);padding:24px}#account-dialog::backdrop{background:#000a}#account-dialog input{display:block;width:100%;padding:10px;margin:5px 0 16px;background:#0e1820;color:white;border:1px solid #8192a3;border-radius:6px}#account-dialog button{padding:10px;margin:8px 8px 0 0}#account-message{margin:12px 0;min-height:24px}#account-dialog label{line-height:1.5}`;
document.head.append(style);
const open = document.createElement('button');
open.id = 'account-open'; open.textContent = 'Account';
const dialog = document.createElement('dialog');
dialog.id = 'account-dialog'; dialog.setAttribute('aria-labelledby','account-heading');
dialog.innerHTML = `<h2 id="account-heading">Il tuo account</h2><p>Le partite restano salvate in questo browser.</p><p id="account-message" role="status" aria-live="polite"></p><form id="account-form"><label id="account-login-label">Username o email<input name="login" autocomplete="username" required maxlength="254"></label><label id="account-username-label" hidden>Username<input name="username" autocomplete="username" pattern="[a-zA-Z0-9_]{3,24}" maxlength="24"></label><label id="account-email-label" hidden>Email<input name="email" type="email" autocomplete="email" maxlength="254"></label><label>Password<input name="password" type="password" autocomplete="current-password" required maxlength="128"></label><button type="submit" id="account-submit">Accedi</button><button type="button" id="account-toggle">Crea account</button></form><button type="button" id="account-logout" hidden>Esci</button><button type="button" id="account-close">Chiudi</button>`;
document.body.append(open, dialog);
const get = id => dialog.querySelector(`#account-${id}`);
const form = get('form'); let register = false;
const message = text => { get('message').textContent = text; };
function mode() {
  get('login-label').hidden = register;
  get('username-label').hidden = get('email-label').hidden = !register;
  for (const name of ['login','username','email']) { form.elements[name].disabled = name === 'login' ? register : !register; form.elements[name].required = !form.elements[name].disabled; }
  form.elements.password.minLength = register ? 15 : 1;
  form.elements.password.autocomplete = register ? 'new-password' : 'current-password';
  get('submit').textContent = register ? 'Registrati' : 'Accedi';
  get('toggle').textContent = register ? 'Ho già un account' : 'Crea account';
  message(register ? 'Password: almeno 15 caratteri. L’email non viene ancora verificata.' : '');
}
async function request(path, data) {
  const response = await fetch(`/api/auth/${path}`, data === undefined ? {} : { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Servizio non disponibile');
  return result;
}
function userState(user) {
  form.hidden = !!user; get('logout').hidden = !user;
  open.textContent = user ? `Account: ${user.username}` : 'Account';
  message(user ? `Accesso effettuato come ${user.username}` : '');
}
open.onclick = async () => { dialog.showModal(); try { userState((await request('me')).user); } catch (e) { form.hidden = true; message(e.message); } };
get('close').onclick = () => { form.reset(); dialog.close(); };
get('toggle').onclick = () => { register = !register; mode(); };
form.onsubmit = async event => {
  event.preventDefault(); get('submit').disabled = true;
  try { userState((await request(register ? 'register' : 'login', Object.fromEntries(new FormData(form)))).user); form.reset(); }
  catch(e) { message(e.message); } finally { get('submit').disabled = false; }
};
get('logout').onclick = async () => { try { await request('logout', {}); userState(null); } catch(e) { message(e.message); } };
mode();
