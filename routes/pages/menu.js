import express from 'express';
import isAuthorized from "../../middleware/auth.js";

const router = express.Router();

router.get("/menu", isAuthorized(["customer", "chef", "admin"], true), (req, res) => {
    res.render("pages/menu", {email: res.locals.email, role: res.locals.role});
});

export default router;