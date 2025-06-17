import express from "express";
import connection from "../../../db.js";
import bcrypt from "bcrypt";

const router = express.Router();

router.post("/",
    async (req, res) => {
        const {name, email, password} = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({error: "All fields are required"});
        }

        // make sure email is valid
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({error: "Invalid email format"});
        }

        if (password.length < 8) {
            return res.status(400).json({error: "Password must be at least 8 characters long"});
        }

        // check if user already exists
        const [result] = await connection.query("SELECT * FROM Users WHERE (email = ? OR  name = ?) LIMIT 1;", [email, name]);
        if (result.length > 0) {
            return res.status(400).json({error: "User already exists"});
        }

        // create a salt
        const salt = await bcrypt.genSalt(10); // TODO: make your own salt
        const hashedPassword = await bcrypt.hash(password, salt);
        try {
            await connection.query(`INSERT INTO Users (name, email, role, password_hash)
                                    VALUES (?, ?, 'customer', ?);`, [name, email, hashedPassword]);
            res.status(201).json({message: "User created successfully"});
        } catch (error) {
            console.error("Error creating user:", error);
            res.status(500).json({error: "Internal server error"});
        }
    })

export default router;