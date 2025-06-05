import express from "express";
import isAuthorized from "../../../middleware/auth.js";
import connection from "../../../db.js";

const router = express.Router();

// noinspection JSCheckFunctionSignatures
router.patch("/:id", isAuthorized(["admin"]),
    async (req, res) => {
        const itemId = req.params.id;
        let {name, description, price, isAvailable, tags} = req.body;

        if (!itemId || isNaN(itemId)) {
            return res.status(400).json({error: "Invalid item ID"});
        }

        if (!name && !description && price === undefined && isAvailable === undefined && !tags) {
            return res.status(400).json({error: "At least one field to update is required"});
        }

        if (tags && !Array.isArray(tags)) {
            return res.status(400).json({error: "Tags must be an array"});
        }

        const [results] = await connection.query("SELECT * FROM Items WHERE id = ? LIMIT 1;", [itemId]);
        if (results.length === 0) {
            return res.status(404).json({error: "Item not found"});
        }

        const item = results[0];

        if (!name) {
            name = item.name;
        }

        if (!description) {
            description = item.description;
        }

        if (price === undefined) {
            price = item.price;
        } else if (isNaN(price) || price <= 0) {
            return res.status(400).json({error: "Price must be a valid number greater than 0"});
        } else {
            price = parseFloat(price);
        }


        if (isAvailable === undefined) {
            isAvailable = item.is_available;
        } else if (isAvailable !== 'true' && isAvailable !== 'false') {
            return res.status(400).json({error: "isAvailable must be a boolean"});
        } else {
            isAvailable = isAvailable === 'true';
        }

        try {
            await connection.beginTransaction();

            // Update the item in the database
            await connection.query(`UPDATE Items
                                    SET name         = ?,
                                        description  = ?,
                                        price        = ?,
                                        is_available = ?
                                    WHERE id = ?;`, [name, description, price, isAvailable, itemId]);

            // Handle tags if provided
            if (tags) {
                // Delete existing item tags
                await connection.query("DELETE FROM ItemTags WHERE item_id = ?;", [itemId]);

                const tagPlaceholders = tags.map(() => '?').join(', ');
                // Insert new item tags
                if (tagPlaceholders.length > 0) {
                    // Check if the tags exist
                    const [tagResults] = await connection.query(`
                        SELECT id
                        FROM Tags
                        WHERE name IN (${tagPlaceholders});`, tags);
                    if (tagResults.length !== tags.length) {
                        return res.status(400).json({error: "Some tags do not exist"});
                    }
                    const tagIds = tagResults.map(tag => tag.id);
                    const itemTagValues = tagIds.map(tagId => [itemId, tagId]);
                    const itemTagPlaceholders = itemTagValues.map(() => '(?, ?)').join(', ');
                    const query = `
                        INSERT
                        INTO ItemTags(item_id, tag_id)
                        VALUES ${itemTagPlaceholders};`;
                    const flattenedValues = itemTagValues.flat();
                    await connection.query(query, flattenedValues);
                }
            }

            await connection.commit();
            res.status(200).json({message: "Item updated successfully"});
        } catch (error) {
            await connection.rollback();
            console.error("Error updating item:", error);
            res.status(500).json({error: "Internal server error"});
        }

    });

export default router;