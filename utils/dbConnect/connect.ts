/**********************************************************************
 * Changelog
 * All notable changes to this project will be documented in this file.
 **********************************************************************
 *
 * Author            : Deshmukh P
 *
 * Date created      : 10/01/2023
 *
 * Purpose           : mongo connection
 **********************************************************************
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import {
    logger,
    dbLogger
} from '../../utils/logger/loggerUtil';
//  import createAdmin from '../../scripts/createAdmin';

// DB CONFIGS
const dbHost = process.env.DB_HOSTNAME;
const dbUserName = process.env.DB_USERNAME;
const dbPassword = process.env.DB_PASSWORD;
const dbName = process.env.DB_NAME;
const mongoUrl =
    'mongodb+srv://' +
    dbUserName +
    ':' +
    dbPassword +
    '@' +
    dbHost +
    '/' +
    dbName +
    '?' +
    'retryWrites=true&w=majority';

// MONGODB CONNECTION & Admin cred
export const connectDB = async function () {
    try {
        await mongoose.connect(mongoUrl);
        logger.info('💎 MongoDB connected!!');
        //  const adminExist = await createAdmin();
        return;
    } catch (error: any) {
        dbLogger.error('Mongo DB is not connected to app...', {
            metadata: {
                metaService: `MONGO_DB`,
                errorMessage: `${error.message}`,
            },
        });
        logger.error(error, '💀 something went wrong');
        return;
    }
};