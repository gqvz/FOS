import express from 'express';
import isAuthorized from "../middleware/auth.js";

const router = express.Router();

router.get("/orders", isAuthorized(["customer", "chef", "admin"], true), (req, res) => {
    res.render("pages/orders", {emails:res.locals.email});
});

export default router;
