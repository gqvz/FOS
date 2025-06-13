import express from "express";
import isAuthorized from "../../middleware/auth.js";

const router = express.Router();

router.get("/chef", isAuthorized(["chef", "admin"], true), (req, res) => {
    res.render("pages/chef", {emails: res.locals.email, role: res.locals.role});
});

export default router;