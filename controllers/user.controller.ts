/**********************************************************************
 * Changelog
 * All notable changes to this project will be documented in this file.
 **********************************************************************
 *
 * Author            : Deshmukh P
 *
 * Date created      : 11/01/2023
 *
 * Purpose           : Users Controllers
 **********************************************************************
 */
import 'dotenv/config';
import { Request, Response } from 'express';
import fs from 'fs';
import { logger, dbLogger } from '../utils/logger/loggerUtil';
import { createUserSchema } from '../schema/user.schema';
import { ERROR_MESSAGE, HTTP_STATUS_CODE } from '../utils/const/constants';
import {
    successResponse,
    errorResponse,
} from '../utils/response/responseUtil';
import { DocumentDefinition } from 'mongoose';
import {
    UserDocument,
    UserModel,
    GEncryptedKey,
} from '../models/users.model';
import {
    createUser,
    invalidateJWT,
    validatePassword,
    findOneUser
} from '../services/user.service';
import { encrypt } from '../utils/crypto/encdecUtil';
import {
    createAccessToken,
    createRefreshToken,
    verifyJwt,
    verifyRJwt
} from '../utils/jwt/jwtUtil';
import { sendRefreshToken } from '../utils/jwt/sendRefreshToken';
import { fetchOneCatalog } from '../services/catalog.service';
import { createOrder } from '../services/order.service';
import { OrdersModel } from '../models/orders.model';
import { fetchAllSellers } from '../services/seller.service';

const metaS = 'core-user-actions';
/**
 * UNPROTECTED
 * Handler for creating/registering users
 * @param req
 * @param res
 * @returns 201 status on successful operation
 */
export const registerUserHandler = async (
    req: Request<
        unknown,
        unknown,
        DocumentDefinition<
            Omit<
                UserDocument,
                'updatedAt' | 'createdAt' | 'comparePassword'
            >
        >
    >,
    res: Response,
) => {
    try {
        const input = JSON.parse(JSON.stringify(req.body));

        input.phone_no = input.phone_no.toString();
        if (input.password.length < 6) {
            return res
                .status(HTTP_STATUS_CODE.BAD_REQUEST)
                .json({ message: 'Password length should be at least 6' });
        }
        // user schema validation
        const inputValidation = createUserSchema.safeParse({ body: input });

        // phone_no is now a string
        if (
            !inputValidation.success ||
            input.phone_no.toString().length < 10
        ) {
            logger.error(
                `Input Validation was - ${inputValidation.success
                } | phone_no check failed | ${JSON.stringify(inputValidation)}`,
            );
            return res
                .status(HTTP_STATUS_CODE.BAD_REQUEST)
                .json(errorResponse(JSON.parse(JSON.stringify(inputValidation))));
        }

        // create short name initials & attaching with input
        const fullName = input.name;
        const ain = fullName.split(' ');
        const fin = ain[0].split('');
        const sin = ain[1].split('');
        const nameInitials = fin[0].toUpperCase() + sin[0].toUpperCase();

        input.name_initials = nameInitials;

        // handle uppercase email extensions
        const splitEmail: Array<string> = input.email.split('@');
        splitEmail[1] = splitEmail[1].toLowerCase();
        input.email = splitEmail.join('@');

        const user = (await createUser(input)) as InstanceType<
            typeof UserModel
        >;
        // await createDepositAddresses(user._id);

        // if above checks passed, then provide access token for user
        // send refersh token as cookie
        // refresh & access token use different secret refer .env
        const ref_pd_to_encrypt: object = {
            userID: user._id,
            userEmail: user.email,
            tokenVersion: user.tokenVersion,
        };
        const UserRefreshInfo: GEncryptedKey = encrypt(
            JSON.stringify(ref_pd_to_encrypt),
            process.env.ACCESS_TOKEN_SECRET as string,
        );
        sendRefreshToken(res, createRefreshToken(UserRefreshInfo));

        // sending access token as response
        const pd_to_encrypt: object = {
            userID: user._id,
            userEmail: user.email,
            role: user.role,
            tokenVersion: user.tokenVersion,
        };
        // encrypting user info as metadata to be embeded in jwt token payload signature
        const UserInfo: GEncryptedKey = encrypt(
            JSON.stringify(pd_to_encrypt),
            process.env.ACCESS_TOKEN_SECRET as string,
        );
        const accessToken = await createAccessToken(UserInfo);

        //{ decoded, expired, valid }
        const { decoded } = await verifyJwt(accessToken);

        return res.status(HTTP_STATUS_CODE.CREATED).json({
            accessToken,
        });
    } catch (error: any) {
        logger.error(error);
        if (error.message.split(' ')[0] === 'E11000') {
            logger.error(error, 'Resource Conflict');
            return res
                .status(HTTP_STATUS_CODE.CONFLICT)
                .json(
                    errorResponse(
                        `${error.message.split(' ')[11]} is already in use`,
                    ),
                );
        }
        if (
            error.message ===
            "Cannot read properties of undefined (reading 'path')"
        ) {
            return res
                .status(HTTP_STATUS_CODE.INTERNAL_SERVER)
                .json(
                    errorResponse("key should be 'profilePicture' in form-data"),
                );
        }
        if (error.errno === -4058) {
            logger.error("No 'uploads' directory found locally....👀");
            return res
                .status(HTTP_STATUS_CODE.INTERNAL_SERVER)
                .json(errorResponse(error.message));
        }

        if (error.message.split(' ')[0] === 'ENOENT') {
            return res
                .status(HTTP_STATUS_CODE.INTERNAL_SERVER)
                .json(errorResponse(error.message));
        }
        return res
            .status(HTTP_STATUS_CODE.INTERNAL_SERVER)
            .json(errorResponse(error.message));
    }
};

