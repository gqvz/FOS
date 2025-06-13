import express from 'express';
import isAuthorized from "../middleware/auth.js";

const router = express.Router();

router.get("/payments/:paymentId", isAuthorized(["customer", "chef", "admin"], true), (req, res) => {
    res.render("pages/payment", {paymentId: req.params.paymentId, email: res.locals.email});
});

export default router;
