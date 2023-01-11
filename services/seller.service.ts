/**********************************************************************
 * Changelog
 * All notable changes to this project will be documented in this file.
 **********************************************************************
 *
 * Author            : Deshmukh P
 *
 * Date created      : 10/01/2023
 *
 * Purpose           : Database Seller Services
 **********************************************************************
 */
import { SellerDocument, SellerModel } from '../models/seller.model';
import { UserModel } from '../models/users.model';
import { DocumentDefinition, FilterQuery } from 'mongoose';
import { logger } from '../utils/logger/loggerUtil';
import { omit } from 'lodash';

// 🎈creates & stores multiple admins in DB
export async function createSeller(
    input: DocumentDefinition<
        Omit<
            SellerDocument,
            'updatedAt' | 'createdAt' | 'comparePassword'
        >
    >,
) {
    try {
        // for prehook save hashing & comparing passwords need to save one by one
        const userWithEmailExists = await UserModel.exists({
            email: input.email,
        });
        if (userWithEmailExists) {
            throw new Error('Email already exists');
        }
        const seller = new SellerModel(input);
        await seller.save();
        return omit(seller.toJSON(), 'password');
    } catch (error: any) {
        throw error;
    }
}

export async function validateSellerPassword({
    email,
    password,
}: {
    email: string;
    password: string;
}) {
    try {
        const seller = await SellerModel.findOne({
            email: `${email}`,
        }).select('email password');
        // user not found in db
        if (!seller) {
            logger.error('seller not found in db');
            return false;
        }

        // compare candidate password with stored password
        const isValid = await seller.comparePassword(password);

        if (!isValid) {
            logger.error('compare password failed');
            return false;
        }
        return omit(seller.toJSON(), 'password');
    } catch (error: any) {
        logger.error(error);
        throw error;
    }
}

export async function findOneSeller(
    query: FilterQuery<SellerDocument> = {},
) {
    try {
        return await SellerModel.findOne(query)
            .select('-updatedAt -createdAt -tokenVersion -__v')
            .lean();
    } catch (error: any) {
        throw error;
    }
}

/**
 * Updates tokenVersion for admin
 * @returns
 */
export const invalidateSellerJWT = async (query: any, inc: any) => {
    try {
        return await SellerModel.findOneAndUpdate(query, inc, {
            new: true,
        });
    } catch (error: any) {
        logger.error(error);
        throw error;
    }
};

export const fetchAllSellers = async () => {
    try {
        return await SellerModel.find();
    } catch (error: any) {
        logger.error(error)
        throw error
    }
}