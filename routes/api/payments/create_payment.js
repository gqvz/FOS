import express from "express";
import isAuthorized from "../../../middleware/auth.js";
import connection from "../../../db.js";

const router = express.Router();

// noinspection JSCheckFunctionSignatures
router.post("/", isAuthorized(["customer", "chef", "admin"]), async (req, res) => {
    let {userId, orderId, tip, cashierId} = req.body;
    if (!userId) {
        userId = res.locals.userId;
    }

    if (!orderId) {
        return res.status(400).json({error: "User ID and order ID are required"});
    }

    if (userId !== res.locals.userId && res.locals.role !== "admin") {
        return res.status(403).json({error: "You are not authorized to create a payment for this user"});
    }

    if (!cashierId) {
        cashierId = res.locals.userId;
    }

    try {
        // Check if the order exists and is open
        const [existingOrders] = await connection.query("SELECT * FROM Orders WHERE id = ? AND status = 'closed' LIMIT 1;", [orderId]);
        if (existingOrders.length === 0) {
            return res.status(400).json({error: "Order does not exist or is not open"});
        }

        if (existingOrders[0].customer_id !== userId && res.locals.role !== "admin") {
            return res.status(403).json({error: "You are not authorized to create a payment for this order"});
        }

        const [orderItems] = await connection.query("SELECT SUM(Items.price * OrderItems.count) AS order_subtotal FROM OrderItems JOIN Items ON Items.id = OrderItems.item_id WHERE order_id = ?;", [orderId]);

        const subtotal = orderItems[0].order_subtotal || 0;

        const [results] = await connection.query("INSERT INTO Payments (user_id, order_id, tip, status, order_subtotal, cashier_id) VALUES (?, ?, ?, 'processing', ?, ?);", [userId, orderId, tip || 0, parseFloat(subtotal), cashierId]);
        res.status(201).json({paymentId: results.insertId});
    } catch (error) {
        console.error("Error creating payment:", error);
        res.status(500).json({error: "Internal server error"});
    }
});

export default router;