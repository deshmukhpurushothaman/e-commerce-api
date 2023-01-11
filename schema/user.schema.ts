/**********************************************************************
 * Changelog
 * All notable changes to this project will be documented in this file.
 **********************************************************************
 *
 * Author            : Deshmukh P
 *
 * Date created      : 11/01/2023
 *
 * Purpose           : User Input/Edit Schema
 **********************************************************************
 */
import { any, object, string, boolean, number } from 'zod';

export const createUserSchema = object({
    body: object({
        name: string({
            required_error: 'Name is required',
        }),
        email: string({
            required_error: 'Email is required',
        }).email('Not a valid email'),
        password: string({
            required_error: 'Password is required',
        }).min(6, 'Password too short - should be 6 chars minimum'),
        passwordConfirmation: string({
            required_error: 'passwordConfirmation is required',
        }),
        phone_no: string({
            required_error: 'phone_no is required',
        }),
    }).refine(
        (data: { password: any; passwordConfirmation: any }) =>
            data.password === data.passwordConfirmation,
        {
            message: 'Passwords do not match',
            path: ['passwordConfirmation'],
        },
    ),
});