import winston from "winston";

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "white",
};

winston.addColors(colors);

const format = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

const logger = winston.createLogger({
  level: process.env.NODE_ENV === "development" ? "debug" : "info",
  levels,
  format,
  transports: [
    // Write all logs to console
    new winston.transports.Console(),
    // Write all logs error (and above) to error.log
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
    }),
    // Write all logs to combined.log
    new winston.transports.File({ filename: "logs/combined.log" }),
  ],
});

export default logger;
