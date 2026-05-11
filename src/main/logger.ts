import pino from 'pino';
import { resolve } from 'path';

const transport = pino.transport({
  targets: [
    {
      target: 'pino-pretty',
      options: { colorize: true },
      level: 'info',
    },
    {
      target: 'pino/file',
      options: { destination: resolve(process.cwd(), 'app.log') },
      level: 'info',
    },
  ],
});

export const logger = pino(transport);
