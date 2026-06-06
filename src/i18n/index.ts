import { en } from "./locales/en";
import { ru } from "./locales/ru";
import { es } from "./locales/es";
import { de } from "./locales/de";
import { fr } from "./locales/fr";
import { uk } from "./locales/uk";
import { zh } from "./locales/zh";
import { ja } from "./locales/ja";
import { useSettings } from "../hooks/useSettings";

const dictionaries = { en, ru, es, de, fr, uk, zh, ja };
type Language = keyof typeof dictionaries;

export function useTranslation() {
  const { language } = useSettings();
  const currentLang = (dictionaries[language as Language] ? language : "en") as Language;
  const t = dictionaries[currentLang];
  
  return { t, lang: currentLang };
}
