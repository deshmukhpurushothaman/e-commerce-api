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