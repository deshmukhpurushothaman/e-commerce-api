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
    createAdminAccessToken,
    createAdminRefreshToken,
    createlogoutToken,
    verifyAdminJwt,
    verifyAdminRJwt,
    //verifyJwt,
    verifyJwtEmailToken,
} from '../utils/jwt/jwtUtil';
import sanitizePayload from '../utils/misc/sanitize';
import { sendRefreshToken } from '../utils/jwt/sendRefreshToken';
import { encrypt } from '../utils/crypto/encdecUtil';
import { GEncryptedKey } from '../models/users.model';
import { findOneSeller, invalidateSellerJWT, validateSellerPassword } from '../services/seller.service';