/**********************************************************************
 * Changelog
 * All notable changes to this project will be documented in this file.
 **********************************************************************
 *
 * Author            : Deshmukh P
 *
 * Date created      : 10/01/2023
 *
 * Purpose           : Users Model
 **********************************************************************
 */
import { Schema, Document, model } from 'mongoose';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

export interface GEncryptedKey {
    iv: string;
    content: string;
}

//typescript const enum
export enum USERROLETYPE {
    seller = 'seller',
    buyer = 'buyer',
}

// reasons counter
interface flReasonCounter {
    wrong_pass: number;
    max_attempts_exceeded: number;
}

//mongoose enum
const USERROLE = [USERROLETYPE.seller, USERROLETYPE.buyer];

export interface UserDocument extends Document {
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

//  Users Schema
export const usersSchema = new Schema<UserDocument>(
    {
        name: { type: String, required: true },
        name_initials: { type: String, required: false, unique: false },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true, select: false },
        role: { type: String, enum: USERROLE, default: USERROLETYPE.buyer },
        phone_no: { type: String, required: true, unique: true, sparse: true },
        tokenVersion: { type: Number, default: 0, unique: false },
        termTokenVersion: { type: Number, default: 0, unique: false },
    },
    {
        timestamps: true,
    },
);

// Pre-hook to save and store hashed passwords in DB
usersSchema.pre('save', async function (next) {
    const user = this as UserDocument;

    if (user.isModified('password')) {
        const salt = await bcrypt.genSalt(
            parseInt(process.env.saltWorkFactor as string),
        );
        const hash = await bcrypt.hashSync(user.password, salt);
        user.password = hash;
    }

    return next();
});
// Mongoose instance method
usersSchema.methods.comparePassword = async function (
    userPassword: string,
): Promise<boolean> {
    const user = this as UserDocument;

    return bcrypt.compare(userPassword, user.password).catch(() => false);
};

export const UserModel = model<UserDocument>(
    'User',
    usersSchema,
);