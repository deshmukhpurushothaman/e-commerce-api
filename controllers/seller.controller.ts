/**********************************************************************
 * Changelog
 * All notable changes to this project will be documented in this file.
 **********************************************************************
 *
 * Author            : Deshmukh P
 *
 * Date created      : 10/01/2023
 *
 * Purpose           : Seller Controllers
 **********************************************************************
 */
import { Request, Response } from 'express';
import { logger, dbLogger } from '../utils/logger/loggerUtil';
import { ERROR_MESSAGE, HTTP_STATUS_CODE } from '../utils/const/constants';
import {
    errorResponse,
    successResponse,
} from '../utils/response/responseUtil';
import { DocumentDefinition, FilterQuery, SortValues } from 'mongoose';
import {
    SellerDocument,
    SellerModel,
} from '../models/seller.model';
import {
    createSellerAccessToken,
    createSellerRefreshToken,
    createlogoutToken,
    verifySellerJwt,
    verifySellerRJwt,
    //verifyJwt,
    verifyJwtEmailToken,
} from '../utils/jwt/jwtUtil';
import sanitizePayload from '../utils/misc/sanitize';
import { sendRefreshToken } from '../utils/jwt/sendRefreshToken';
import { encrypt } from '../utils/crypto/encdecUtil';
import { GEncryptedKey } from '../models/users.model';
import { createSeller, fetchAllSellers, findOneSeller, invalidateSellerJWT, validateSellerPassword } from '../services/seller.service';
import { createUserSchema } from '../schema/user.schema';
import { addNewProduct, fetchOneCatalog } from '../services/catalog.service';
import { fetchSellerOrders } from '../services/order.service';

const metaS = 'core-seller-actions';

/**
 * UNPROTECTED
 * Handler for creating/registering users
 * @param req
 * @param res
 * @returns 201 status on successful operation
 */