/**
 * UNPROTECTED
 * Handler for validating email & password combo
 * @param req
 * @param res
 * @returns an accessToken in response (also sends refresh token as cookie jid)
 */
export const loginUserHandler = async (
    req: Request<
        unknown,
        unknown,
        { email: 'string'; password: 'string' },
        unknown
    >,
    res: Response,
) => {
    try {
        if (!req.body.email || !req.body.password) {
            logger.error('missing email,password in request body');
            return res
                .status(HTTP_STATUS_CODE.BAD_REQUEST)
                .json(errorResponse(ERROR_MESSAGE.REQUIRED_PARAMETERS_MISSING));
        }
        const user = await UserModel.findOne({
            email: req.body.email,
        });

        const validPass = await validatePassword(req.body);
        if (!validPass) {
            return res
                .status(HTTP_STATUS_CODE.UNAUTHORIZED)
                .json({ message: 'Incorrect Email/Password was provided' });
        }

        // user not found in db
        if (!user) {
            logger.error('user not found in db');
            return res
                .status(HTTP_STATUS_CODE.UNAUTHORIZED)
                .json(errorResponse(`No user exists with ${req.body.email}`));
        }

        // if above checks passed, then provide access token for user
        // send refersh token as cookie
        // refresh & access token use different secret refer .env
        const ref_pd_to_encrypt: object = {
            userID: user._id,
            userEmail: user.email,
            tokenVersion: user.tokenVersion,
        };
        const UserRefreshInfo: GEncryptedKey = encrypt(
            JSON.stringify(ref_pd_to_encrypt),
            process.env.ACCESS_TOKEN_SECRET as string,
        );
        sendRefreshToken(res, createRefreshToken(UserRefreshInfo));

        // sending access token as response
        const pd_to_encrypt: object = {
            userID: user._id,
            userEmail: user.email,
            role: user.role,
            tokenVersion: user.tokenVersion,
        };
        // encrypting user info as metadata to be embeded in jwt token payload signature
        const UserInfo: GEncryptedKey = encrypt(
            JSON.stringify(pd_to_encrypt),
            process.env.ACCESS_TOKEN_SECRET as string,
        );
        const accessToken = await createAccessToken(UserInfo);

        dbLogger.info('User logged in successfully', {
            metadata: {
                metaService: `${metaS}`,
                By: `${req.body.email}`,
                viaOTP: false,
            },
        });
        // sending access token as response
        return res.status(HTTP_STATUS_CODE.OK).json({
            accessToken: accessToken,
        });
    } catch (error: any) {
        logger.error(error.message);
        if (error.message === "Cannot read property 'isActive' of null") {
            return res
                .status(HTTP_STATUS_CODE.NOT_FOUND)
                .json(errorResponse('No user registered with this email...'));
        }
        return res
            .status(HTTP_STATUS_CODE.INTERNAL_SERVER)
            .json(errorResponse(ERROR_MESSAGE.INTERNAL_SERVER_ERROR));
    }
};

