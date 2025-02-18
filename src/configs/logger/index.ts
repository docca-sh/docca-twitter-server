import { LoggerOptions, pino } from 'pino';
import { env } from '../env.js';

const loggerConfigs = {
    development: {
        transport: {
            target: 'pino-pretty',
            options: {
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
            },
        },
    },
    production: {},
} satisfies Record<string, boolean | LoggerOptions>;

export const logger = pino(loggerConfigs[env.NODE_ENV]);

const levels = ['info', 'error', 'warn', 'debug', 'trace', 'log'] as const;
levels.forEach((level) => {
    console[level] = (message?: any, ...optionalParams: any[]) => {
        if (typeof message === 'string' && optionalParams.length === 1) {
            logger[level === 'log' ? 'info' : level](optionalParams[0], message);
        } else {
            logger[level === 'log' ? 'info' : level](message, ...optionalParams);
        }
    };
});
