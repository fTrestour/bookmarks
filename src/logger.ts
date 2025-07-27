import { getConfig } from "./config.ts";

export function getLoggerConfig() {
  const { env } = getConfig();

  if (env === "production") {
    return true; // JSON logging in production
  } else if (env === "test") {
    return false; // No logging in test
  } else {
    return {
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
        },
      },
    }; // Pretty logging for development
  }
}
