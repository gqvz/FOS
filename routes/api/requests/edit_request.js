import express from 'express';
import connection from '../../../db.js';
import isAuthorized from '../../../middleware/auth.js';

const router = express.Router();

// noinspection JSCheckFunctionSignatures
router.patch('/:id', isAuthorized(['admin']), async (req, res) => {
    const {status} = req.body;
    const requestId = req.params.id;

    if (!requestId || isNaN(requestId)) {
        return res.status(400).json({error: "Invalid request ID"});
    }

    if (!status || !['granted', 'rejected'].includes(status)) {
        return res.status(400).json({error: "Invalid status"});
    }

    try {
        const [results] = await connection.query("SELECT * FROM Requests WHERE id = ? LIMIT 1;", [requestId]);

        if (results.length === 0) {
            return res.status(404).json({error: "Request not found"});
        }

        const request = results[0];

        if (request.status !== 'pending') {
            return res.status(400).json({error: "Request is not pending"});
        }

        await connection.beginTransaction();

        await connection.query("UPDATE Requests SET status = ?, granted_by = ? WHERE id = ?;", [status, res.locals.userId, requestId]);

        if (status === 'granted') {
            await connection.query("UPDATE Users SET role = ? WHERE id = ?;", [request.role, request.user_id]);
        }
        await connection.commit();

        res.status(200).json({message: "Request updated successfully", requestId, status});
    } catch (error) {
        console.error("Error updating request:", error);
        res.status(500).json({error: "Internal server error"});
    }
});

export default router;