import createError from "http-errors";

const jwt = require("jsonwebtoken");
const express = require("express");

function isAuthorized(role) {
    /**
     * @param {express.Request} req
     * @param {express.Response} res
     * @param {express.NextFunction} next
     */
    function middleware(req, res, next) {
        const jwt = req.cookies['jwt'];
        if (!jwt) {
            return next(createError(401));
        }
        jwt.verify(jwt, process.env.JWT_SECRET, {
            algorithms: ['HS256'],
            audience: "https://fos.garvit.tech",
            issuer: "https://fos.garvit.tech",
        }, (err, decoded) => {
            if (err) {
                return next(createError(401));
            }

            if (decoded.role !== role) {
                return next(createError(401));
            }

            next();
        })
    }
    return middleware;
}

module.exports = isAuthorized;