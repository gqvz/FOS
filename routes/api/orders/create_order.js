import express from 'express';
import isAuthorized from "../../../middleware/auth.js";
import connection from "../../../db.js";

const router = express.Router();

// noinspection JSCheckFunctionSignatures
router.post("/", isAuthorized(["customer", "chef", "admin"]), async (req, res) => {
    const {userId, tableNumber} = req.body;
    if (!tableNumber) {
        return res.status(400).json({error: "User ID and table number are required"});
    }

    if (userId !== res.locals.userId && res.locals.role !== "admin") {
        return res.status(403).json({error: "You are not authorized to create an order for this user"});
    }

    try {
        // check if the table already has an open order
        const [existingOrders] = await connection.query("SELECT * FROM Orders WHERE table_number = ? AND status = 'open' LIMIT 1;", [tableNumber]);
        if (existingOrders.length > 0) {
            return res.status(400).json({error: "There is already an open order for this table"});
        }

        const [results] = await connection.query("INSERT INTO Orders (customer_id, table_number, ordered_at, status) VALUES (?, ?, ?, 'open');", [userId, tableNumber, new Date()]);
        res.status(201).json({orderId: results.insertId});
    } catch (error) {
        console.error("Error creating order:", error);
        res.status(500).json({error: "Internal server error"});
    }
});

export default router;