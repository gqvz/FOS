import express from "express";
import connection from "../../../db.js";
import isAuthorized from "../../../middleware/auth.js";

const router = express.Router();

// noinspection JSCheckFunctionSignatures
router.get("/items/:id", isAuthorized(["customer", "chef", "admin"]), get_order_item);

router.get("/:orderId/items/:id", isAuthorized(["customer", "chef", "admin"]), async (req, res) => {
    req.query.orderId = req.params.orderId;
    await get_order_item(req, res);
});

async function get_order_item(req, res) {
    const {orderId} = req.query;
    const itemId = req.params.id;

    if (orderId && isNaN(orderId)) {
        return res.status(400).json({error: "Invalid order ID"});
    }

    if (!itemId || isNaN(itemId)) {
        return res.status(400).json({error: "Invalid item ID"});
    }

    try {
        let query, queryParams;
        if (orderId) {
            const [orderResults] = await connection.query("SELECT * FROM Orders WHERE id = ? LIMIT 1;", [orderId]);
            if (orderResults.length === 0) {
                return res.status(404).json({error: "Order not found"});
            }

            if (orderResults[0].customer_id !== res.locals.userId && ["chef", "admin"].indexOf(res.locals.role) === -1) {
                return res.status(403).json({error: "You do not have permission to view this order"});
            }

            query = `
                SELECT OrderItems.id,
                       OrderItems.count,
                       OrderItems.custom_instructions,
                       OrderItems.status,
                       JSON_OBJECT(
                               'id', Orders.id,
                               'customer_id', Orders.customer_id,
                               'table_number', Orders.table_number,
                               'ordered_at', DATE_FORMAT(Orders.ordered_at, '%Y-%m-%d %H:%i:%s'),
                               'status', Orders.status
                       ) AS \`order\`,
                       JSON_OBJECT(
                               'id', Items.id,
                               'name', Items.name,
                               'price', Items.price,
                               'description', Items.description,
                               'image_url', Items.image_url,
                               'is_available', Items.is_available,
                               'tags', IFNULL((SELECT JSON_ARRAYAGG(Tags.name)
                                               FROM ItemTags
                                                        JOIN Tags ON ItemTags.tag_id = Tags.id
                                               WHERE ItemTags.item_id = Items.id), JSON_ARRAY())
                       ) AS item
                FROM OrderItems
                         JOIN Items ON OrderItems.item_id = Items.id
                         JOIN Orders ON OrderItems.order_id = Orders.id
                WHERE OrderItems.order_id = ?
                  AND OrderItems.id = ?;`;
            queryParams = [orderId, itemId];
        } else {
            query = `
                SELECT OrderItems.id,
                       OrderItems.count,
                       OrderItems.custom_instructions,
                       OrderItems.status,
                       JSON_OBJECT(
                               'id', Orders.id,
                               'customer_id', Orders.customer_id,
                               'table_number', Orders.table_number,
                               'ordered_at', DATE_FORMAT(Orders.ordered_at, '%Y-%m-%d %H:%i:%s'),
                               'status', Orders.status
                       ) AS \`order\`,
                       JSON_OBJECT(
                               'id', Items.id,
                               'name', Items.name,
                               'price', Items.price,
                               'description', Items.description,
                               'image_url', Items.image_url,
                               'is_available', Items.is_available,
                               'tags', IFNULL((SELECT JSON_ARRAYAGG(Tags.name)
                                               FROM ItemTags
                                                        JOIN Tags ON ItemTags.tag_id = Tags.id
                                               WHERE ItemTags.item_id = Items.id), JSON_ARRAY())
                       ) AS item
                FROM OrderItems
                         JOIN Items ON OrderItems.item_id = Items.id
                         JOIN Orders ON OrderItems.order_id = Orders.id
                WHERE OrderItems.id = ?;`;
            queryParams = [itemId];
        }
        // Fetch the order item details
        const [itemResults] = await connection.execute(query, queryParams);

        if (itemResults.length === 0) {
            return res.status(404).json({error: "Order item not found"});
        }

        res.status(200).json(itemResults[0]);
    } catch (error) {
        console.error("Error fetching order item:", error);
        res.status(500).json({error: "Internal server error"});
    }
}

export default router;