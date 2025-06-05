import express from "express";
import connection from "../../../db.js";
import isAuthorized from "../../../middleware/auth.js"

const router = express.Router();

// noinspection JSCheckFunctionSignatures
router.get("/", isAuthorized(["customer", "chef", "admin"]), async (req, res) => {
    const {tags, search, limit, start} = req.query;

    // Validate query parameters
    if (limit && Number.isNaN(limit)) {
        return res.status(400).json({error: "Invalid limit parameter"});
    }

    if (start && Number.isNaN(start)) {
        return res.status(400).json({error: "Invalid start parameter"});
    }

    // Default values for limit and start
    const limitValue = limit ? parseInt(limit) : 10;
    const startValue = start ? parseInt(start) : 0;

    let query = "";
    const queryParams = [];

    if (tags) {
        const tagList = Array.isArray(tags) ? tags : [tags];
        const placeholders = tagList.map(() => '?').join(', ');
        query = `SELECT I.* FROM Items I JOIN ItemTags IT ON I.id = IT.item_id JOIN Tags T ON IT.tag_id = T.id WHERE T.name IN (${placeholders}) AND (I.name LIKE ? OR I.description LIKE ?) GROUP BY I.id HAVING COUNT(DISTINCT T.name) = ? ORDER BY I.id DESC LIMIT ? OFFSET ?`;
        queryParams.push(...tagList);
        queryParams.push(`%${search}%`, `%${search}%`, tagList.length, limitValue, startValue);

    }
    else {
        query = `SELECT * FROM Items WHERE name LIKE ? OR description LIKE ? GROUP BY id ORDER BY id DESC LIMIT ? OFFSET ?`;
        queryParams.push(`%${search}%`, `%${search}%`, limitValue, startValue);
    }
    const [results] = await connection.query(query, queryParams);
    res.send(results);
});

export default router;