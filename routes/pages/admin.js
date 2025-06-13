import express from "express";
import isAuthorized from "../../middleware/auth.js";

const router = express.Router();

router.get("/admin", isAuthorized(["admin"], true), (req, res) => {
    res.render("pages/admin", {email: res.locals.email, role: res.locals.role});
});

export default router;