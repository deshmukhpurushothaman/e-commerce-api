/**********************************************************************
 * Changelog
 * All notable changes to this project will be documented in this file.
 **********************************************************************
 *
 * Author            : Deshmukh P
 *
 * Date created      : 10/01/2023
 *
 * Purpose           : Contains the Code for the Logging
 **********************************************************************
 */
import winston from 'winston';
import 'winston-mongodb';
import 'dotenv';
import config from '../../config/default';

/** API LEVEL LOGGER INITIALIZER
 * Type - local/dev/prod environment
 * creates & logs a general logger file & exceptions file in root of this project
 */
export const logger = winston.createLogger({
    exitOnError: false,
    format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
        winston.format.printf(
            (info) => `${info.timestamp} ${info.level}: ${info.message}`,
        ),
    ),
    transports: [
        new winston.transports.File({
            filename: config.LOG_FILE_PATH,
            maxsize: 5242880,
            maxFiles: 5,
        }),
        new winston.transports.Console(),
    ],
    exceptionHandlers: [
        new winston.transports.File({
            filename: config.LOG_API_EXCEPTIONS,
            maxsize: 5242880,
            maxFiles: 5,
        }),
        new winston.transports.Console(),
    ],
});

/**DB Logger
 * Type - DB collection logs
 */
const optDB = {
    db: `mongodb+srv://${process.env.DB_USERNAME as string}:${process.env.DB_PASSWORD as string
        }@${process.env.DB_HOSTNAME as string}/${process.env.LOGGER_DB as string
        }?retryWrites=true&w=majority`,
    collection: process.env.LOGGER_DB_COLL as string,
    options: {
        useUnifiedTopology: true,
    },
    capped: true,
    size: 10242880,
    max: 10000,
};
export const dbLogger = winston.createLogger({
    exitOnError: false,
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
    ),
    // transport to db collection
    transports: [winston.add(new winston.transports.MongoDB(optDB))],
});