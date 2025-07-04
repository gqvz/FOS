import express from "express";
import connection from "../../../db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const router = express.Router();

router.post("/token",
    async (req, res) => {
        const {name, password} = req.body;
        const userAgent = req.headers['user-agent'] || 'unknown';

        if (!name || !password) {
            return res.status(400).json({error: "Name and password are required"});
        }

        const [result] = await connection.query("SELECT * FROM Users WHERE name = ? LIMIT 1;", [name]);
        if (result.length === 0) {
            return res.status(401).json({error: "Invalid email or password"});
        }

        const user = result[0];
        const isPasswordValid = bcrypt.compareSync(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({error: "Invalid name or password"});
        }

        // Generate refresh token
        const validCharacters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let refreshToken = '';
        for (let i = 0; i < 32; i++) {
            const randomIndex = Math.floor(Math.random() * validCharacters.length);
            refreshToken += validCharacters[randomIndex];
        }

        // Store the refresh token in the database
        try {
            const [result] = await connection.execute("INSERT INTO Sessions (user_id, refresh_token, name, created_at, last_login, revoked) VALUES (?, ?, ?, ?, ?, FALSE);", [user.id, refreshToken, userAgent.substring(0, 31), new Date(), new Date()]);

            const token = jwt.sign(
                {
                    userId: user.id,
                    role: user.role,
                    sessionId: result.insertId,
                    email: user.email,
                    name: user.name,
                },
                process.env.JWT_SECRET,
                {
                    expiresIn: '1h',
                    audience: "https://fos.garvit.tech",
                    issuer: "https://fos.garvit.tech",
                    algorithm: 'HS256'
                }
            );

            res.cookie("jwt", token, {
                httpOnly: true,
                expires: new Date(Date.now() + 3600000),
                secure: process.env.node_env === 'production',
                sameSite: 'strict'
            });
            res.cookie("refreshToken", refreshToken, {
                httpOnly: true,
                secure: process.env.node_env === 'production',
                sameSite: 'strict'
            });
            res.send({token: token, refreshToken: refreshToken, "expiresIn": 3600});
        } catch (error) {
            console.error("Error storing refresh token:", error);
            return res.status(500).json({error: "Internal server error"});
        }
    })

export default router;