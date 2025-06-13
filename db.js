import mysql from 'mysql2/promise';

const {DB_HOST, DB_USER, DB_PASSWORD, DB_NAME} = process.env;

const connection = await mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    database: DB_NAME,
    password: DB_PASSWORD,
    // supportBigNumbers: true,
    // bigNumberStrings: true,
    // multipleStatements: true
});

export default connection;