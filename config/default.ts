/**********************************************************************
 * Changelog
 * All notable changes to this project will be documented in this file.
 **********************************************************************
 *
 * Author            : Deshmukh P
 *
 * Date created      : 10/01/2023
 *
 * Purpose           : Contains configurable key-value pairs
 **********************************************************************
 */

const {
    NODE_ENV,
    DB_HOSTNAME, DB_USERNAME, DB_PASSWORD, DB_NAME,
    PORT, HOST,
    REACT_APP_HOST,
    ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME,
    smtpEmail, smtpPassword,
} = process.env
export default {
    // CORE configs
    NODE_ENV: NODE_ENV,
    host: HOST || "http://localhost",
    port: PORT,
    // DB configs
    dbHost: DB_HOSTNAME,
    dbUserName: DB_USERNAME,
    dbPassword: DB_PASSWORD,
    dbName: DB_NAME,
    // Hashing password configs
    saltWorkFactor: 10,
    // JWT configs
    accessTokenTtl: "15m",
    refreshTokenTtl: "7d",
    adminAccessTokenTtl: "1d",
    verifyTokenTtl: "5m",
    // SMTP configs
    smtpEmail: smtpEmail,
    smtpPassword: smtpPassword,
    // First admin email credentials
    adminEmail: ADMIN_EMAIL || "deshmukh@test.com",
    adminPassword: ADMIN_PASSWORD || "deshmukh123",
    adminName: ADMIN_NAME || "ADMIN",
    // frontend url
    REACT_APP_HOST: REACT_APP_HOST,
    // Backend logs
    LOG_FILE_PATH: "./logger.log",
    LOG_API_EXCEPTIONS: "./logger-exceptions.log",
}