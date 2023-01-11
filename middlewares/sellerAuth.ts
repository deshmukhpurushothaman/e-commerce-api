/**********************************************************************
 * Changelog
 * All notable changes to this project will be documented in this file.
 **********************************************************************
 *
 * Author            : Best Enlist
 *
 * Date created      : 02/01/2023
 *
 * Purpose           : Admin authenticate middleware
 **********************************************************************
 */
import { NextFunction, Request, Response } from 'express';
import { ERROR_MESSAGE } from '../utils/const/constants';
import { HTTP_STATUS_CODE } from '../utils/const/constants';
import { errorResponse } from '../utils/response/responseUtil';
import { USERROLETYPE } from '../models/users.model';
import { verifySellerJwt, verifySellerRJwt } from '../utils/jwt/jwtUtil';
import { logger } from '../utils/logger/loggerUtil';
import { SellerModel } from '../models/seller.model';

/**
 * This functions is used to authenticate a seller.
 * @param schema User role: USERROLETYPE.seller | USERROLETYPE.buyer | undefined
 * authenticateSeller() for all type of seller common
 * @returns a express middleware function
 */

const authenticateSeller =
    (role?: USERROLETYPE) =>
        async (req: Request, res: Response, next: NextFunction) => {
            const ref_token = req.cookies['jid'];
            if (!ref_token) {
                return res
                    .status(HTTP_STATUS_CODE.UNAUTHORIZED)
                    .json(errorResponse(ERROR_MESSAGE.UNAUTHORIZED));
            }
            try {
                const ref_token_decoded = await verifySellerRJwt(ref_token);
                const token = req.headers.authorization?.split(' ')[1];
                if (!token) {
                    return res
                        .status(HTTP_STATUS_CODE.UNAUTHORIZED)
                        .json(errorResponse(ERROR_MESSAGE.UNAUTHORIZED));
                }

                const { decoded, expired, valid } = await verifySellerJwt(token);
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
                res.locals.seller = decoded;
                const currentAdminData = await SellerModel.findById({
                    _id: decoded.userID,
                });
                res.locals.seller.data = currentAdminData;
                logger.info(
                    `ADMIN ROUTES WERE ACCESSED\n ${currentAdminData?.email} | ${currentAdminData?.role}`,
                );
                const refTokenVersion = ref_token_decoded.decoded.tokenVersion;
                // get currentUser data
                // compare tokenVersion
                if (
                    currentAdminData?.tokenVersion !== refTokenVersion ||
                    currentAdminData?.tokenVersion !== decoded.tokenVersion
                ) {
                    return res
                        .status(HTTP_STATUS_CODE.UNAUTHORIZED)
                        .json(errorResponse(ERROR_MESSAGE.UNAUTHORIZED));
                }
                // if somehow above checks were dodged
                if (role === 'buyer') {
                    logger.warn(
                        `⚡Secure your backend,\n ${currentAdminData?.email} made an Unauthorized attempt!!`,
                    );
                    return res
                        .status(HTTP_STATUS_CODE.UNAUTHORIZED)
                        .json(errorResponse('🦴You shall not pass❌'));
                }
                if (!role) return next();
                if (role !== decoded.role)
                    return res.send('Unauthorized').status(401);
                return next();
            } catch (error) {
                logger.error(error);
                return res
                    .status(HTTP_STATUS_CODE.INTERNAL_SERVER)
                    .json(errorResponse('Admin Authentication failed...'));
            }
        };

export default authenticateSeller;