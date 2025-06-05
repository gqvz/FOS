import express from "express";
import connection from "../../../db.js";
import isAuthorized from "../../../middleware/auth.js";

const router = express.Router();

// noinspection JSCheckFunctionSignatures
router.post("/", isAuthorized(["admin"]), async (req, res) => {
    const {name} = req.body;

    if (!name) {
        return res.status(400).json({error: "Tag name is required"});
    }

    try {
        // Check if the tag already exists
        const [existingTags] = await connection.query("SELECT * FROM Tags WHERE name = ?;", [name]);
        if (existingTags.length > 0) {
            return res.status(400).json({error: "Tag already exists"});
        }

        // Insert the new tag into the database
        const [result] = await connection.query("INSERT INTO Tags (name) VALUES (?);", [name]);
        res.status(201).json({message: "Tag created successfully", tagId: result.insertId});
    } catch (error) {
        console.error("Error creating tag:", error);
        res.status(500).json({error: "Internal server error"});
    }
});

export default router;