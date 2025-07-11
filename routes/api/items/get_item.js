import express from "express";
import isAuthorized from "../../../middleware/auth.js";
import connection from "../../../db.js";

const router = express.Router();

// noinspection JSCheckFunctionSignatures
router.get("/:id", isAuthorized(["customer", "chef", "admin"]),
    async (req, res) => {
        const itemId = req.params.id;

        if (!itemId || isNaN(itemId)) {
            return res.status(400).json({error: "Invalid item ID"});
        }

        try {
            const [results] = await connection.query(
                `SELECT Items.*,
                        IFNULL((SELECT JSON_ARRAYAGG(Tags.name)
                                FROM Tags
                                         JOIN ItemTags ON ItemTags.item_id = Items.id
                                WHERE Tags.id = ItemTags.tag_id), JSON_ARRAY()) as tags
                 FROM Items
                          JOIN ItemTags ON ItemTags.item_id = Items.id
                          JOIN Tags ON Tags.id = ItemTags.tag_id
                 WHERE Items.id = ?`, [itemId]);

            if (results.length === 0) {
                return res.status(404).json({error: "Item not found"});
            }

            const item = results[0];
            res.status(200).json(item);
        } catch (error) {
            console.error("Error fetching item:", error);
            res.status(500).json({error: "Internal server error"});
        }
    });

export default router;