import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";
import pkg from "../../package.json" with { type: "json" };


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const root = path.join(__dirname, "../../..");
const isDev = process.env.NODE_ENV === "development";

type Config = {
  meta: {
    version: string;
    devMode: boolean;
    port: number;
  };
  constants: {
    maxPasswordAttempts: number;
    logLevelConsole: string;
    language: string;
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
  },
  secrets: {
    telegramApiId: Number(process.env.TELEGRAM_ID_API) || 0,
    telegramApiHash: process.env.TELEGRAM_HASH_API || "",
    telegramNumberPhone: process.env.TELEGRAM_NUMBER_PHONE || "",
  },
};

for (const [key, value] of Object.entries([
  configBase.secrets.telegramApiId,
  configBase.secrets.telegramApiHash,
  configBase.secrets.telegramNumberPhone,
])) {
  if (value === "" || value === 0) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const paths = {
  root,
  tmp: path.join(root, ".tmp"),
  logs: path.join(root, ".logs"),
  sessions: `.sessions_${configBase.secrets.telegramNumberPhone}`
};

export const config: Config = {
  ...configBase,
  paths,
};
