import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs';

// Ensure the log directory exists
const logDir = '/var/log/aphians';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true }); // Use recursive to create parent directories if they don't exist
}

// Custom formatter for pretty printing objects
const customFormat = winston.format.printf(({ timestamp, level, message }) => {
  let formattedMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  
  // If the message is an object, we pretty-print it
  if (typeof message === 'object') {
    formattedMessage = `[${timestamp}] [${level.toUpperCase()}] ${JSON.stringify(message, null, 2)}`;
  }

  return formattedMessage;
});

const createTransport = (level, filename) =>
  new DailyRotateFile({
    filename: path.join(logDir, `${filename}-%DATE%.log`),
    datePattern: 'YYYY-MM-DD',
    level,
    zippedArchive: true,
    maxSize: '5m',
    maxFiles: '14d',
    handleExceptions: true,
  });

const log = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    customFormat // Use the custom format for logging
  ),
  transports: [
    createTransport('info', 'server'),
    createTransport('error', 'error'),
    createTransport('debug', 'debug'),
    new winston.transports.Console({ level: 'debug' }),
  ],
  exitOnError: false,
});

export default log;
