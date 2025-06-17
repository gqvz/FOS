import express from 'express';
import isAuthorized from "../../../middleware/auth.js";
import connection from "../../../db.js";

const router = express.Router();

router.get("/me", isAuthorized(['customer', 'chef', 'admin']), async (req, res) => {
    try {
        const [results] = await connection.query("SELECT id, name, email, role FROM Users WHERE id = ? LIMIT 1;", [res.locals.userId]);
        res.status(200).json(results[0]);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({message: "Internal server error"});
    }
});

export default router;
