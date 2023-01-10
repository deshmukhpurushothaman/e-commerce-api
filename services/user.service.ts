/**********************************************************************
 * Changelog
 * All notable changes to this project will be documented in this file.
 **********************************************************************
 *
 * Author            : Deshmukh P
 *
 * Date created      : 10/01/2023
 *
 * Purpose           : Database User Services
 **********************************************************************
 */
import { omit } from 'lodash';
import { DocumentDefinition, FilterQuery } from 'mongoose';
import { dbLogger, logger } from '../utils/logger/loggerUtil';
import {
    UserDocument,
    UserModel,
} from '../models/users.model';
import { SellerModel } from '../models/seller.model';

// creates & stores new user in DB
export async function createUser(
    input: DocumentDefinition<
        Omit<
            UserDocument,
            'updatedAt' | 'createdAt' | 'comparePassword'
        >
    >,
) {
    try {
        const sellerWithEmailExists = await SellerModel.exists({
            email: input.email,
        });
        if (sellerWithEmailExists) {
            throw new Error(`Email already exists`);
        }
        const user = await new UserModel(input);
        await user.save();
        return omit(user.toJSON(), 'password');
    } catch (error: any) {
        throw error;
    }
}

// validate password
export async function validatePassword({
    email,
    password,
}: {
    email: string;
    password: string;
}) {
    try {
        const user = await UserModel.findOne({
            email: `${email}`,
        }).select('email password');

        // user not found in db
        if (!user) {
            logger.error('user not found in db');
            dbLogger.warn('Not Found', {
                metadata: {
                    metaService: `validating-password-service`,
                    resolution: `User not found in db`,
                },
            });
            return false;
        }

        // compare candidate password with stored password
        const isValid = await user.comparePassword(password);

        // password is wrong
        if (!isValid) {
            return false;
        }
        // everything is sorted
        return omit(user.toJSON(), 'password');
    } catch (error: any) {
        logger.error(error);
        throw error;
    }
}

export async function findOneUser(
    query: FilterQuery<UserDocument> = {},
    fields?: string
) {
    try {
        return await UserModel.findOne(query)
            // .select(
            //     '-updatedAt -createdAt -tokenVersion -__v -_id',
            // )
            .select(fields)
            .lean();
    } catch (error) {
        throw error;
    }
}

export async function updateUser(
    query: FilterQuery<UserDocument> = {},
    set: any,
) {
    try {
        return await UserModel.findOneAndUpdate(query, set, {
            new: true,
        });
    } catch (error) {
        throw error;
    }
}

/**
 * Updates tokenVersion for user
 * @returns
 */
export const invalidateJWT = async (query: any, inc: any) => {
    try {
        return await UserModel.findOneAndUpdate(query, inc, {
            new: true,
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};