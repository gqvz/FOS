import jwt from "jsonwebtoken";
import express from "express"; // for intellisense

function isAuthorized(roles) {
    /**
     * @param {express.Request} req
     * @param {express.Response} res
     * @param {express.NextFunction} next
     */
    function middleware(req, res, next) {
        const jwtToken = req.cookies['jwt'];
        if (!jwtToken) {
            return res.status(401).json({error: "Unauthorized access token"});
        }
        jwt.verify(jwtToken, process.env.JWT_SECRET, {
            algorithms: ['HS256'],
            audience: "https://fos.garvit.tech",
            issuer: "https://fos.garvit.tech",
        }, (err, decoded) => {
            if (err) {
                return res.status(401).json({error: "Unauthorized access token"});
            }

            if (!roles.includes(decoded.role)) {
                return res.status(403).json({error: "You are not authorized to access this resource"});
            }

            res.locals.userId = decoded.userId;
            res.locals.role = decoded.role;
            res.locals.sessionId = decoded.sessionId;

            next();
        })
    }
    return middleware;
}

export default isAuthorized;