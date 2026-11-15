// Username profanity filter (English + Italian). Used at registration and by the leaderboard seeder.
// Usernames are 3–24 ASCII letters, digits or '_', so matching works on that alphabet:
//  - every letter also accepts its common leetspeak digits (a/4, e/3, i/1, l/1, o/0, s/5, t/7, b/8, g/9, u/v);
//  - every letter may be repeated ("fuuuck", "cazzzo");
//  - '_' is ignored ("f_u_c_k").
// ROOTS match anywhere in the name; they are long or distinctive enough not to hide inside innocent words.
// WORDS are short or ambiguous (ass, tit, anal, troia ...): they would block Titan, analysis or Troia (Troy),
// so they only match a whole word of the name — split on '_', camelCase and edge digits.
const ROOTS = [
  // English
  'fuck', 'fck', 'phuck', 'motherf', 'shit', 'cunt', 'bitch', 'bastard', 'asshole', 'asswipe', 'dumbass',
  'jackass', 'fatass', 'cocksuck', 'dickhead', 'dickface', 'pussy', 'whore', 'slut', 'twat', 'wank',
  'nigger', 'nigga', 'faggot', 'retard', 'porn', 'pedophil', 'paedophil', 'hitler', 'dildo', 'blowjob',
  'handjob', 'jerkoff', 'milf', 'horny', 'vagina', 'scrotum', 'testicle', 'piss', 'killyourself',
  // Italian
  'cazz', 'minchi', 'stronz', 'vaffanc', 'fanculo', 'inculat', 'inculo', 'culattone', 'culattona',
  'leccacul', 'puttan', 'troione', 'troietta', 'merda', 'coglion', 'pompin', 'bocchin', 'sborr',
  'segaiol', 'mignott', 'zoccola', 'frocio', 'froci', 'ricchion', 'fott', 'pedofil', 'mongoloid',
  // Italian blasphemy
  'porcodio', 'porcoddio', 'diocane', 'dioporco', 'porcamadonna', 'madonnaputtana', 'diobestia',
  'dioboia', 'diomerda', 'dioschifoso',
];
const WORDS = [
  // English
  'ass', 'arse', 'tit', 'tits', 'titty', 'titties', 'boob', 'boobs', 'cum', 'cock', 'cocks', 'dick',
  'dicks', 'anal', 'anus', 'penis', 'semen', 'sex', 'sexy', 'rape', 'raped', 'rapist', 'nazi', 'nazis',
  'kkk', 'fag', 'fags', 'hoe', 'hoes', 'fuk', 'kys',
  // Italian
  'culo', 'figa', 'fica', 'troia', 'negro', 'negra', 'finocchio', 'pirla', 'tette',
];
// Innocent words containing a ROOT; removed before matching.
const ALLOWED = ['scunthorpe', 'shiitake', 'swank', 'thorny', 'retardant'];

const LEET = { a: 'a4', b: 'b8', e: 'e3', g: 'g9', i: 'i1', l: 'l1', o: 'o0', s: 's5', t: 't7', u: 'uv' };
const pattern = word => [...word].map(c => `[${LEET[c] || c}]+`).join('');
const rootRe = new RegExp(ROOTS.map(pattern).join('|'));
const wordRe = new RegExp(`^(?:${WORDS.map(pattern).join('|')})$`);
const allowedRe = new RegExp(ALLOWED.map(pattern).join('|'), 'g');

const words = name => name.split(/_+|(?<=[a-z])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])/).filter(Boolean)
  .flatMap(w => [w.toLowerCase(), w.toLowerCase().replace(/^\d+|\d+$/g, '')]).filter(Boolean);

/** True when the username contains an English or Italian swear word or slur. */
export function isProfaneUsername(name) {
  if (typeof name !== 'string') return false;
  const ascii = name.normalize('NFKD').replace(/[̀-ͯ]/g, '');
  const flat = ascii.toLowerCase().replace(/[^a-z0-9]/g, '').replace(allowedRe, '');
  return rootRe.test(flat) || words(ascii).some(w => wordRe.test(w));
}
