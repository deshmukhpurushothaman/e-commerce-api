/**********************************************************************
 * Changelog
 * All notable changes to this project will be documented in this file.
 **********************************************************************
 *
 * Author            : Deshmukh P
 *
 * Date created      : 10/01/2023
 *
 * Purpose           : sanitize client sent html like for messages when they submit query
 **********************************************************************
 */
import sanitizeHtml from 'sanitize-html';
import { logger } from '../logger/loggerUtil';

/**
 * This functions is used to sanitize the request payload from client
 */
const sanitizePayload = async (pd: any) => {
    try {
        if (Object.keys(pd).length === 0) {
            logger.warn('payload was empty for the api call...');
            return {
                message: 'failed',
                cleanPD: null,
            };
        }
        const cleanPD = await sanitizeHtml(pd);
        return {
            message: 'success',
            cleanPD: JSON.parse(cleanPD),
        };
    } catch (error: any) {
        logger.error(error);
        return {
            message: 'failed',
            cleanPD: null,
        };
    }
};

export default sanitizePayload;