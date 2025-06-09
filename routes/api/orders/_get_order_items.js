import express from "express";
import connection from "../../../db.js";
import isAuthorized from "../../../middleware/auth.js";

const router = express.Router();

// noinspection JSCheckFunctionSignatures
router.get("/items", isAuthorized(["customer", "chef", "admin"]), get_order_items);

router.get("/:orderId/items", isAuthorized(["customer", "chef", "admin"]), async (req, res) => {
    req.query.orderId = req.params.orderId;
    await get_order_items(req, res);
});

async function get_order_items(req, res) {
    let {orderId, customerId, itemId, search, status, limit, skip} = req.query;

    if (orderId && isNaN(orderId)) {
        return res.status(400).json({error: "Invalid order ID"});
    }

    if (customerId && isNaN(customerId)) {
        return res.status(400).json({error: "Invalid customer ID"});
    }

    if (itemId && isNaN(itemId)) {
        return res.status(400).json({error: "Invalid item ID"});
    }

    if (limit && isNaN(limit)) {
        return res.status(400).json({error: "Invalid limit"});
    }

    if (skip && isNaN(skip)) {
        return res.status(400).json({error: "Invalid skip value"});
    }

    const limitValue = limit ? parseInt(limit) : 10;
    const skipValue = skip ? parseInt(skip) : 0;

    if (limitValue < 1 || skipValue < 0) {
        return res.status(400).json({error: "Limit must be at least 1 and skip must be at least 0"});
    }

    if (customerId && customerId !== res.locals.userId && res.locals.role !== "admin") {
        return res.status(403).json({error: "You do not have permission to view these items"});
    }

    if (res.locals.role === "customer") {
        customerId = res.locals.userId;
    }

    const searchValue = search ? `%${search}%` : '%';

    if (status && !['pending', 'completed'].includes(status)) {
        return res.status(400).json({error: "Invalid status"});
    }

    if (!status) {
        status = 'pending';
    }

    if (status === 'completed' && res.locals.role !== 'admin' && customerId !== res.locals.userId) {
        return res.status(403).json({error: "You do not have permission to view completed items"});
    }

    // noinspection SqlConstantExpression
    let query = `
        SELECT OrderItems.id,
               OrderItems.custom_instructions,
               OrderItems.count,
               OrderItems.status,
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
        WHERE 1 = 1`;
    const queryParams = [];

    if (orderId) {
        query += ` AND OrderItems.order_id = ?`;
        queryParams.push(orderId);
    }

    if (customerId) {
        query += ` AND Orders.customer_id = ?`;
        queryParams.push(customerId);
    }

    if (itemId) {
        query += ` AND OrderItems.item_id = ?`;
        queryParams.push(itemId);
    }

    if (search) {
        query += ` AND (Items.name LIKE ? OR Items.description LIKE ? OR OrderItems.custom_instructions LIKE ?)`;
        queryParams.push(searchValue, searchValue, searchValue);
    }

    query += ` AND OrderItems.status = ?`;
    queryParams.push(status);

    query += ` ORDER BY OrderItems.id DESC LIMIT ? OFFSET ?;`;
    queryParams.push(limitValue, skipValue);

    try {
        const [results] = await connection.query(query, queryParams);
        res.status(200).json(results);
    } catch (error) {
        console.error("Error fetching order items:", error);
        res.status(500).json({error: "Internal server error"});
    }
}

export default router;