/**
 * PROTECTED
 * Handler for logging out user invalidates access & refresh token
 * @param req
 * @param res
 * @returns an accessToken in response (also sends refresh token as cookie jid)
 */
export const logoutUserHandler = async (
    req: Request<unknown, unknown, { email: 'string' }, unknown>,
    res: Response,
) => {
    if (!req.body.email) {
        return res
            .status(HTTP_STATUS_CODE.FORBIDDEN)
            .json(errorResponse('required payload missing in request body....'));
    }
    if (res.locals.user.userEmail !== req.body.email) {
        return res
            .status(HTTP_STATUS_CODE.UNAUTHORIZED)
            .json(errorResponse(ERROR_MESSAGE.UNAUTHORIZED));
    }
    const currentUser = res.locals.user.userID;
    const ref_token = req.cookies['jid'];
    if (!ref_token) {
        return res
            .status(HTTP_STATUS_CODE.UNAUTHORIZED)
            .json(errorResponse(ERROR_MESSAGE.UNAUTHORIZED));
    }
    try {
        const userD = res.locals.user.data;
        if (!userD) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
                message: `User not found with this email:${req.body.email}`,
            });
        }
        // flow
        const ref_token_decoded = await verifyRJwt(ref_token);
        // assume they are logged in
        const reso = await invalidateJWT(
            { _id: currentUser },
            { $inc: { tokenVersion: 1 } },
        );
        if (reso?.tokenVersion === ref_token_decoded.decoded.tokenVersion) {
            logger.warn(
                `${req.body.email} was not logged out...DB update could not happen`,
            );
            return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json({
                message: `User with email:${req.body.email} logout failed`,
                loggedOut: false,
            });
        }
        return res.status(200).json({
            message: `${res.locals.user.userEmail} successfully logged out`,
            user: res.locals.user.userEmail,
            loggedOut: true,
        });
    } catch (error: any) {
        logger.error(error.message);
        return res
            .status(HTTP_STATUS_CODE.INTERNAL_SERVER)
            .json(errorResponse(ERROR_MESSAGE.INTERNAL_SERVER_ERROR));
    }
};

export const fetchSellerCatalog = async (
    req: Request,
    res: Response,
) => {
    try {
        const catalog = await fetchOneCatalog({ seller_id: req.params.sellerID })
        return res
            .status(HTTP_STATUS_CODE.OK)
            .json({
                data: catalog?.products
            })
    } catch (error) {
        logger.error(error.message);
        return res
            .status(HTTP_STATUS_CODE.INTERNAL_SERVER)
            .json(errorResponse(ERROR_MESSAGE.INTERNAL_SERVER_ERROR));
    }
}

export const placeOrder = async (
    req: Request,
    res: Response,
) => {
    try {
        const input = req.body
        const order = (await createOrder(input)) as unknown as InstanceType<
            typeof OrdersModel
        >;
        if (order) {
            return res
                .status(HTTP_STATUS_CODE.CREATED)
                .json(successResponse('Order placed successfully'))
        }
        return res
            .status(HTTP_STATUS_CODE.INTERNAL_SERVER)
            .json(errorResponse(ERROR_MESSAGE.INTERNAL_SERVER_ERROR));
    } catch (error) {
        logger.error(error.message);
        return res
            .status(HTTP_STATUS_CODE.INTERNAL_SERVER)
            .json(errorResponse(ERROR_MESSAGE.INTERNAL_SERVER_ERROR));
    }
}

export const fetchSellers = async (
    req: Request,
    res: Response,
) => {
    try {
        const sellers = await fetchAllSellers();
        return res
            .status(HTTP_STATUS_CODE.OK)
            .json({
                data: sellers
            })
    } catch (error) {
        logger.error(error.message);
        return res
            .status(HTTP_STATUS_CODE.INTERNAL_SERVER)
            .json(errorResponse(ERROR_MESSAGE.INTERNAL_SERVER_ERROR));
    }
}