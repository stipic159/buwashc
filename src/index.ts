import { config } from "#config";
import { logger, reply, start } from "#shared/index";
import "dotenv/config";
import { mkdir } from "fs/promises";
import promptSync from "prompt-sync";
import { TelegramClient } from "telegram";
import { StoreSession } from "telegram/sessions/index.js";

interface TelegramConfig {
  apiId: number;
  apiHash: string;
  phoneNumber: string;
  sessionPath: string;
}

class TelegramClientManager {
  private client: TelegramClient | null = null;
  private config: TelegramConfig;
  private prompt = promptSync({ sigint: true });
  private maxPasswordAttempts = 3;

  constructor(config: TelegramConfig) {
    this.config = config;
    this.setupGracefulShutdown();
  }

  private setupGracefulShutdown(): void {
    const shutdown = async () => {
      logger.info(reply.t("telegram.connection.shuttingDown"));
      await this.disconnect();
      process.exit(0);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  }

  async connect(): Promise<TelegramClient> {
    const session = new StoreSession(this.config.sessionPath);
    this.client = new TelegramClient(session, this.config.apiId, this.config.apiHash, {
      connectionRetries: 5,
      retryDelay: 1000,
    });

    await this.client.start({
      phoneNumber: () => Promise.resolve(this.config.phoneNumber),
      password: () => this.getPassword(),
      phoneCode: () => this.getCodeInput(),
      onError: this.handleAuthError.bind(this),
    });

    logger.info(reply.t("telegram.connection.successfullyConnected"));
    return this.client;
  }

  private async getPassword(): Promise<string> {
    for (let attempt = 1; attempt <= this.maxPasswordAttempts; attempt++) {
      try {
        const password = this.prompt(reply.t("telegram.authentication.passwordPrompt"), { echo: "*" });
        if (!password.trim()) {
          console.log(reply.t("telegram.authentication.passwordEmpty"));
          continue;
        }
        return password.trim();
      } catch (error) {
        if (attempt === this.maxPasswordAttempts) {
          throw new Error(reply.t("telegram.authentication.maxPasswordAttemptsExceeded"));
        }
        logger.warn(reply.t("telegram.authentication.invalidPasswordAttempt", { attempt }));
      }
    }
    throw new Error(reply.t("telegram.authentication.failedToGetValidPassword"));
  }

  private handleAuthError(error: Error): void {
    if (error.message.includes("PASSWORD_HASH_INVALID")) {
      logger.warn(reply.t("telegram.authentication.invalidPasswordRetry"));
      return;
    }
    logger.error(error, reply.t("telegram.authentication.authError"));
    throw error;
  }

  private async getCodeInput(): Promise<string> {
    return this.prompt(String(reply.t("telegram.authentication.codePrompt")));
  }

  async disconnect(): Promise<void> {
    if (this.client?.connected) {
      await this.client.disconnect();
      logger.info(reply.t("telegram.connection.disconnected"));
    }
  }

  getClient(): TelegramClient {
    if (!this.client) {
      throw new Error(reply.t("telegram.client.notInitialized"));
    }
    return this.client;
  }

  async ensureDir(dirPath: string) {
    try {
      await mkdir(dirPath, { recursive: true });
    } catch {
      throw new Error(reply.t("telegram.filesystem.directoryCreationFailed", { dirPath }));
    }
  }
}

async function main(): Promise<void> {
  const telegramConfig: TelegramConfig = {
    apiId: config.secrets.telegramApiId,
    apiHash: config.secrets.telegramApiHash,
    phoneNumber: config.secrets.telegramNumberPhone,
    sessionPath: config.paths.sessions,
  };

  const clientManager = new TelegramClientManager(telegramConfig);
  await clientManager.ensureDir(config.paths.logs);
  await clientManager.ensureDir(config.paths.tmp);

  try {
    const client = await clientManager.connect();
    await start(client);
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error(String(error)), reply.t("telegram.errors.applicationError"));
    process.exit(1);
  }
}

main().catch((error) => logger.error(error, reply.t("telegram.errors.unhandledError")));
