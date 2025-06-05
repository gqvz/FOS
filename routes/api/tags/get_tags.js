import express from "express";
import connection from "../../../db.js";
import isAuthorized from "../../../middleware/auth.js";

const router = express.Router();

// noinspection JSCheckFunctionSignatures
router.get("/", isAuthorized(["customer", "chef", "admin"]), async (req, res) => {
    try {
        const [results] = await connection.query("SELECT * FROM Tags ORDER BY name;");
        res.status(200).json(results);
    } catch (error) {
        console.error("Error fetching tags:", error);
        res.status(500).json({error: "Internal server error"});
    }
});

export default router;