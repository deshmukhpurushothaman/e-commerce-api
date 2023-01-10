/**********************************************************************
 * Changelog
 * All notable changes to this project will be documented in this file.
 **********************************************************************
 *
 * Author            : Deshmukh P
 *
 * Date created      : 10/01/2023
 *
 * Purpose           : Orders Model
 **********************************************************************
 */
import { Schema, Document, model } from 'mongoose';
import 'dotenv/config';

export interface OrderDocument extends Document {
    seller_id: Schema.Types.ObjectId;
    seller_email: string;
    buyer_id: Schema.Types.ObjectId;
    buyer_email: string;
    orders: Array<Object>;
    createdAt: Date;
    updatedAt: Date;
}

export const OrderSchema = new Schema<OrderDocument>({
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
    buyer_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        unique: false,
        required: false,
    },
    buyer_email: {
        type: String,
        unique: false,
        required: true,
    },
    orders: [
        {
            name: { type: String, required: true, unique: false },
            quantity: { type: Number, required: true, unique: false },
            price: { type: Number, required: true, unique: false },
        },
    ],
},
    {
        timestamps: true,
    }
)