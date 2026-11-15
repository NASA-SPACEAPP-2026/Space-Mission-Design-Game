import { describe, it, expect } from 'vitest';
import { isProfaneUsername } from '../backend/username-filter.mjs';

describe('username profanity filter', () => {
  it('blocks English and Italian swear words, slurs and blasphemy', () => {
    for (const name of ['fuckface', 'Shit_Pilot', 'bitch99', 'xXcuntXx', 'motherfucker', 'dumbass_77',
      'cazzone', 'Stronzo_1', 'vaffanculo', 'figlioDiPuttana', 'merdaccia', 'coglione', 'porcodio', 'Dio_Cane',
      'big_ass', 'BigAss', 'ass69', 'tits_mcgee', 'il_culo', 'TroiaMaledetta', 'nazi_88']) {
      expect(isProfaneUsername(name), name).toBe(true);
    }
  });
  it('sees through leetspeak, repeated letters and underscores', () => {
    for (const name of ['FuUuCk', 'sh1t', '5h17', 'f_u_c_k', 'c4zz0', 'ca_zz_o', 'str0nz0', 'm3rd4', 'fvck', 'a55', 'cazzzzo']) {
      expect(isProfaneUsername(name), name).toBe(true);
    }
  });
  it('keeps innocent names that contain short bad words', () => {
    for (const name of ['Pilot_1', 'Titan', 'titanium', 'assistant', 'Classic_Astro', 'Cassini', 'analysis', 'canale',
      'cocktail', 'cockpit', 'Peacock', 'Hancock', 'document', 'cumulus', 'Scunthorpe', 'Montenegro', 'internazionale',
      'penisola', 'sextant', 'Uranus', 'Dickens', 'Troiano', 'scopa', 'Niger', 'fagotto', 'Fukushima', 'figata',
      'pacifica', 'shiitake', 'Sega_fan', 'Marco_Negri', 'Pass_word', 'Massimo', 'apollo11', 'Voyager_2', 'hubble90']) {
      expect(isProfaneUsername(name), name).toBe(false);
    }
  });
});
