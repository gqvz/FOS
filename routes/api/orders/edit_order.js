import express from "express";
import connection from "../../../db.js";
import isAuthorized from "../../../middleware/auth.js";

const router = express.Router();

// noinspection JSCheckFunctionSignatures
router.patch("/:id", isAuthorized(["admin", "customer", "chef"]), async (req, res) => {
    const orderId = req.params.id;
    const {status} = req.body;

    if (!orderId || isNaN(orderId)) {
        return res.status(400).json({error: "Invalid order ID"});
    }

    if (!status) {
        return res.status(400).json({error: "Order status is required"});
    }

    try {
        // Check if the order exists
        const [results] = await connection.query("SELECT * FROM Orders WHERE id = ? LIMIT 1;", [orderId]);
        if (results.length === 0) {
            return res.status(404).json({error: "Order not found"});
        }

        if (results[0].user_id !== res.locals.userId && res.locals.role !== "admin") {
            return res.status(403).json({error: "You do not have permission to edit this order"});
        }

        await connection.query("UPDATE Orders SET status = ? WHERE id = ?;", [status, orderId]);
        res.status(200).json({message: "Order updated successfully"});
    } catch (error) {
        console.error("Unexpected error:", error);
        res.status(500).json({error: "Internal server error"});
    }

});

export default router;