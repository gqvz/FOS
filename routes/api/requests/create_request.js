import express from 'express';
import connection from '../../../db.js';
import isAuthorized from '../../../middleware/auth.js';

const router = express.Router();

// noinspection JSCheckFunctionSignatures
router.post("/", isAuthorized(['customer', 'chef', 'admin']), async (req, res) => {
    const {role} = req.body;

    if (!role || !['customer', 'chef', 'admin'].includes(role)) {
        return res.status(400).json({error: "Invalid role"});
    }

    if (role === res.locals.role) {
        return res.status(400).json({error: "You cannot create a request for your own role"});
    }

    try {
        // Check if the user already has a pending request for the same role
        const [existingRequests] = await connection.query(
            "SELECT * FROM Requests WHERE user_id = ? AND role = ? AND status = 'pending' LIMIT 1;",
            [res.locals.userId, role]
        );
        if (existingRequests.length > 0) {
            return res.status(400).json({error: "You already have a pending request for this role"});
        }

        const [results] = await connection.query(
            "INSERT INTO Requests (user_id, role, status, user_status) VALUES (?, ?, 'pending', 'seen');",
            [res.locals.userId, role]
        );

        res.status(201).json({requestId: results.insertId});
    } catch (error) {
        console.error("Error creating request:", error);
        res.status(500).json({error: "Internal server error"});
    }
});

export default router;