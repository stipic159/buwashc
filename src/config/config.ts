// config.ts
import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";
import configJSON from "../../config.json" with { type: "json" };
import pkg from "../../package.json" with { type: "json" };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const root = path.join(__dirname, "../..");
const isDev = process.env.NODE_ENV === "development";

export type Config = {
  meta: {
    version: string;
    devMode: boolean;
    port: number;
  };
  constants: {
    maxPasswordAttempts: number;
    logLevelConsole: string;
    language: string;
    settings: {
      cursorSymbol: string;
      typingSpeed: number;
    };
  };
  secrets: {
    telegramApiId: number;
    telegramApiHash: string;
    telegramNumberPhone: string;
  };
  paths: {
    root: string;
    tmp: string;
    sessions: string;
    logs: string;
  };
};

const configBase = {
  meta: {
    version: pkg.version,
    devMode: isDev,
    port: 45909,
  },
  constants: {
    maxPasswordAttempts: 5,
    logLevelConsole: process.env.LOG_LEVEL || "info",
    language: process.env.LANGUAGE || "en",
    settings: {
      cursorSymbol: configJSON.cursor_symbol,
      typingSpeed: Number(configJSON.typing_speed),
    },
  },
  secrets: {
    telegramApiId: Number(process.env.TELEGRAM_ID_API) || 0,
    telegramApiHash: process.env.TELEGRAM_HASH_API || "",
    telegramNumberPhone: process.env.TELEGRAM_NUMBER_PHONE || "",
  },
};

for (const [key, value] of Object.entries({
  telegramApiId: configBase.secrets.telegramApiId,
  telegramApiHash: configBase.secrets.telegramApiHash,
  telegramNumberPhone: configBase.secrets.telegramNumberPhone,
})) {
  if (value === "" || value === 0) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

if (configBase.constants.settings.cursorSymbol.length !== 1) {
  throw new Error("Cursor symbol must be a single character.");
}

if (
  isNaN(configBase.constants.settings.typingSpeed) ||
  configBase.constants.settings.typingSpeed < 0.1 ||
  configBase.constants.settings.typingSpeed > 1
) {
  throw new Error("Typing speed must be a valid number (from 0.1 to 1).");
}

const paths = {
  root,
  tmp: path.join(root, ".tmp"),
  logs: path.join(root, ".logs"),
  sessions: `.sessions_${configBase.secrets.telegramNumberPhone}`,
};

export const config: Config = {
  ...configBase,
  paths,
};
