/**********************************************************************
 * Changelog
 * All notable changes to this project will be documented in this file.
 **********************************************************************
 *
 * Author            : Deshmukh P
 *
 * Date created      : 10/01/2023
 *
 * Purpose           : Catalogs Model
 **********************************************************************
 */
import { Schema, Document, model } from 'mongoose';
import 'dotenv/config';

export interface CatalogDocument extends Document {
    seller_id: Schema.Types.ObjectId;
    seller_email: string;
    products?: Array<Object>;
    createdAt: Date;
    updatedAt: Date;
}

export const CatalogSchema = new Schema<CatalogDocument>(
    {
        seller_id: {
            type: Schema.Types.ObjectId,
            ref: 'Seller',
            unique: false,
            required: false,
        },
        seller_email: {
            type: String,
            unique: false,
            required: true,
        },
        products: [
            {
                name: { type: String, required: true, unique: false },
                price: { type: Number, required: true, unique: false },
            }
        ]
    },
    {
        timestamps: true
    }
)

export const CatalogModel = model<CatalogDocument>(
    'Catalog',
    CatalogSchema,
);