import express from "express";
import isAuthorized from "../../../middleware/auth.js";
import connection from "../../../db.js";

const router = express.Router();

// noinspection JSCheckFunctionSignatures
router.post("/", isAuthorized(["admin"]),
    async (req, res) => {
        let {name, description, price, tags, imageUrl} = req.body;

        if (!name || !description || !price) {
            return res.status(400).json({error: "Name, description, and price are required"});
        }

        if (isNaN(price)) {
            return res.status(400).json({error: "Price must be a valid number"});
        }

        price = parseFloat(price);

        if (price <= 0) {
            return res.status(400).json({error: "Price must be greater than 0"});
        }

        if (tags && !Array.isArray(tags)) {
            return res.status(400).json({error: "Tags must be an array"});
        }

        if (!imageUrl) {
            imageUrl = "https://http.cat/404"
        }

        // check if the item already exists
        const [existingItems] = await connection.query("SELECT * FROM Items WHERE name = ? LIMIT 1;", [name]);
        if (existingItems.length > 0) {
            return res.status(400).json({error: "Item with this name already exists"});
        }

        // check if the tags exist
        let tagIds = [];
        if (tags) {
            tags = Array.isArray(tags) ? tags : [tags];
            const tagPlaceholders = tags.map(() => '?').join(', ');
            const [tagResults] = await connection.query(`SELECT id
                                                         FROM Tags
                                                         WHERE name IN (${tagPlaceholders});`, tags);
            if (tagResults.length !== tags.length) {
                return res.status(400).json({error: "Some tags do not exist"});
            }
            tagIds = tagResults.map(tag => tag.id);
        }

        try {
            await connection.beginTransaction();
            const [result] = await connection.query(`INSERT INTO Items (name, description, price, image_url, is_available)
                                                     VALUES (?, ?, ?, ?, TRUE);`, [name, description, price, imageUrl]);
            const itemId = result.insertId;
            if (tagIds.length > 0) {
                const itemTag = tagIds.map(tagId => [itemId, tagId]);
                const itemTagPlaceholders = itemTag.map(() => '(?, ?)').join(', ');
                const query = `
                    INSERT
                    INTO ItemTags(item_id, tag_id)
                    VALUES ${itemTagPlaceholders};`;
                const flattenedValues = itemTag.flat();
                await connection.query(query, flattenedValues);
            }
            await connection.commit();
            res.status(201).json({message: "Item created successfully", itemId: itemId});
        } catch (error) {
            await connection.rollback();
            console.error("Error creating item:", error);
            res.status(500).json({error: "Internal server error"});
        }
    });

export default router;