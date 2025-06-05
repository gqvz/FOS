import express from "express";
import isAuthorized from "../../../middleware/auth.js";
import connection from "../../../db.js";

const router = express.Router();

// noinspection JSCheckFunctionSignatures
router.delete("/:id", isAuthorized(["admin"]), async (req, res) => {
    const itemId = req.params.id;

    if (!itemId || Number.isNaN(itemId)) {
        return res.status(400).json({ error: "Invalid item ID" });
    }

    try {
        // Check if the item exists
        const [existingItems] = await connection.query("SELECT * FROM Items WHERE id = ? LIMIT 1;", [itemId]);
        if (existingItems.length === 0) {
            return res.status(404).json({ error: "Item not found" });
        }

        // Delete the item from the database
        await connection.query("DELETE FROM Items WHERE id = ?;", [itemId]);
        await connection.query("DELETE FROM ItemTags WHERE item_id = ?;", [itemId]);
        res.status(204).json({ message: "Item deleted successfully" });
    } catch (error) {
        console.error("Error deleting item:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});


export default router;