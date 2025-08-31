import pino from "pino";
import { config } from "../../config/config.js";

const infoStream = pino.destination({
  dest: `${config.paths.logs}/app-info.log`,
  mkdir: true,
  sync: false,
});

const errorStream = pino.destination({
  dest: `${config.paths.logs}/app-error.log`,
  mkdir: true,
  sync: false,
});

const streams = [
  {
    level: config.constants.logLevelConsole,
    stream: pino.transport({
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "HH:mm:ss",
        ignore: "pid,hostname",
      },
    }),
  },
  {
    level: "info",
    stream: {
      write: (chunk: string) => {
        try {
          const log = JSON.parse(chunk);
          if (log.level === 30 || log.level === 40) {
            infoStream.write(chunk + "\n");
          }
          if (log.level === 50 || log.level === 60) {
            errorStream.write(chunk + "\n");
          }
        } catch (err) {}
      },
    },
  },
];

const logger = pino(
  {
    level: "debug",
  },
  pino.multistream(streams)
);

export default logger;
