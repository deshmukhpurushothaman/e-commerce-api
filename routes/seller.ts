/**********************************************************************
 * Changelog
 * All notable changes to this project will be documented in this file.
 **********************************************************************
 *
 * Author            : Deshmukh P
 *
 * Date created      : 11/01/2023
 *
 * Purpose           : Seller Routes
 **********************************************************************
 */
import express from 'express';
import { USERROLETYPE } from '../models/users.model';
import authenticateSeller from '../middlewares/sellerAuth';
import authenticate from '../middlewares/authenticate';
import {
    loginSellerHandler,
    logoutSellerHandler,
    sellerwhoamIRouteHandler,
    addProduct,
    fetchOrders,
    registerSellerHandler
} from '../controllers/seller.controller';

const router = express.Router();

// REGISTER
router.post(
    '/register',
    registerSellerHandler,
);

// LOGIN sellers (common)
router.post(
    '/login',
    loginSellerHandler,
);

/**Protected
 * common for all sellers
 */
router.post(
    '/logout',
    authenticateSeller(),
    logoutSellerHandler,
);

/** Protected
 * WHOAMI common for all sellers
 * */
router.get(
    '/whoami',
    authenticateSeller(),
    sellerwhoamIRouteHandler,
);

router.post(
    '/product/new',
    authenticateSeller(),
    addProduct
);

router.get(
    '/orders',
    authenticateSeller(),
    fetchOrders,
);

export default router