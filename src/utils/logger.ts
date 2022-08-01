// import config from 'config';
import config from "../config";
import fs from "fs";
import path from "path";
import winston from "winston";
import winstonDaily from "winston-daily-rotate-file";

// logs dir
const logDir: string = path.join(__dirname, config.log.dir);

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}
/*
 * Log Level
 * error: 0, warn: 1, info: 2, http: 3, verbose: 4, debug: 5, silly: 6
 */
const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.splat(),
    // Định dạng time cho log
    winston.format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    // thêm màu sắc
    winston.format.colorize(),
    // thiết lập định dạng của log
    winston.format.printf((log) => {
      // nếu log là error hiển thị stack trace còn không hiển thị message của log
      if (log.stack) return `[${log.timestamp}] [${log.level}] ${log.stack}`;
      return `[${log.timestamp}] [${log.level}] ${log.message}`;
    }),
  ),
  level: "debug",
});

export { logger };
