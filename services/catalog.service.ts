/**********************************************************************
 * Changelog
 * All notable changes to this project will be documented in this file.
 **********************************************************************
 *
 * Author            : Deshmukh P
 *
 * Date created      : 10/01/2023
 *
 * Purpose           : Database Catalog Services
 **********************************************************************
 */
import { SellerDocument, SellerModel } from '../models/seller.model';
import { CatalogDocument, CatalogModel } from '../models/catalog.model'
import { DocumentDefinition, FilterQuery } from 'mongoose';
import { logger } from '../utils/logger/loggerUtil';

export const createCatalog = async (
    input: DocumentDefinition<
        Omit<
            CatalogDocument,
            'updatedAt' | 'createdAt'
        >
    >,
) => {
    try {
        const catalogExists = await CatalogModel.exists({
            seller_id: input.seller_id,
        });
        if (catalogExists) {
            throw new Error('Catalog already exists');
        }
        const catalog = new CatalogModel(input);
        await catalog.save();
        return true;
    } catch (error: any) {
        throw error;
    }
}

export const fetchOneCatalog = async (query: any, populate: string[] | string = '') => {
    try {
        return CatalogModel.findOne(query).populate(populate)
    } catch (error: any) {
        logger.error(error)
        throw error
    }
}

export const addNewProduct = async (
    query: FilterQuery<CatalogDocument> = {},
    set: any,
) => {
    try {
        return await CatalogModel.findOneAndUpdate(query, set, {
            new: true,
        });
    } catch (error: any) {
        logger.error(error)
        throw error
    }
}