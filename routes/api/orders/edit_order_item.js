import express from "express";
import isAuthorized from "../../../middleware/auth.js";
import connection from "../../../db.js";

const router = express.Router();

router.patch("/items/:itemId", isAuthorized(['admin', 'chef']), editItem);

router.patch("/:orderId/items/:itemId", isAuthorized(['admin', 'chef']), async (req, res) => {
    req.body.orderId = req.params.orderId;
    await editItem(req, res);
});

async function editItem(req, res) {
    const {itemId} = req.params;
    const {status} = req.body;

    if (!itemId || !status) {
        return res.status(400).json({error: "Item ID and status are required."});
    }

    try {
        const result = await connection.query("UPDATE OrderItems SET status = ? WHERE id = ?", [status, itemId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({error: "Order item not found."});
        }

        res.status(200).json({message: "Order item updated successfully."});
    } catch (error) {
        console.error("Error updating order item:", error);
        res.status(500).json({error: "An error occurred while updating the order item."});
    }
}

export default router;