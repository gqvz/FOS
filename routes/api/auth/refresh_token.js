import express from "express";
import connection from "../../../db.js";
import jwt from "jsonwebtoken";

const router = express.Router();

router.post("/token/refresh",
    async (req, res) => {
        const {refreshToken} = req.body;

        const token = req.cookies['jwt'];

        if (!token) {
            return res.status(401).json({error: "Unauthorized"});
        }

        let decoded = null;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET, {
                algorithms: ['HS256'],
                audience: "https://fos.garvit.tech",
                issuer: "https://fos.garvit.tech",
            });
            console.log(decoded);
            if (!decoded || !decoded.userId || !decoded.role || !decoded.sessionId) {
                return res.status(401).json({error: "Invalid JWT token"});
            }
        } catch (err) {
            return res.status(401).json({error: "Invalid JWT token"});
        }
        if (!refreshToken) {
            return res.status(400).json({error: "Refresh token is required"});
        }

        // check the database if the refresh token is valid
        const [result] = await connection.query("SELECT * FROM Sessions WHERE refresh_token = ? AND revoked = FALSE LIMIT 1;", [refreshToken]);
        if (result.length === 0) {
            return res.status(401).json({error: "Invalid refresh token"});
        }
        const session = result[0];
        const userId = session.user_id;
        const userRole = session.role;
        const sessionId = session.id;
        if (userId !== decoded.userId || sessionId !== decoded.sessionId) {
            return res.status(401).json({error: "Invalid session"});
        }
        // Generate a new JWT token
        const newToken = jwt.sign(
            {
                userId: userId,
                role: userRole,
                sessionId: sessionId
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '1h',
                audience: "https://fos.garvit.tech",
                issuer: "https://fos.garvit.tech",
                algorithm: 'HS256'
            }
        );

        res.cookie("jwt", token, {httpOnly: true, expires: new Date(Date.now() + 3600000), secure: process.env.node_env === 'production', sameSite: 'strict'});
        res.send({token: newToken, refreshToken: refreshToken, "expiresIn": 3600});

        // Update the last login time
        try {
            await connection.query("UPDATE Sessions SET last_login = ? WHERE id = ?;", [new Date(), sessionId]);
        } catch (error) {
            console.error("Error updating last login time:", error);
            return res.status(500).json({error: "Internal server error"});
        }
    });

export default router;