import express from "express";
import isAuthorized from "../../../middleware/auth.js";
import connection from "../../../db.js";

const router = express.Router();

// noinspection JSCheckFunctionSignatures
router.delete("/:id", isAuthorized(["admin"]),
    async (req, res) => {
        const tagId = req.params.id;

        if (!tagId || isNaN(tagId)) {
            return res.status(400).json({error: "Invalid tag ID"});
        }

        try {
            // Check if the tag exists
            const [existingTags] = await connection.query("SELECT * FROM Tags WHERE id = ? LIMIT 1;", [tagId]);
            if (existingTags.length === 0) {
                return res.status(404).json({error: "Tag not found"});
            }

            // Delete the tag from the database
            await connection.query("DELETE FROM ItemTags WHERE tag_id = ?;", [tagId]);
            await connection.query("DELETE FROM Tags WHERE id = ?;", [tagId]);

            res.status(204).json({message: "Tag deleted successfully"});
        } catch (error) {
            console.error("Error deleting tag:", error);
            res.status(500).json({error: "Internal server error"});
        }
    });

export default router;