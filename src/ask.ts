import { t } from './lang';

/*
 * A yes/no question in the game's own style. The browser's confirm() is not used: the Claude and
 * iOS app views show nothing for it, so it would answer "no" without asking.
 */
export function ask(text: string, yes: string): Promise<boolean> {
  const box = document.getElementById('ask') as HTMLElement;
  (document.getElementById('askText') as HTMLElement).textContent = text;
  const ok = document.getElementById('askYes') as HTMLButtonElement, no = document.getElementById('askNo') as HTMLButtonElement;
  ok.textContent = yes; no.textContent = t('common.cancel');
  box.hidden = false;
  return new Promise((done) => {
    const close = (v: boolean) => { box.hidden = true; ok.onclick = no.onclick = null; done(v); };
    ok.onclick = () => close(true); no.onclick = () => close(false);
  });
}
