import express from 'express';
import connection from '../../../db.js';
import isAuthorized from '../../../middleware/auth.js';

const router = express.Router();

// noinspection JSCheckFunctionSignatures
router.post("/items", isAuthorized(["customer", "chef", "admin"]), create_order_item);
router.post("/:id/items", isAuthorized(["customer", "chef", "admin"]), async function (req, res) {
    req.body.orderId = req.params.id;
    await create_order_item(req, res);
});

async function create_order_item(req, res) {
    const {orderId, itemId, quantity, customInstructions, repeat} = req.body;

    if (!orderId || isNaN(orderId)) {
        return res.status(400).json({error: "Invalid order ID"});
    }

    if (!itemId || isNaN(itemId)) {
        return res.status(400).json({error: "Invalid item ID"});
    }

    if (!quantity || isNaN(quantity) || quantity <= 0) {
        return res.status(400).json({error: "Invalid quantity"});
    }

    if (repeat && isNaN(repeat)) {
        return res.status(400).json({error: "Invalid repeat value"});
    }

    try {
        // Check if the order exists
        const [orderResults] = await connection.query("SELECT * FROM Orders WHERE id = ? LIMIT 1;", [orderId]);
        if (orderResults.length === 0) {
            return res.status(404).json({error: "Order not found"});
        }

        if (orderResults[0].status !== "open") {
            return res.status(400).json({error: "Cannot add items to an order that is not closed"});
        }

        if (orderResults[0].customer_id !== res.locals.userId && res.locals.role !== "admin") {
            return res.status(403).json({error: "You do not have permission to add items to this order"});
        }

        // TODO: this does not check the availability of the repeat's item, only the one that is given in the req body
        // Check if the item exists
        const [itemResults] = await connection.query("SELECT * FROM Items WHERE id = ? AND is_available = TRUE LIMIT 1;", [itemId]);
        if (itemResults.length === 0) {
            return res.status(404).json({error: "Item not found"});
        }

        // Insert the order item into the database
        if (repeat) {
            await connection.query(
                "INSERT INTO OrderItems (order_id, item_id, count, custom_instructions, status) SELECT ?, item_id, ?, custom_instructions, 'pending' FROM OrderItems WHERE id = ?;",
                [orderId, quantity, parseInt(repeat)]
            );
        } else {
            await connection.query(
                "INSERT INTO OrderItems (order_id, item_id, count, custom_instructions, status) VALUES (?, ?, ?, ?, 'pending');",
                [orderId, itemId, quantity, customInstructions]
            );
        }

        res.status(201).json({message: "Order item created successfully"});
    } catch (error) {
        console.error("Error creating order item:", error);
        res.status(500).json({error: "Internal server error"});
    }
}

export default router;