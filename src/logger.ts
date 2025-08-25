import { getConfig } from "./config.ts";

export function getLoggerConfig() {
  const { env } = getConfig();

  if (env === "production") {
    return true;
  } else if (env === "test") {
    return false;
  } else {
    return {
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
        },
      },
    };
  }
}
