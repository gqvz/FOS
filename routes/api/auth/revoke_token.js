import express from "express";
import jwt from "jsonwebtoken";
import connection from "../../../db.js";

const router = express.Router();

router.delete("/token",
    async (req, res) => {
        const token = req.cookies['jwt'];
        const refreshToken = req.body.refreshToken;

        if (!token && !refreshToken) {
            return res.status(400).json({error: "Atleast one of JWT token or refresh token is required"});
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET, {
                algorithms: ['HS256'],
                audience: "https://fos.garvit.tech",
                issuer: "https://fos.garvit.tech",
            });
        } catch (err) {
        }

        // Revoke the refresh token in the database
        try {
            if (!decoded.sessionId) {
                await connection.query("UPDATE Sessions SET revoked = TRUE WHERE refresh_token = ?;", [refreshToken]);
            } else {
                await connection.query("UPDATE Sessions SET revoked = TRUE WHERE refresh_token = ? OR id = ?;", [refreshToken, decoded.sessionId]);
            }
            res.clearCookie("jwt", {httpOnly: true, secure: process.env.node_env === 'production', sameSite: 'strict'});
            res.status(204).send();
        } catch (error) {
            console.error("Error revoking refresh token:", error);
            return res.status(500).json({error: "Internal server error"});
        }
    });

export default router;