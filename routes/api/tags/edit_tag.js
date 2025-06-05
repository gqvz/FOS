import express from "express";
import isAuthorized from "../../../middleware/auth.js";
import connection from "../../../db.js";

const router = express.Router();

// noinspection JSCheckFunctionSignatures
router.patch("/:id", isAuthorized(["admin"]),
    async (req, res) => {
        const tagId = req.params.id;
        const {name} = req.body;

        if (!tagId || isNaN(tagId)) {
            return res.status(400).json({error: "Invalid tag ID"});
        }

        if (!name) {
            return res.status(400).json({error: "Tag name is required"});
        }

        try {
            // Check if the tag exists
            const [existingTags] = await connection.query("SELECT * FROM Tags WHERE id = ? LIMIT 1;", [tagId]);
            if (existingTags.length === 0) {
                return res.status(404).json({error: "Tag not found"});
            }

            // Update the tag in the database
            await connection.query("UPDATE Tags SET name = ? WHERE id = ?;", [name, tagId]);
            res.status(200).json({message: "Tag updated successfully"});
        } catch (error) {
            console.error("Error updating tag:", error);
            res.status(500).json({error: "Internal server error"});
        }
    });

export default router;
