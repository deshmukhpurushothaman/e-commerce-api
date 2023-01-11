/**********************************************************************
 * Changelog
 * All notable changes to this project will be documented in this file.
 **********************************************************************
 *
 * Author            : Deshmukh P
 *
 * Date created      : 11/01/2023
 *
 * Purpose           : Users Routes
 **********************************************************************
 */
import express from 'express';
import {
    registerUserHandler,
    loginUserHandler,
    logoutUserHandler,
    fetchSellerCatalog,
    placeOrder,
    fetchSellers
} from '../controllers/user.controller';
import authenticate from '../middlewares/authenticate';
import { USERROLETYPE } from '../models/users.model'

const router = express.Router();

// REGISTER
router.post(
    '/register',
    registerUserHandler,
);

// LOGIN user
router.post(
    '/login',
    loginUserHandler,
);

router.post(
    '/logout',
    // logoutUserLimiter,
    authenticate(USERROLETYPE.buyer),
    logoutUserHandler,
);

router.get(
    '/catalog/:sellerID',
    authenticate(USERROLETYPE.buyer),
    fetchSellerCatalog,
);

router.get(
    '/sellers',
    authenticate(USERROLETYPE.buyer),
    fetchSellers
);

router.post(
    '/order',
    authenticate(USERROLETYPE.buyer),
    placeOrder
);

export default router