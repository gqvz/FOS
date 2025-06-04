import apiRouter from './routes/api/api.js';
import createError from "http-errors";
import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";

import {config} from "dotenv";
config({path: 'config/.env'})

const app = express();
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get the full path to this file
const __filename = fileURLToPath(import.meta.url);

// Get the directory name of this file
const __dirname = dirname(__filename);
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use("/api", apiRouter);

// catch 404 and forward to error handler
app.use((req, res, next) => {
    next(createError(404));
});

// error handler
app.use(/**
 * @param {express.Error} err
 * @param {express.Request} req
 * @param {express.Response} res
 * @param {express.NextFunction} _
 */
(err, req, res, _) => {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

export default app;
