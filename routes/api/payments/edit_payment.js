import express from 'express';
import isAuthorized from "../../../middleware/auth.js";
import connection from "../../../db.js";

const router = express.Router();

// noinspection JSCheckFunctionSignatures
router.patch("/:id", isAuthorized(["admin"]), async (req, res) => {
    const {id} = req.params;
    const {status} = req.body;

    if (!status || !["processing", "completed"].includes(status)) {
        return res.status(400).json({error: "Invalid status"});
    }

    try {
        const [results] = await connection.query("UPDATE Payments SET status = ? WHERE id = ?;", [status, id]);

        if (results.affectedRows === 0) {
            return res.status(404).json({error: "Payment not found"});
        }

        res.status(200).json({message: "Payment updated successfully"});
    } catch (error) {
        console.error("Error updating payment:", error);
        res.status(500).json({error: "Internal server error"});
    }
});

export default router;