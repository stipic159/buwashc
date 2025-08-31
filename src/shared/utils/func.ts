import { config } from "#config/config";
import { logger } from "#shared/index";
import { TelegramClient } from "telegram";
import { NewMessage } from "telegram/events/index.js";

export async function start(client: TelegramClient): Promise<void> {
  const me = await client.getMe();

  // Команда для печатания текста с анимацией
  client.addEventHandler(
    async (event) => {
      if (!event.chatId) return;
      if (!event.message) return;

      const text = event.message.text.split("/p ")[1];
      if (!text) return;
      let typedText = "";

      for (const char of text) {
        typedText += char;
        await client.editMessage(event.chatId, {
          message: event.message.id,
          text: typedText + config.constants.settings.cursorSymbol,
        });
        await new Promise(async (resolve) => setTimeout(resolve, await convert(config.constants.settings.typingSpeed)));
      }
      await client.editMessage(event.chatId, {
        message: event.message.id,
        text: typedText,
      });
    },
    new NewMessage({ pattern: /^\/p (.+)$/ })
  );

  logger.info("Клиент запущен и слушает сообщения...");
  client.disconnected;
}

async function convert(decimal: number) {
  return decimal * 100;
}
