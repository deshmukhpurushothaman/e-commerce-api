/**********************************************************************
 * Changelog
 * All notable changes to this project will be documented in this file.
 **********************************************************************
 *
 * Author            : Deshmukh P
 *
 * Date created      : 10/01/2023
 *
 * Purpose           : Sellers Model
 **********************************************************************
 */
import { Schema, Document, model } from 'mongoose';
import bcrypt from 'bcryptjs';
import 'dotenv/config';
import { USERROLETYPE } from './users.model';

export interface GEncryptedKey {
    iv: string;
    content: string;
}

//mongoose enum
const USERROLE = [USERROLETYPE.seller, USERROLETYPE.buyer];

export interface SellerDocument extends Document {
    name: string;
    name_initials?: string;
    email: string;
    password: string;
    role?: USERROLETYPE;
    phone_no: string;
    tokenVersion?: number;
    termTokenVersion?: number;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(userPassword: string): Promise<boolean>;
}

//  Sellers Schema
export const sellersSchema = new Schema<SellerDocument>(
    {
        name: { type: String, required: true },
        name_initials: { type: String, required: false, unique: false },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true, select: false },
        role: { type: String, enum: USERROLE, default: USERROLETYPE.seller },
        phone_no: { type: String, required: true, unique: true, sparse: true },
        tokenVersion: { type: Number, default: 0, unique: false },
        termTokenVersion: { type: Number, default: 0, unique: false },
    },
    {
        timestamps: true,
    },
);

// Pre-hook to save and store hashed passwords in DB
sellersSchema.pre('save', async function (next) {
    const seller = this as SellerDocument;

    if (seller.isModified('password')) {
        const salt = await bcrypt.genSalt(
            parseInt(process.env.saltWorkFactor as string),
        );
        const hash = await bcrypt.hashSync(seller.password, salt);
        seller.password = hash;
    }

    return next();
});
// Mongoose instance method
sellersSchema.methods.comparePassword = async function (
    sellerPassword: string,
): Promise<boolean> {
    const seller = this as SellerDocument;

    return bcrypt.compare(sellerPassword, seller.password).catch(() => false);
};

export const SellerModel = model<SellerDocument>(
    'Seller',
    sellersSchema,
);