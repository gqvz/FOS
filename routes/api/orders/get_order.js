import express from "express";
import connection from "../../../db.js";
import isAuthorized from "../../../middleware/auth.js";

const router = express.Router();

// noinspection JSCheckFunctionSignatures
router.get("/:id", isAuthorized(["customer", "chef", "admin"]), async (req, res) => {
    const orderId = req.params.id;

    if (!orderId || isNaN(orderId)) {
        return res.status(400).json({error: "Invalid order ID"});
    }

    try {
        // Fetch the order details
        const [orderDetails] = await connection.query("SELECT * FROM Orders WHERE id = ? LIMIT 1;", [orderId]);
        if (orderDetails.length === 0) {
            return res.status(404).json({error: "Order not found"});
        }

        if (orderDetails[0].user_id !== res.locals.userId && res.locals.role !== "admin") {
            return res.status(403).json({error: "You do not have permission to view this order"});
        }

        // Fetch the items associated with the order
        const [orderItems] = await connection.query("SELECT * FROM OrderItems WHERE order_id = ?;", [orderId]);

        // Combine the order details and items
        const response = {
            ...orderDetails[0],
            items: orderItems
        };

        res.status(200).json(response);
    } catch (error) {
        console.error("Error fetching order:", error);
        res.status(500).json({error: "Internal server error"});
    }
});

export default router;