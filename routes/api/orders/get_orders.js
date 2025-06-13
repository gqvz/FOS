import express from "express";
import connection from "../../../db.js";
import isAuthorized from "../../../middleware/auth.js";

const router = express.Router();

// noinspection JSCheckFunctionSignatures
router.get("/", isAuthorized(["customer", "chef", "admin"]), async (req, res) => {
    let {customerId, date, status, tableNumber, limit, skip} = req.query;

    if (customerId && isNaN(customerId)) {
        return res.status(400).json({error: "Invalid customer ID"});
    }

    if (tableNumber && isNaN(tableNumber)) {
        return res.status(400).json({error: "Invalid table number"});
    }

    if (date && isNaN(Date.parse(date))) {
        return res.status(400).json({error: "Invalid date format"});
    }

    if (limit && isNaN(limit)) {
        return res.status(400).json({error: "Invalid limit"});
    }

    if (skip && isNaN(skip)) {
        return res.status(400).json({error: "Invalid skip value"});
    }

    // noinspection EqualityComparisonWithCoercionJS

    const limitValue = limit ? parseInt(limit) : 10;
    const startValue = skip ? parseInt(skip) : 0;

    if (limitValue < 1 || startValue < 0) {
        return res.status(400).json({error: "Limit must be at least 1 and start must be at least 0"});
    }

    if (customerId && customerId !== res.locals.userId && res.locals.role !== "admin") {
        return res.status(403).json({error: "You do not have permission to view these orders"});
    }

    if (res.locals.role !== "admin") {
        customerId = res.locals.userId;
    }

    // noinspection SqlConstantExpression
    let query = `SELECT *
                 FROM Orders
                 WHERE 1 = 1`;
    const queryParams = [];

    if (customerId) {
        query += ` AND customer_id = ?`;
        queryParams.push(customerId);
    }

    if (tableNumber) {
        query += ` AND table_number = ?`;
        queryParams.push(tableNumber);
    }

    if (date) {
        query += ` AND DATE(ordered_at) = ?`;
        queryParams.push(date);
    }

    if (status) {
        query += ` AND status = ?`;
        queryParams.push(status);
    }

    query += ` ORDER BY ordered_at DESC LIMIT ? OFFSET ?`;
    queryParams.push(limitValue, startValue);

    try {
        const [results] = await connection.query(query, queryParams);
        return res.status(200).json(results);
    } catch (error) {
        if (error.sqlMessage === `Incorrect DATE value: '${date}'`) {
            return res.status(400).json({error: "Invalid date format"});
        }
        console.error("Error fetching orders:", error);
        return res.status(500).json({error: "Internal server error"});
    }
});

export default router;