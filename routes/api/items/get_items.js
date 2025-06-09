import express from "express";
import connection from "../../../db.js";
import isAuthorized from "../../../middleware/auth.js"

const router = express.Router();

// noinspection JSCheckFunctionSignatures
router.get("/", isAuthorized(["customer", "chef", "admin"]),
    async (req, res) => {
        let {tags, search, limit, skip, available} = req.query;

        // Validate query parameters
        if (limit && isNaN(limit)) {
            return res.status(400).json({error: "Invalid limit parameter"});
        }

        if (skip && isNaN(skip)) {
            return res.status(400).json({error: "Invalid start parameter"});
        }

        if (available && !['false', 'true'].includes(available)) {
            return res.status(400).json({error: "Available must be 'true' or 'false'"});
        }

        if (!available) {
            available = 'true';
        }

        available = available === 'true' ? 1 : 0;

        // Default values for limit and start
        const limitValue = limit ? parseInt(limit) : 10;
        const startValue = skip ? parseInt(skip) : 0;

        if (limitValue < 1 || startValue < 0) {
            return res.status(400).json({error: "Limit must be at least 1 and start must be at least 0"});
        }

        let query;
        const queryParams = [];

        const searchPattern = search ? `%${search}%` : '%';
        if (tags) {
            const tagList = Array.isArray(tags) ? tags : tags.split(',');
            const placeholders = tagList.map(() => '?').join(', ');
            query = `SELECT I.*, IFNULL((SELECT JSON_ARRAYAGG(Tags.name)
                                         FROM Tags
                                                  JOIN ItemTags ON ItemTags.item_id = I.id
                                         WHERE Tags.id = ItemTags.tag_id), JSON_ARRAY()) as tags
                     FROM Items I
                              JOIN ItemTags IT ON I.id = IT.item_id
                              JOIN Tags T ON IT.tag_id = T.id
                              LEFT JOIN ItemTags ITA ON I.id = ITA.item_id
                              LEFT JOIN Tags TA ON ITA.tag_id = TA.id
                     WHERE T.name IN (${placeholders})
                       AND (I.name LIKE ? OR I.description LIKE ?)
                       AND I.is_available = ?
                     GROUP BY I.id
                     HAVING COUNT(DISTINCT T.name) >= ?
                     ORDER BY I.id DESC
                     LIMIT ? OFFSET ?`;
            queryParams.push(...tagList);
            queryParams.push(searchPattern, searchPattern, available, tagList.length, limitValue, startValue);

        } else {
            query = `SELECT I.*,
                            IFNULL((SELECT JSON_ARRAYAGG(Tags.name)
                                    FROM Tags
                                             JOIN ItemTags ON ItemTags.item_id = I.id
                                    WHERE Tags.id = ItemTags.tag_id), JSON_ARRAY()) as tags
                     FROM Items I
                              LEFT JOIN ItemTags ITA ON I.id = ITA.item_id
                              LEFT JOIN Tags TA ON ITA.tag_id = TA.id
                     WHERE (I.name LIKE ?
                         OR I.description LIKE ?)
                       AND is_available = ?
                     GROUP BY I.id
                     ORDER BY I.id DESC
                     LIMIT ? OFFSET ?`;
            queryParams.push(searchPattern, searchPattern, available, limitValue, startValue);
        }
        const [results] = await connection.query(query, queryParams);
        res.send(results);
    });

export default router;