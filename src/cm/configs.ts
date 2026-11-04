// The signature configurations from the CMS, as builder configurations.
import data from '../content/cm/configurations.json';
import { normalise, encode, type Config, type Audience } from './options';

export interface Signature { name: string; for: Audience; text: string; config: Config; code: string }

export const SIGNATURES: Signature[] = data.items.map((it) => {
  const config = normalise({
    setting: it.setting, scope: it.scope, size: it.size, material: it.material, drive: it.drive, sun: it.sun,
    controller: !!it.controller, aurora: !!it.aurora, dome: !!it.dome, domeMount: it.domeMount, pavilion: !!it.pavilion,
  } as Config);
  return { name: it.name, for: it.for as Audience, text: it.text, config, code: encode(config) };
});

export const findSignature = (name: string) => SIGNATURES.find((s) => s.name.trim().toLowerCase() === name.trim().toLowerCase());
