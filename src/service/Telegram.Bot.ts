import config from "../config";
import { Telegraf } from "telegraf";
import LogsService from "./Logs.service";
import { logger } from "../utils/logger";

const logsService = new LogsService();
export const bot = config.bot.SEND_TELEGRAM
  ? new Telegraf(config.bot.BOT_TOKEN)
  : null;
export async function launch_bot() {
  if (!config.bot.SEND_TELEGRAM) return;
  bot.start((ctx: any) => ctx.reply("Welcome"));
  await bot.launch();
  // Enable graceful stop
  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
}

export async function send_message(message: any) {
  if (!config.bot.SEND_TELEGRAM) return;
  const mode: any = {
    parse_mode: "Markdown",
    disable_web_page_preview: true,
  };
  const ids = config.bot.ALLOW_IDS;
  // check array
  if (Array.isArray(ids) == false) {
    throw Error("Can not find allow channel ids");
  }
  for (const id of ids) {
    try {
      await bot.telegram.sendMessage(id, message, mode);
      logger.debug(`Message sent to group: ${id}`);
    } catch (err) {
      logger.error(
        `Could not sent message to group: ${id} err: ${err.message}`,
      );
      logger.error(err);
      logsService.error(
        `Could not sent message to group: ${id} err: ${err.message}`,
      );
    }
  }
}
