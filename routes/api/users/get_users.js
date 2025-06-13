import express from 'express';
import isAuthorized from "../../../middleware/auth.js";
import connection from "../../../db.js";

const router = express.Router();

router.get("/", isAuthorized(['admin']), async (req, res) => {
    const {search, role} = req.query;

    if (role && !['chef', 'customer', 'admin'].includes(role)) {
        return res.status(400).json({message: "Invalid role specified"});
    }

    try {
        let query = "SELECT id, name, email, role FROM Users WHERE 1=1";
        const queryParams = [];
        const searchValue = search ? `%${search}%` : '%';
        if (role) {
            query += " AND role = ?";
            queryParams.push(role);
        }
        query += " AND (name LIKE ? OR email LIKE ?)";
        queryParams.push(searchValue, searchValue);
        const [results] = await connection.query(query, queryParams);
        res.status(200).json(results);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({message: "Internal server error"});
    }
});

export default router;