import { randomBytes } from "node:crypto";
import { existsSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const target = fileURLToPath(new URL("../.env", import.meta.url));
if (existsSync(target)) {
    console.log(".env already exists; unchanged.");
} else {
    const secret = () => randomBytes(32).toString("base64");
    const lines = [
        "DB_NAME=students",
        "DB_USER=students",
        `DB_PASSWORD=${secret()}`,
        `JWT_SECRET=${secret()}`,
        "JWT_ISSUER=students-lab",
        "ACCESS_TOKEN_SECONDS=900",
        "REFRESH_TOKEN_SECONDS=604800",
        "ADMIN_USERNAME=admin",
        "ADMIN_EMAIL=admin@students.local",
        `ADMIN_PASSWORD=${secret()}`,
        "API_PORT=8000",
        "FRONTEND_PORT=8080",
        "DEV_API_TARGET=http://127.0.0.1:8000"
    ];
    writeFileSync(target, lines.join("\n") + "\n", { flag: "wx", mode: 0o600 });
    console.log(
        ".env created. Administrator credentials are in ADMIN_USERNAME and ADMIN_PASSWORD."
    );
}
