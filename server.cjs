const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const port = Number(process.env.PORT || 8080);
const host = process.env.HOST || "127.0.0.1";
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".ico": "image/x-icon", ".png": "image/png", ".svg": "image/svg+xml", ".webmanifest": "application/manifest+json" };
http.createServer((req, res) => {
    let relative;
    try {
        relative = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    } catch {
        res.writeHead(400).end();
        return;
    }
    if (relative === "/") relative = "/templates/table.html";
    const file = path.resolve(__dirname, "." + relative);
    if (!file.startsWith(__dirname + path.sep) || !["templates", "scripts", "styles", "icons"].includes(path.relative(__dirname, file).split(path.sep)[0])) {
        res.writeHead(403).end();
        return;
    }
    fs.readFile(file, (error, data) => {
        if (error) res.writeHead(404).end("Not found");
        else res.writeHead(200, { "Content-Type": types[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-store" }).end(data);
    });
}).listen(port, host, () => console.log(`http://${host}:${port}`));
