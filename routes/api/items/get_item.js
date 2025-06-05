import express from "express";
import isAuthorized from "../../../middleware/auth.js";
import connection from "../../../db.js";

const router = express.Router();

// noinspection JSCheckFunctionSignatures
router.get("/:id", isAuthorized(["customer", "chef", "admin"]), async (req, res) => {
    const itemId = req.params.id;

    if (!itemId || Number.isNaN(itemId)) {
        return res.status(400).json({error: "Invalid item ID"});
    }

    try {
        const [results] = await connection.query("SELECT * FROM Items WHERE id = ? LIMIT 1;", [itemId]);

        if (results.length === 0) {
            return res.status(404).json({error: "Item not found"});
        }

        const item = results[0];

        // Fetch associated tags
        const [tagResults] = await connection.query("SELECT T.name FROM Tags T JOIN ItemTags IT ON T.id = IT.tag_id WHERE IT.item_id = ?;", [itemId]);
        item.tags = tagResults.map(tag => tag.name);

        res.status(200).json(item);
    } catch (error) {
        console.error("Error fetching item:", error);
        res.status(500).json({error: "Internal server error"});
    }
});

export default router;