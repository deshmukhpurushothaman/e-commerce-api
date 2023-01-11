/**********************************************************************
 * Changelog
 * All notable changes to this project will be documented in this file.
 **********************************************************************
 *
 * Author            : Deshmukh P
 *
 * Date created      : 11/01/2023
 *
 * Purpose           : Catalog Input/Edit Schema
 **********************************************************************
 */
import { any, object, string, boolean, number } from 'zod';

export const createCatalogSchema = object({
    body: object({
        product: object({})
    })
})