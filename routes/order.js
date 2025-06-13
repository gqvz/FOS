import express from 'express';
import isAuthorized from "../middleware/auth.js";

const router = express.Router();

router.get("/orders/:orderId", isAuthorized(["customer", "chef", "admin"], true), (req, res) => {
    res.render("pages/order", {orderId: req.params.orderId, email: res.locals.email});
});

export default router;
