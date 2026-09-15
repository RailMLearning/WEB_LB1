const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const port = Number(process.env.PORT || 8080);
const host = process.env.HOST || "127.0.0.1";
const contentTypes = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".ico": "image/x-icon",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".webmanifest": "application/manifest+json"
};
const roots = new Set(["templates", "scripts", "styles", "icons"]);

http.createServer((request, response) => {
    let requestPath;
    try {
        requestPath = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    } catch {
        response.writeHead(400).end();
        return;
    }

    if (requestPath === "/") requestPath = "/templates/table.html";
    const filePath = path.resolve(__dirname, `.${requestPath}`);
    const relativePath = path.relative(__dirname, filePath);
    const root = relativePath.split(path.sep)[0];

    if (!relativePath || relativePath.startsWith("..") || path.isAbsolute(relativePath) || !roots.has(root)) {
        response.writeHead(403).end();
        return;
    }

    fs.readFile(filePath, (error, data) => {
        if (error) {
            response.writeHead(error.code === "ENOENT" ? 404 : 500).end("Not found");
            return;
        }
        response.writeHead(200, {
            "Content-Type": contentTypes[path.extname(filePath)] || "application/octet-stream",
            "Cache-Control": "no-store"
        }).end(data);
    });
}).listen(port, host, () => console.log(`http://${host}:${port}`));