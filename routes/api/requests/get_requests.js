import express from "express";
import isAuthorized from "../../../middleware/auth.js";
import connection from "../../../db.js";

const router = express.Router();

// noinspection JSCheckFunctionSignatures
router.get("/", isAuthorized(['admin']), async (req, res) => {
    const {status} = req.body;

    if (status && !['pending', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({error: "Invalid status"});
    }

    try {
        let query = "SELECT Requests.*, Users.name AS user_name, Users.email AS user_email FROM Requests JOIN Users ON Requests.user_id = Users.id";
        const params = [];

        if (status) {
            query += " WHERE Requests.status = ?";
            params.push(status);
        }

        query += " ORDER BY Requests.id DESC";

        const [results] = await connection.query(query, params);

        if (results.length === 0) {
            return res.status(404).json({error: "No requests found"});
        }

        res.status(200).json(results);
    } catch (error) {
        console.error("Error fetching requests:", error);
        res.status(500).json({error: "Internal server error"});
    }
});

export default router;