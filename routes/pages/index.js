import express from 'express';
import isAuthorized from "../../middleware/auth.js";
import connection from "../../db.js";

const router = express.Router();

router.get("/", isAuthorized(["customer", "chef", "admin"], true), async (req, res) => {
    // get all unread messages
    try {
        const [response] = await connection.query(
            "SELECT * FROM Requests WHERE user_id = ? AND user_status = 'unseen';",
            [res.locals.userId]
        );

        console.log(response);
        res.render("pages/index", {email: res.locals.email, role: res.locals.role, unread: response});
    } catch (error) {
        console.error("Error fetching unread messages:", error);
        res.status(500).json({error: "Internal server error"});
    }
});

router.post("/read", isAuthorized(["customer", "chef", "admin"], true), async (req, res) => {
    try {
        const [response] = await connection.query("UPDATE Requests SET user_status = 'seen' WHERE user_id = ? AND user_status = 'unseen';", [res.locals.userId]);
        if (response.affectedRows > 0) {
            res.status(200).json({message: "Messages marked as read"});
        } else {
            res.status(404).json({error: "No unread messages found"});
        }
    } catch (error) {
        console.error("Error marking messages as read:", error);
        res.status(500).json({error: "Internal server error"});
    }
});

export default router;