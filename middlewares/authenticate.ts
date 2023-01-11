/**********************************************************************
 * Changelog
 * All notable changes to this project will be documented in this file.
 **********************************************************************
 *
 * Author            : Deshmukh P
 *
 * Date created      : 11/01/2023
 *
 * Purpose           : authenticate middleware
 **********************************************************************
 */
import { NextFunction, Request, Response } from 'express';
import { ERROR_MESSAGE } from '../utils/const/constants';
import { HTTP_STATUS_CODE } from '../utils/const/constants';
import { errorResponse } from '../utils/response/responseUtil';
import { UserModel, USERROLETYPE } from '../models/users.model';
import { verifyJwt, verifyRJwt } from '../utils/jwt/jwtUtil';
import { logger } from '../utils/logger/loggerUtil';

/**
 * This functions is used to authenticate a user.
 * @param schema User role: USERROLETYPE.seller | USERROLETYPE.buyer | undefined
 * @returns a express middleware function
 * @examples
 *  authenticate(USERROLETYPE.seller) //access only to seller
 *  authenticate(USEROLETYPE.buyer) // access only to buyer
 *  authenticate() //access only to seller and buyer
 */

const authenticate =
    (role?: USERROLETYPE) =>
        async (req: Request, res: Response, next: NextFunction) => {
            const ref_token = req.cookies['jid'];
            if (!ref_token) {
                return res
                    .status(HTTP_STATUS_CODE.UNAUTHORIZED)
                    .json(errorResponse(ERROR_MESSAGE.CHANGE_BROWSER));
            }
            try {
                const ref_token_decoded = await verifyRJwt(ref_token);
                const token = req.headers.authorization?.split(' ')[1];
                if (!token)
                    return res
                        .status(HTTP_STATUS_CODE.UNAUTHORIZED)
                        .json(errorResponse(ERROR_MESSAGE.MISSING_ADMIN_PK));
                const { decoded, expired, valid } = await verifyJwt(token);
                const brokenURL: any = req.url.split('/');
                const refreshRequest: any = brokenURL.find((itm: any) => {
                    return itm === 'refreshToken';
                });
                /**expired acesstoken check just excluding the refresh token requests */
                if (!refreshRequest) {
                    if (expired) {
                        return res
                            .status(HTTP_STATUS_CODE.EXPIRED_ACCESS_TOKEN)
                            .json(errorResponse(ERROR_MESSAGE.EXPIRED_ACCESS_TOKEN));
                    }
                }
                if (!valid || !decoded || !decoded.role) {
                    return res
                        .status(HTTP_STATUS_CODE.UNAUTHORIZED)
                        .json(errorResponse(ERROR_MESSAGE.INVALID_ACCESS_TOKEN));
                }
                res.locals.user = decoded;
                const currentUserData = await UserModel.findById({
                    _id: decoded.userID,
                });

                res.locals.user.data = currentUserData;
                const refTokenVersion = ref_token_decoded.decoded.tokenVersion;
                // get currentUser data
                // compare tokenVersion
                if (
                    currentUserData?.tokenVersion !== refTokenVersion ||
                    currentUserData?.tokenVersion !== decoded.tokenVersion
                ) {
                    return res
                        .status(HTTP_STATUS_CODE.UNAUTHORIZED)
                        .json(errorResponse(ERROR_MESSAGE.UNAUTHORIZED));
                }

                if (!role) return next();
                if (role !== decoded.role)
                    return res.send('Unauthorized').status(401);
                return next();
            } catch (error) {
                console.log(error);
                logger.error(error);
                return res
                    .status(HTTP_STATUS_CODE.INTERNAL_SERVER)
                    .json(errorResponse('User Authentication failed...'));
            }
        };

export default authenticate;