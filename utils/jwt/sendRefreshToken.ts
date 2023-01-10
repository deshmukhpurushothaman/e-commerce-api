/**********************************************************************
 * Changelog
 * All notable changes to this project will be documented in this file.
 **********************************************************************
 *
 * Author            : Deshmukh P
 *
 * Date created      : 10/01/2023
 *
 * Purpose           : sends refresh token as cookie in response
 **********************************************************************
 */
import { Response } from 'express';

export const sendRefreshToken = (res: Response, token: string) => {
    res.cookie('jid', token, {
        // now it can only accesed via request not via javascript(client)
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'development' ? true : 'none',
        secure: true,
    });
};