export const registerSellerHandler = async (
    req: Request<
        unknown,
        unknown,
        DocumentDefinition<
            Omit<
                SellerDocument,
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

        const user = (await createSeller(input)) as unknown as InstanceType<
            typeof SellerModel
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
        sendRefreshToken(res, createSellerRefreshToken(UserRefreshInfo));

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
        const accessToken = await createSellerAccessToken(UserInfo);

        //{ decoded, expired, valid }
        const { decoded } = await verifySellerJwt(accessToken);

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
 * Handler for validating email & password combo for seller
 * @param req
 * @param res
 * @returns an accessToken in response
 */
export const loginSellerHandler = async (
    req: Request<
        unknown,
        unknown,
        { email: 'string'; password: 'string' },
        unknown
    >,
    res: Response,
) => {
    try {
        const { message, cleanPD } = await sanitizePayload(req.body);
        if (message === 'success') {
            req.body = cleanPD;
        }
        if (message === 'failed') {
            req.body = req.body;
        }
        if (!req.body.email || !req.body.password) {
            logger.error('missing email,password in request body');
            return res
                .status(HTTP_STATUS_CODE.BAD_REQUEST)
                .json(errorResponse(ERROR_MESSAGE.REQUIRED_PARAMETERS_MISSING));
        }
        const seller = await SellerModel.findOne({
            email: req.body.email,
        });
        const validPass = await validateSellerPassword(req.body);
        if (!validPass) {
            return res
                .status(HTTP_STATUS_CODE.UNAUTHORIZED)
                .json(errorResponse(ERROR_MESSAGE.UNAUTHORIZED));
        }

        // user not found in db
        if (!seller) {
            logger.error('seller not found in db');
            return res
                .status(HTTP_STATUS_CODE.UNAUTHORIZED)
                .json(errorResponse(`seller do not exists with ${req.body.email}`));
        }

        // if above checks passed, then provide access token for user
        // send refresh token as cookie
        // refresh & access token use different secret refer .env
        const ref_pd_to_encrypt: object = {
            userID: seller._id,
            userEmail: seller.email,
            tokenVersion: seller.tokenVersion,
        };
        const UserRefreshInfo: GEncryptedKey = encrypt(
            JSON.stringify(ref_pd_to_encrypt),
            process.env.ACCESS_TOKEN_SECRET as string,
        );
        sendRefreshToken(res, createSellerRefreshToken(UserRefreshInfo));

        // sending access token as response
        const pd_to_encrypt: object = {
            userID: seller._id,
            userEmail: seller.email,
            role: seller.role,
            tokenVersion: seller.tokenVersion,
        };
        // user info as metadata to be embeded in jwt token payload signature
        const UserInfo: GEncryptedKey = encrypt(
            JSON.stringify(pd_to_encrypt),
            process.env.ACCESS_TOKEN_SECRET as string,
        );
        const accessToken = createSellerAccessToken(UserInfo);

        dbLogger.info('seller logged in successfully', {
            metadata: {
                metaService: `${metaS}`,
                By: `${seller.email}`,
                viaOTP: true,
            },
        });
        // sending access token as response
        return res.status(HTTP_STATUS_CODE.OK).json({
            accessToken: accessToken,
        });
    } catch (error: any) {
        logger.error(error.message);
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
export const logoutSellerHandler = async (
    req: Request<unknown, unknown, { email: 'string' }, unknown>,
    res: Response,
) => {
    if (!req.body.email) {
        return res
            .status(HTTP_STATUS_CODE.FORBIDDEN)
            .json(errorResponse('required payload missing in request body....'));
    }
    if (res.locals.seller.userEmail !== req.body.email) {
        return res
            .status(HTTP_STATUS_CODE.UNAUTHORIZED)
            .json(errorResponse(ERROR_MESSAGE.UNAUTHORIZED));
    }
    const ref_token = req.cookies['jid'];
    if (!ref_token) {
        return res
            .status(HTTP_STATUS_CODE.UNAUTHORIZED)
            .json(errorResponse(ERROR_MESSAGE.UNAUTHORIZED));
    }
    try {
        const currentSeller = res.locals.seller.data;
        if (!currentSeller) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
                message: `User not found with this email:${req.body.email}`,
            });
        }
        // flow
        const ref_token_decoded = await verifySellerRJwt(ref_token);
        // assume they are logged in
        const reso = await invalidateSellerJWT(
            { _id: currentSeller._id },
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
            message: `${res.locals.seller.userEmail} successfully logged out`,
            user: res.locals.seller.userEmail,
            loggedOut: true,
        });
    } catch (error: any) {
        logger.error(error.message);
        return res
            .status(HTTP_STATUS_CODE.INTERNAL_SERVER)
            .json(errorResponse(ERROR_MESSAGE.INTERNAL_SERVER_ERROR));
    }
};

/**
 * PROTECTED
 * userAuth middleware to validate ACCESS_TOKEN
 * fetches current user details
 * @param req
 * @param res
 * @returns res object with users with 200 statusCode on success
 */
export const sellerwhoamIRouteHandler = async (
    req: Request,
    res: Response,
) => {
    try {
        const sellerDetails = await findOneSeller({
            _id: res.locals.seller.userID,
        });
        return res.status(HTTP_STATUS_CODE.OK).json(sellerDetails);
    } catch (error: any) {
        logger.error(error.message);
        return res
            .status(HTTP_STATUS_CODE.INTERNAL_SERVER)
            .json(errorResponse(ERROR_MESSAGE.INTERNAL_SERVER_ERROR));
    }
};

export const addProduct = async (
    req: Request,
    res: Response,
) => {
    try {
        const productExists = await fetchOneCatalog(
            {
                seller_id: res.locals.seller.userID,
                'products.$.name': req.body.name
            }
        )

        if (productExists) {
            logger.error('Product already exists');
            return res.status(HTTP_STATUS_CODE.CONFLICT)
                .json(errorResponse('Product already exists'))
        }
        const newProduct = await addNewProduct(
            {
                seller_id: res.locals.seller.userID,
            },
            {
                '$push': {
                    products: {
                        name: req.body.name,
                        price: req.body.price
                    }
                }
            }
        )

        if (newProduct) {
            return res
                .status(HTTP_STATUS_CODE.OK)
                .json(successResponse('Product created'))
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



export const fetchOrders = async (
    req: Request,
    res: Response,
) => {
    try {
        const orders = await fetchSellerOrders({ seller_id: res.locals.seller.userID });
        if (orders) {
            return res
                .status(HTTP_STATUS_CODE.OK)
                .json({
                    data: orders
                })
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