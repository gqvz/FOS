import express from 'express';
import isAuthorized from "../../../middleware/auth.js";
import connection from "../../../db.js";

const router = express.Router();
// noinspection JSCheckFunctionSignatures
router.get("/", isAuthorized(["customer", "chef", "admin"], true), async (req, res) => {
    let {userId, orderId, status, cashierId} = req.query;

    if (!userId && res.locals.role !== "admin") {
        userId = res.locals.userId;
    }

    if (cashierId && cashierId !== res.locals.userId && res.locals.role !== "admin") {
        return res.status(403).json({error: "You are not authorized to view payments for this cashier"});
    }

    if (userId !== res.locals.userId && res.locals.role !== "admin") {
        return res.status(403).json({error: "You are not authorized to view payments for this user"});
    }

    if (!status) {
        status = "processing";
    }

    if (["processing", "completed"].indexOf(status) === -1) {
        return res.status(400).json({error: "Invalid status"});
    }

    try {
        if (orderId) {
            const [results] = await connection.query("SELECT * FROM Orders WHERE id = ? AND status = 'closed' LIMIT 1;", [orderId]);

            if (results.length === 0) {
                return res.status(400).json({error: "Order does not exist or is not closed"});
            }

            if (results[0].customer_id !== userId && res.locals.role !== "admin") {
                return res.status(403).json({error: "You are not authorized to view payments for this order"});
            }
        }

        let query = `SELECT Payments.*, Users.name AS cashier_name
                     FROM Payments
                              JOIN Users ON Payments.cashier_id = Users.id
                     WHERE 1 = 1`;

        const params = [];
        if (userId) {
            query += " AND Payments.user_id = ?";
            params.push(userId);
        }

        if (orderId) {
            query += " AND Payments.order_id = ?";
            params.push(orderId);
        }

        if (status) {
            query += " AND Payments.status = ?";
            params.push(status);
        }

        if (cashierId) {
            query += " AND Payments.cashier_id = ?";
            params.push(cashierId);
        }

        query += " ORDER BY Payments.id DESC;";

        const [payments] = await connection.query(query, params);
        return res.status(200).json(payments);
    } catch (error) {
        console.error("Error fetching payments:", error);
        return res.status(500).json({error: "Internal server error"});
    }
});

export default router;