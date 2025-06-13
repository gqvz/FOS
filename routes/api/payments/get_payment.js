import express from 'express';
import isAuthorized from "../../../middleware/auth.js";
import connection from "../../../db.js";

const router = express.Router();

// noinspection JSCheckFunctionSignatures
router.get("/:paymentId", isAuthorized(["customer", "chef", "admin"], true), async (req, res) => {
    const paymentId = req.params.paymentId;

    if (!paymentId) {
        return res.status(400).json({error: "Payment ID is required"});
    }

    try {
        const [results] = await connection.query(`
            SELECT Payments.id,
                   Payments.user_id,
                   Payments.cashier_id,
                   Payments.order_subtotal,
                   Payments.tip,
                   Payments.status,
                   Payments.total,
                   JSON_OBJECT(
                           'id', Orders.id,
                           'customer_id', Orders.customer_id,
                           'table_number', Orders.table_number,
                           'ordered_at', Orders.ordered_at,
                           'status', Orders.status,
                           'items', (SELECT JSON_ARRAYAGG(
                                                    JSON_OBJECT(
                                                            'id', OrderItems.id,
                                                            'count',
                                                            OrderItems.count,
                                                            'item', JSON_OBJECT(
                                                                    'id',
                                                                    Items.id,
                                                                    'name',
                                                                    Items.name,
                                                                    'price',
                                                                    Items.price,
                                                                    'description',
                                                                    Items.description,
                                                                    'image_url',
                                                                    Items.image_url,
                                                                    'tags',
                                                                    IFNULL(
                                                                            (SELECT JSON_ARRAYAGG(Tags.name)
                                                                             FROM ItemTags
                                                                                      JOIN Tags ON ItemTags.tag_id = Tags.id
                                                                             WHERE ItemTags.item_id = Items.id),
                                                                            JSON_ARRAY())
                                                                    )
                                                    )
                                            )
                                     FROM OrderItems
                                              JOIN Items ON OrderItems.item_id = Items.id
                                     WHERE OrderItems.order_id = Orders.id)
                   ) AS \`order\`
            FROM Payments
                     JOIN Orders ON Payments.order_id = Orders.id
            WHERE Payments.id = ?
            LIMIT 1;
        `, [paymentId]);

        if (results.length === 0) {
            return res.status(404).json({error: "Payment not found"});
        }

        const payment = results[0];
        if (payment.user_id !== res.locals.userId && res.locals.role !== "admin") {
            return res.status(403).json({error: "You do not have permission to view this payment"});
        }

        res.status(200).json(payment);
    }
    catch (err) {
        console.error("Error fetching payment:", err);
        return res.status(500).json({error: "Internal server error"});
    }
});
export default router;