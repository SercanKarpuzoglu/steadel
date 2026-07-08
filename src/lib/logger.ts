import pino from "pino";

const logDir = process.env.LOG_DIR;

export const logger = pino(
  {
    level: process.env.LOG_LEVEL ?? "info",
    base: { app: "steadel" },
    redact: {
      paths: [
        "credentials",
        "*.credentials",
        "password",
        "*.password",
        "accessToken",
        "*.accessToken",
        "consumerSecret",
        "*.consumerSecret",
      ],
      censor: "[redacted]",
    },
  },
  logDir
    ? pino.destination({ dest: `${logDir}/steadel.log`, mkdir: true })
    : undefined,
);
