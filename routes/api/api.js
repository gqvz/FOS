import fs from "fs";

import path from "path";
import express from "express";
import {fileURLToPath} from 'url';
import {dirname} from 'path';

// Get the full path to this file
const __filename = fileURLToPath(import.meta.url);

// Get the directory name of this file
const __dirname = dirname(__filename);

const router = express.Router();
const subfolders = fs.readdirSync(__dirname, {withFileTypes: true})
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

await subfolders.forEach(subfolder => {
    const subfolderPath = path.join(__dirname, subfolder);
    const files = fs.readdirSync(subfolderPath)
        .filter(file => file.endsWith('.js'));

    return files.forEach(async file => {
        const routePath = `/${subfolder}`;
        const subRouter = await import(path.join(subfolderPath, file));
        router.use(routePath, subRouter.default);
    });
});

export default router;