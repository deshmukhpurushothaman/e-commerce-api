/**********************************************************************
 * Changelog
 * All notable changes to this project will be documented in this file.
 **********************************************************************
 *
 * Author            : Deshmukh P
 *
 * Date created      : 10/01/2023
 *
 * Purpose           : Database Order Services
 **********************************************************************
 */
import { SellerDocument, SellerModel } from '../models/seller.model';
import { CatalogDocument, CatalogModel } from '../models/catalog.model'
import { OrdersDocument, OrdersModel } from '../models/orders.model'
import { DocumentDefinition, FilterQuery } from 'mongoose';
import { logger } from '../utils/logger/loggerUtil';

export const createOrder = async (
    input: DocumentDefinition<
        Omit<
            OrdersDocument,
            'updatedAt' | 'createdAt'
        >
    >,
) => {
    try {
        const order = new OrdersModel(input);
        await order.save();
        return true;
    } catch (error) {
        logger.error(error)
        return false
    }
}

export const fetchSellerOrders = async (query: any, populate: string[] | string = '') => {
    try {
        return await OrdersModel.find(query).populate(populate)
    } catch (error) {
        throw error
    }
}