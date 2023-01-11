/**********************************************************************
 * Changelog
 * All notable changes to this project will be documented in this file.
 **********************************************************************
 *
 * Author            : Deshmukh P
 *
 * Date created      : 01/01/2023
 *
 * Purpose           : jwt utils to create access & refresh tokens along with email OTP tokens creation & validation
 **********************************************************************
 */
import { GEncryptedKey } from '../../models/users.model';
import { JwtPayload, sign, verify } from 'jsonwebtoken';
import 'dotenv/config';
import { logger } from '../../utils/logger/loggerUtil';
import { decrypt } from '../crypto/encdecUtil';

// 🎈 can also change the jwt secret for seller so that it is different from user
export const createSellerAccessToken = (meta_data: GEncryptedKey) => {
    const accTokens = sign(
        {
            meta_data,
        },
        process.env.SELLER_JWT_SIGNING_SECRET as string,
        { expiresIn: process.env.sellerAccessTokenTtl as string },
    );
    return accTokens;
};
export const createAccessToken = async (meta_data: GEncryptedKey) => {
    const accTokens = sign(
        {
            meta_data,
        },
        process.env.JWT_SIGNING_SECRET as string,
        { expiresIn: process.env.accessTokenTtl as string },
    );
    return accTokens;
};
export const createVerificationToken = (meta_data: GEncryptedKey) => {
    return sign(
        {
            meta_data,
        },
        process.env.JWT_EMAILVERIFY_SECRET as string,
        // valid for 5 minutes only
        { expiresIn: process.env.verifyTokenTtl as string },
    );
};
export const createlogoutToken = (meta_data: GEncryptedKey) => {
    return sign(
        {
            meta_data,
        },
        process.env.JWT_EMAILVERIFY_SECRET as string,
        //valid for 5 minutes only
        { expiresIn: process.env.verifyTokenTtl as string },
    );
};
export const createRefreshToken = (meta_data: GEncryptedKey) => {
    return sign(
        {
            meta_data,
        },
        process.env.REFRESH_SIGNING_SECRET as string,
        { expiresIn: process.env.refreshTokenTtl as string },
    );
};
export const createSellerRefreshToken = (meta_data: GEncryptedKey) => {
    return sign(
        {
            meta_data,
        },
        process.env.SELLER_REFRESH_SIGNING_SECRET as string,
        { expiresIn: process.env.sellerrefreshTokenTtl as string },
    );
};

/**==============USER=============== */
export const verifyJwt = async (token: string) => {
    try {
        const decodedFPD = verify(
            token,
            process.env.JWT_SIGNING_SECRET as string,
        ) as JwtPayload;
        const decoded = await reattachMetaData(decodedFPD);
        return {
            valid: true,
            expired: false,
            decoded,
        };
    } catch (e: any) {
        logger.error(e);
        return {
            valid: false,
            expired: true,
            decoded: null,
        };
    }
};
export const verifyJwtEmailToken = async (token: string) => {
    try {
        const decodedFPD = verify(
            token,
            process.env.JWT_EMAILVERIFY_SECRET as string,
        ) as JwtPayload;
        const decoded = await reattachMetaData(decodedFPD);
        return {
            valid: true,
            expired: false,
            decoded,
        };
    } catch (e: any) {
        logger.error(e);
        return {
            valid: false,
            expired: true,
            decoded: null,
        };
    }
};
export const verifyRJwt = async (token: string) => {
    try {
        const decodedFPD = verify(
            token,
            process.env.REFRESH_SIGNING_SECRET as string,
        ) as JwtPayload;
        const decoded = await reattachMetaData2(decodedFPD);
        return {
            valid: true,
            expired: false,
            decoded,
        };
    } catch (e: any) {
        logger.error(e);
        return {
            valid: false,
            expired: true,
            decoded: null,
        };
    }
};

/**=================SELLERS=================== */
export const verifySellerJwt = async (token: string) => {
    try {
        // verify JWT token
        const decodedFPD: any = verify(
            token,
            process.env.SELLER_JWT_SIGNING_SECRET as string,
        ) as JwtPayload;
        // decrypt metadata from jwt pd
        const decoded = await reattachMetaData(decodedFPD);
        return {
            valid: true,
            expired: false,
            decoded,
        };
    } catch (e: any) {
        logger.error(e);
        return {
            valid: false,
            expired: true,
            decoded: null,
        };
    }
};

export const verifySellerRJwt = async (token: string) => {
    try {
        const decodedFPD = verify(
            token,
            process.env.SELLER_REFRESH_SIGNING_SECRET as string,
        ) as JwtPayload;
        const decoded = await reattachMetaData2(decodedFPD);
        return {
            valid: true,
            expired: false,
            decoded,
        };
    } catch (e: any) {
        logger.error(e);
        return {
            valid: false,
            expired: true,
            decoded: null,
        };
    }
};

export const verifyEmailJwt = (token: string) => {
    try {
        const decoded = verify(
            token,
            process.env.JWT_EMAILVERIFY_SECRET as string,
        ) as JwtPayload;
        return {
            valid: true,
            expired: false,
            decoded,
        };
    } catch (e: any) {
        logger.error(e);
        return {
            valid: false,
            expired: e.message === 'jwt expired',
            decoded: null,
        };
    }
};

/**@desc utils for attaching decrypted decoded pd [access tokens] */
const reattachMetaData = (decodedEncData: any) => {
    const decMetaData: any = decrypt(
        decodedEncData.meta_data,
        process.env.ACCESS_TOKEN_SECRET as string,
    );
    const parsedDecData = JSON.parse(decMetaData);
    decodedEncData.userID = parsedDecData.userID;
    decodedEncData.userEmail = parsedDecData.userEmail;
    decodedEncData.role = parsedDecData.role;
    decodedEncData.tokenVersion = parsedDecData.tokenVersion;
    return decodedEncData;
};

/**@desc utils for attaching decrypted decoded pd [refresh tokens] */
const reattachMetaData2 = (decodedEncData: any) => {
    const decMetaData: any = decrypt(
        decodedEncData.meta_data,
        process.env.ACCESS_TOKEN_SECRET as string,
    );
    const parsedDecData = JSON.parse(decMetaData);
    decodedEncData.userID = parsedDecData.userID;
    decodedEncData.userEmail = parsedDecData.userEmail;
    decodedEncData.tokenVersion = parsedDecData.tokenVersion;
    return decodedEncData;
};