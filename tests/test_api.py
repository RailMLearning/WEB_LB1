import json
import tempfile
import unittest
from pathlib import Path

from fastapi.testclient import TestClient

from server import store
from server.routers.serve import app


class StudentApiTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.original_path = store.DB_PATH
        store.DB_PATH = Path(self.directory.name) / "db.json"
        self.client = TestClient(app, raise_server_exceptions=False)
        self.student = {
            "isu": "001234", "fio": "Анна", "grid": "M3301",
            "dnum": "8", "rnum": "301", "expdate": "2027-06-30",
            "foreigner": "false", "notes": "Проверка"
        }

    def tearDown(self):
        self.client.close()
        store.DB_PATH = self.original_path
        self.directory.cleanup()

    def assert_error(self, response, status, field=None):
        self.assertEqual(response.status_code, status, response.text)
        errors = response.json()["detail"]
        self.assertTrue(errors)
        for error in errors:
            self.assertEqual(set(error), {"field", "message"})
        if field:
            self.assertIn(field, [error["field"] for error in errors])

    def create(self, **changes):
        response = self.client.post("/api/requests", json={**self.student, **changes})
        self.assertEqual(response.status_code, 201, response.text)
        return response.json()

    def test_create_normalizes_and_persists(self):
        created = self.create(fio="  Анна   Мария  ")
        self.assertEqual(created["fio"], "Анна Мария")
        self.assertEqual(created["isu"], "001234")
        self.assertEqual(created["dnum"], 8)
        self.assertIs(created["foreigner"], False)
        self.assertEqual(json.loads(store.DB_PATH.read_text(encoding="utf-8")), [created])
        self.assertEqual(self.client.get("/api/requests/001234").json(), created)
        without_notes = {key: value for key, value in self.student.items() if key != "notes"}
        without_notes["isu"] = "001235"
        self.assertEqual(self.client.post("/api/requests", json=without_notes).json()["notes"], "")

    def test_validation_cannot_be_bypassed(self):
        cases = {
            "isu": [123456, "123", "１２３４５", None],
            "fio": ["Анна123", "", "a" * 151, None],
            "grid": ["3301", "m3301", None],
            "dnum": [0, True, 1.5, "1.0", "9" * 5000, 9007199254740992, None],
            "rnum": [-1, False, None],
            "expdate": ["2026-02-30", "1899-01-01", "2027-6-30", None],
            "foreigner": [1, "on", None],
            "notes": ["a" * 501, False, None]
        }
        for field, values in cases.items():
            for value in values:
                with self.subTest(field=field, value=str(value)[:40]):
                    response = self.client.post("/api/requests", json={**self.student, field: value})
                    self.assert_error(response, 422, field)
        self.assert_error(self.client.post("/api/requests", json={}), 422, "isu")
        self.assert_error(self.client.post("/api/requests", json={**self.student, "unknown": 1}), 422, "unknown")
        self.assertEqual(self.client.get("/api/requests").json(), [])

    def test_body_errors_remain_400(self):
        for method, url in [("POST", "/api/requests"), ("PATCH", "/api/requests/001234"), ("QUERY", "/api/requests")]:
            with self.subTest(method=method):
                self.assert_error(self.client.request(method, url, content="{", headers={"Content-Type": "application/json"}), 400)
                for value in [[], None, "text", 42, True]:
                    self.assert_error(self.client.request(method, url, content=json.dumps(value), headers={"Content-Type": "application/json"}), 400)

    def test_patch_preserves_omitted_fields(self):
        created = self.create()
        response = self.client.patch("/api/requests/001234", json={"notes": ""})
        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(response.json(), {**created, "notes": ""})
        self.assertEqual(self.client.patch("/api/requests/001234", json={}).json(), response.json())
        for field in self.student:
            with self.subTest(field=field):
                self.assert_error(self.client.patch("/api/requests/001234", json={field: None}), 422, field)
        self.assertEqual(self.client.get("/api/requests/001234").json(), response.json())

    def test_duplicate_and_id_change(self):
        self.create()
        self.assert_error(self.client.post("/api/requests", json=self.student), 409)
        self.create(isu="001235")
        self.assert_error(self.client.patch("/api/requests/001234", json={"isu": "001235"}), 409)
        response = self.client.patch("/api/requests/001234", json={"isu": "001236"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["isu"], "001236")
        self.assert_error(self.client.get("/api/requests/001234"), 404)

    def test_get_and_query_filters(self):
        self.create()
        self.create(isu="001235", grid="M3302", dnum=9)
        filters = {"group": "M3301", "dormitory": "8", "foreigner": "false", "notes": "пРОВЕРКА"}
        expected = self.client.get("/api/requests", params=filters).json()
        self.assertEqual(len(expected), 1)
        self.assertEqual(expected[0]["isu"], "001234")
        self.assertEqual(self.client.request("QUERY", "/api/requests", json=filters).json(), expected)
        self.assert_error(self.client.get("/api/requests?unknown=1"), 422)
        self.assert_error(self.client.get("/api/requests?group=M3301&grid=M3302"), 422)
        self.assert_error(self.client.request("QUERY", "/api/requests", json={"rnum": None}), 422, "rnum")

    def test_delete_and_missing_student(self):
        self.create()
        second = self.create(isu="001235")
        response = self.client.delete("/api/requests/001234")
        self.assertEqual(response.status_code, 204)
        self.assertEqual(response.content, b"")
        self.assertEqual(self.client.get("/api/requests").json(), [second])
        self.assert_error(self.client.delete("/api/requests/001234"), 404)
        self.assert_error(self.client.patch("/api/requests/001234", json={"notes": "x"}), 404)

    def test_storage_error_and_openapi(self):
        store.DB_PATH.write_text("{broken", encoding="utf-8")
        self.assert_error(self.client.get("/api/requests"), 500)
        schema = self.client.get("/openapi.json").json()
        self.assertIn("StudentCreate", schema["components"]["schemas"])
        self.assertIn("StudentUpdate", schema["components"]["schemas"])
        self.assertEqual(schema["components"]["schemas"]["StudentUpdate"].get("required", []), [])
        self.assertEqual(schema["components"]["schemas"]["StudentCreate"]["additionalProperties"], False)


if __name__ == "__main__":
    unittest.main()
