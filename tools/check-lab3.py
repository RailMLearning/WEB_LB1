import concurrent.futures
import json
import os
import secrets
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = os.environ.get("LAB3_URL", "http://127.0.0.1:8080")
ENV = dict(line.split("=", 1) for line in (ROOT / ".env").read_text(encoding="utf-8-sig").splitlines() if "=" in line and not line.startswith("#"))
CHECKS = []


def request(method, path, body=None, token=None, raw=None):
    headers = {}
    if body is not None or raw is not None:
        headers["Content-Type"] = "application/json"
    if token:
        headers["Authorization"] = "Bearer " + token
    data = raw if raw is not None else json.dumps(body, ensure_ascii=False).encode() if body is not None else None
    req = urllib.request.Request(BASE + path, data=data, headers=headers, method=method)
    try:
        response = urllib.request.urlopen(req, timeout=30)
    except urllib.error.HTTPError as error:
        response = error
    payload = response.read()
    return response.status, json.loads(payload) if payload else None, dict(response.headers), payload


def check(name, actual, expected):
    if actual != expected:
        raise AssertionError(f"{name}: expected {expected!r}, got {actual!r}")
    CHECKS.append(name)
    print("OK " + name, flush=True)


def main():
    suffix = str(time.time_ns())[-12:]
    username = "check" + suffix
    password = "LabTestPassword1!"
    first = str(9000000 + secrets.randbelow(900000))
    second = str(int(first) + 1)
    moved = str(int(first) + 2)
    keys = {first, second, moved}
    fixture = dict(isu=first, fio="  Анна-Мария  ", grid="M3301", dnum="08", rnum="042", expdate="2026-10-12", foreigner=False, notes="lab3 " + suffix)
    admin = request("POST", "/api/auth/login", dict(username=ENV["ADMIN_USERNAME"], password=ENV["ADMIN_PASSWORD"]))
    check("admin login", admin[0], 200)
    admin_token = admin[1]["accessToken"]
    user_token = None
    try:
        check("anonymous denied", request("GET", "/api/requests")[0], 401)
        registration = dict(username=username, email=username + "@example.com", password=password)
        registered = request("POST", "/api/auth/register", registration)
        check("register", registered[0], 201)
        check("registration always USER", registered[1]["role"], "USER")
        check("no password in user DTO", "passwordHash" in registered[1], False)
        check("duplicate username", request("POST", "/api/auth/register", registration)[0], 409)
        check("role injection rejected", request("POST", "/api/auth/register", {**registration, "role": "ADMIN"})[0], 422)
        check("weak password", request("POST", "/api/auth/register", {**registration, "password": "short"})[0], 422)
        check("bad login", request("POST", "/api/auth/login", dict(username=username, password="WrongPassword1!"))[0], 401)
        logged = request("POST", "/api/auth/login", dict(username=username, password=password))
        check("user login", logged[0], 200)
        user_token = logged[1]["accessToken"]
        refresh = logged[1]["refreshToken"]
        check("user me", request("GET", "/api/auth/me", token=user_token)[1]["username"], username)
        check("USER cannot create", request("POST", "/api/requests", fixture, user_token)[0], 403)
        created = request("POST", "/api/requests", fixture, admin_token)
        check("ADMIN create", created[0], 201)
        check("public Location through proxy", next(v for k, v in created[2].items() if k.lower() == "location"), "/api/requests/" + first)
        check("normalized name", created[1]["fio"], "Анна-Мария")
        check("number normalization", created[1]["dnum"], 8)
        check("boolean false preserved", created[1]["foreigner"], False)
        check("duplicate ISU", request("POST", "/api/requests", fixture, admin_token)[0], 409)
        concurrent_isu = str(int(first) + 3)
        keys.add(concurrent_isu)
        with concurrent.futures.ThreadPoolExecutor(2) as pool:
            duplicates = list(pool.map(lambda _: request("POST", "/api/requests", {**fixture, "isu": concurrent_isu}, admin_token)[0], range(2)))
        check("concurrent duplicate ISU", sorted(duplicates), [201, 409])
        request("DELETE", "/api/requests/" + concurrent_isu, token=admin_token)
        check("USER can read", request("GET", "/api/requests/" + first, token=user_token)[0], 200)
        for method, body in [("PATCH", {"rnum": 44}), ("PUT", fixture), ("DELETE", None)]:
            check("USER denied " + method, request(method, "/api/requests/" + first, body, user_token)[0], 403)
        for field, value in [("fio", "Иван2"), ("isu", 123456), ("rnum", True), ("rnum", 1.5), ("rnum", 0), ("expdate", "2026-02-30"), ("foreigner", None), ("notes", "x" * 501)]:
            check("reject " + field + ": " + str(value)[:18], request("PATCH", "/api/requests/" + first, {field: value}, admin_token)[0], 422)
        check("invalid change not saved", request("GET", "/api/requests/" + first, token=user_token)[1]["rnum"], 42)
        check("malformed JSON", request("POST", "/api/requests", token=admin_token, raw=b"{")[0], 400)
        check("non-object JSON", request("POST", "/api/requests", [], admin_token)[0], 400)
        changed = request("PATCH", "/api/requests/" + first, {"rnum": 44, "notes": ""}, admin_token)
        check("partial update", changed[0], 200)
        check("omitted field retained", changed[1]["fio"], "Анна-Мария")
        check("empty notes preserved", changed[1]["notes"], "")
        check("full PUT requires fields", request("PUT", "/api/requests/" + first, {"rnum": 45}, admin_token)[0], 422)
        check("full PUT", request("PUT", "/api/requests/" + first, fixture, admin_token)[0], 200)
        other = {**fixture, "isu": second, "fio": "Борис", "rnum": 43}
        check("second create", request("POST", "/api/requests", other, admin_token)[0], 201)
        check("ISU change conflict", request("PATCH", "/api/requests/" + first, {"isu": second}, admin_token)[0], 409)
        page = request("GET", "/api/requests?notes=" + suffix + "&sort=isu&order=desc&page=0&size=1", token=user_token)
        check("sort desc", page[1][0]["isu"], second)
        check("pagination total", next(v for k, v in page[2].items() if k.lower() == "x-total-count"), "2")
        page2 = request("GET", "/api/requests?notes=" + suffix + "&sort=isu&order=desc&page=1&size=1", token=user_token)
        check("pagination second page", page2[1][0]["isu"], first)
        filters = dict(group="M3301", dormitory=8, foreigner=False, notes=suffix, sort="isu", size=10)
        queried = request("QUERY", "/api/requests", filters, user_token)
        check("QUERY status", queried[0], 200)
        check("QUERY false filter", len(queried[1]), 2)
        check("search", request("GET", "/api/requests?q=" + suffix, token=user_token)[1][0]["notes"], fixture["notes"])
        for query in ("sort=passwordHash", "page=-1", "size=0", "group=M3301&grid=M3301", "size=1&size=2"):
            check("invalid query " + query, request("GET", "/api/requests?" + query, token=user_token)[0], 422)
        check("leading zeros", request("POST", "/api/requests", {**fixture, "isu": "0" + first[1:]}, admin_token)[1]["isu"], "0" + first[1:])
        keys.add("0" + first[1:])
        check("change ISU", request("PATCH", "/api/requests/" + first, {"isu": moved}, admin_token)[0], 200)
        check("old ISU missing", request("GET", "/api/requests/" + first, token=user_token)[0], 404)
        check("new ISU exists", request("GET", "/api/requests/" + moved, token=user_token)[0], 200)
        check("tampered token", request("GET", "/api/requests", token=user_token[:-6] + "broken")[0], 401)
        check("refresh not access", request("GET", "/api/requests", token=refresh)[0], 401)
        refreshed = request("POST", "/api/auth/refresh", dict(refreshToken=refresh))
        check("refresh", refreshed[0], 200)
        check("old refresh rejected", request("POST", "/api/auth/refresh", dict(refreshToken=refresh))[0], 401)
        new_refresh = refreshed[1]["refreshToken"]
        with concurrent.futures.ThreadPoolExecutor(2) as pool:
            results = list(pool.map(lambda _: request("POST", "/api/auth/refresh", dict(refreshToken=new_refresh)), range(2)))
        check("concurrent refresh one-time", sorted(r[0] for r in results), [200, 401])
        active = next(r[1] for r in results if r[0] == 200)
        check("logout", request("POST", "/api/auth/logout", dict(refreshToken=active["refreshToken"]))[0], 204)
        check("revoked refresh rejected", request("POST", "/api/auth/refresh", dict(refreshToken=active["refreshToken"]))[0], 401)
        removed = request("DELETE", "/api/requests/" + moved, token=admin_token)
        check("delete", removed[0], 204)
        check("204 empty body", removed[3], b"")
        check("missing after delete", request("GET", "/api/requests/" + moved, token=user_token)[0], 404)
        spec = request("GET", "/api/openapi.json")
        check("OpenAPI", spec[1]["openapi"], "3.0.3")
        check("OpenAPI has PUT", "put" in spec[1]["paths"]["/requests/{isu}"], True)
    finally:
        for key in keys:
            request("DELETE", "/api/requests/" + key, token=admin_token)
    print(f"PASSED {len(CHECKS)} checks. Test account: {username}")
    return username


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    main()
