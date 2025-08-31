import { config } from "#config";
import { I18n } from "i18n-js";
import en from "./translations/en.json" with { type: "json" };
import ru from "./translations/ru.json" with { type: "json" };

const reply = new I18n({ ru, en });

reply.defaultLocale = "en";
reply.enableFallback = true;
reply.locale = config.constants.language;

export default reply;
