/**********************************************************************
 * Changelog
 * All notable changes to this project will be documented in this file.
 **********************************************************************
 *
 * Author            : Deshmukh P
 *
 * Date created      : 10/01/2023
 *
 * Purpose			 : API Success and Error Response Function
 *********************************************************************
 */
/** Error Response Function
 *
 * @param message - Error Response Message
 */
const errorResponse = (message: string) => {
    return { status: 'error', message };
};
/** Success Response Function
 *
 * @param message -   Success Response Message
 * @param data    -   Success Response Data
 */
const successResponse = (message: string) => {
    return { status: 'success', message };
};
export { errorResponse, successResponse };