import express from "express";
import isAuthorized from "../../../middleware/auth.js";
import connection from "../../../db.js";
import bcrypt from "bcrypt";

const router = express.Router();

// noinspection JSCheckFunctionSignatures
router.patch("/:id", isAuthorized(["customer", "admin"]), async (req, res) => {
    const userId = req.params.id;
    let {name, email, role, password} = req.body;

    if (role && res.locals.role !== 'admin') {
        return res.status(403).json({error: "Only admins can change user roles"});
    }

    if (!userId || Number.isNaN(userId)) {
        return res.status(400).json({error: "Invalid user ID"});
    }

    if (!name && !email && !role && !password) {
        return res.status(400).json({error: "At least one field to update is required"});
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({error: "Invalid email format"});
    }

    const [results] = await connection.query("SELECT * FROM Users WHERE id = ? LIMIT 1;", [userId]);

    if (results.length === 0) {
        return res.status(404).json({error: "User not found"});
    }

    const user = results[0];
    if (!name) {
        name = user.name;
    }
    if (!email) {
        email = user.email;
    }
    if (!role) {
        role = user.role;
    } else if (!['customer', 'chef', 'admin'].includes(role)) {
        return res.status(400).json({error: "Invalid role"});
    }

    let passwordHash = user.password_hash;
    if (password) {
        if (password.length < 8) {
            return res.status(400).json({error: "Password must be at least 8 characters long"});
        }
        const salt = await bcrypt.genSalt(10); // TODO: make your own salt
        passwordHash = await bcrypt.hash(password, salt);
    }

    try {
        await connection.query("UPDATE Users SET name = ?, email = ?, role = ?, password_hash = ? WHERE id = ?;", [name, email, role, passwordHash, userId]);
        res.status(200).json({message: "User updated successfully"});
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({error: "Internal server error"});
    }
});

export default router;