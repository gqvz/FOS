import mysql from 'mysql2/promise';
import fs from 'fs';
const {DB_HOST, DB_USER, DB_PASSWORD, DB_NAME} = process.env;

let connection;

let attempts = 0;
while (attempts < 3) {
    try {
        connection = await mysql.createConnection({
            host: DB_HOST,
            user: DB_USER,
            password: DB_PASSWORD,
            multipleStatements: true
        });
        console.log("Database connection established successfully.");
        break;
    } catch (error) {
        attempts++;
        console.error(`Database connection failed. Attempt ${attempts} of 3.`);
        if (attempts < 3) {
            await new Promise(resolve => setTimeout(resolve, 10000)); // wait for 1 second
        } else {
            console.error("Failed to connect to the database after 3 attempts.");
            process.exit(1); // exit the process if connection fails
        }
    }
}

const [results] = await connection.query("SHOW DATABASES;");

if (!results.some(db => db.Database === DB_NAME)) {
    console.log(`Database ${DB_NAME} does not exist. Creating...`);
    const sql = await fs.promises.readFile('./config/db.sql', 'utf8');
    await connection.query(sql);
    console.log(`Database ${DB_NAME} created successfully.`);
} else {
    await connection.query(`USE ${DB_NAME};`);
}

export default connection;