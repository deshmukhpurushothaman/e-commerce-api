/**********************************************************************
 * Changelog
 * All notable changes to this project will be documented in this file.
 **********************************************************************
 *
 * Author            : Deshmukh P
 *
 * Date created      : 10/01/2023
 *
 * Purpose           : initiate express server and basic configs
 **********************************************************************
 */

import 'dotenv/config';
import process from 'node:process';
import mongoose from 'mongoose';
import express, { NextFunction, Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import useragent from 'express-useragent';
import nocache from 'nocache';
import { logger } from './utils/logger/loggerUtil';
import { HTTP_STATUS_CODE } from './utils/const/constants';
import { ERROR_MESSAGE } from './utils/const/constants';
import { errorResponse } from './utils/response/responseUtil';
//  import sanitizeCHTML from './middlewares/sanitizechtml';
//  import userAgentGrabber from './middlewares/userAgentGrabber';
import { connectDB } from './utils/dbConnect/connect';
import user from './routes/users';
import seller from './routes/seller';

export const startExpressServer = async () => {
    try {
        /**callback invoked & returns the code when process.exitCode is set */
        // process.on('exit', (code) => {
        // 	dbLogger.error(`Server crashed with exit code ${code}`, {
        // 		metadata: {
        // 			metaService: `CORE_API_BEST_ENLIST`,
        // 			servicesEffected: `all`,
        // 		},
        // 	});
        // });
        const app = express();

        // req.ip , for nginx reverse proxy to determine the IP address via X-forwarded headers.
        app.enable('trust proxy');

        //DB Connection
        await connectDB();

        // mongo gracefull exit
        const gracefulExit = () => {
            mongoose.connection.close(() => {
                logger.warn(
                    'Mongoose default connection with DB disconnected through app termination byee..🐱‍🚀',
                );
                process.exit(0);
            });
        };
        // If node process ends, closes the mongoose connection
        process.on('SIGINT', gracefulExit).on('SIGTERM', gracefulExit);

        const options = {
            limit: '1kb'
        };

        /* API LEVEL MIDDLEWARES
         */
        app.use(nocache());
        app.use(cors())
        app.use(express.json(options));
        // This check makes sure this is a JSON parsing issue, but it might be
        // coming from any middleware, not just body-parser:
        app.use((err: any, req: any, res: any, next: any) => {
            // @ts-ignore
            if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
                return res.status(400).send("Invalid data"); // Bad request
            }
            next();
        });
        app.use(express.urlencoded({ extended: true }));
        app.use(cookieParser());

        // Forces all connections through https & hides backend tech stack
        app.use(helmet());

        // for all complex preflight requests
        app.options('*', cors());

        // customized sanitize-html middleware if client sends html to server
        //  app.use(sanitizeCHTML());

        // guard against $ injections attacks in mongoDB
        // replaces $ and.by default in body, params, query, headers
        app.use(mongoSanitize());

        // useragent exposure to application & could be grabbed via req.useragent
        app.use(useragent.express());

        // customized user-agent info checker/grabber
        //  app.use(userAgentGrabber());

        app.use(
            (err: any, req: Request, res: Response, next: NextFunction) => {
                if (err.code !== 'EBADCSRFTOKEN') return next(err);
                // handle CSRF token errors here
                res.status(403);
                res.send('form was tampered with');
            },
        );
        // ROUTES
        app.use('/api/user', user)
        app.use('/api/seller', seller)
        //  app.use('/learn/course', course)

        // minimalistic errorHandler if wrong route is hit
        app.use('/', (req: Request, res: Response) => {
            logger.error(`No route found for ${req.url}`);
            return res
                .status(HTTP_STATUS_CODE.NOT_FOUND)
                .json(errorResponse(ERROR_MESSAGE.NO_ROUTE_FOUND));
        });

        const PORT = process.env.PORT;

        app.listen(PORT || 5000, () => {
            logger.info('🎇 Server is running on port:' + PORT);
        });
    } catch (error: any) {
        logger.error(error);
        // dbLogger.error('Server unknown error occured', {
        //     metadata: {
        //         metaService: `CORE_API_BEST_ENLIST`,
        //         servicesEffected: `all`,
        //         errorMessage: `${error}`,
        //     },
        // });
        process.exitCode = 1;
        return;
    }
};