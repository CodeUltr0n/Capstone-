import asyncio
import shlex
import shutil
import sys
import tempfile
import unittest
from unittest.mock import patch
from pathlib import Path
from types import SimpleNamespace

from fastapi.testclient import TestClient

import backend.app as service


class OrchestratorApiTests(unittest.TestCase):
    def setUp(self) -> None:
        self.scratch = Path(tempfile.mkdtemp(prefix="orchestrator-tests-"))
        service.DB_PATH = self.scratch / "test.sqlite3"
        self.client = TestClient(service.app)
        self.client.__enter__()
        fixture = Path(__file__).with_name("echo_server.py")
        command = f"stdio: {shlex.quote(sys.executable)} {shlex.quote(str(fixture))}"
        response = self.client.post(
            "/api/servers",
            json={"name": "Test MCP Server", "url": command, "transport": "STDIO"},
        )
        self.assertEqual(response.status_code, 201, response.text)
        self.server = response.json()

    def tearDown(self) -> None:
        self.client.__exit__(None, None, None)
        shutil.rmtree(self.scratch, ignore_errors=True)

    def test_health_and_server_registry(self) -> None:
        health = self.client.get("/api/health")
        self.assertEqual(health.json()["status"], "ok")
        servers = self.client.get("/api/servers").json()
        self.assertEqual([item["name"] for item in servers], ["Test MCP Server"])

        duplicate = self.client.post(
            "/api/servers",
            json={"name": "test mcp server", "url": "stdio: python fake.py", "transport": "STDIO"},
        )
        self.assertEqual(duplicate.status_code, 409)

        removed = self.client.delete(f"/api/servers/{self.server['id']}")
        self.assertEqual(removed.status_code, 204)
        self.assertEqual(self.client.get("/api/servers").json(), [])

    def test_chat_reports_when_no_server_is_registered(self) -> None:
        self.client.delete(f"/api/servers/{self.server['id']}")
        execution = self.client.post("/api/chat", json={"message": "echo hello"}).json()
        self.assertEqual(execution["status"], "error")
        self.assertIn("No MCP servers are registered", execution["content"])

    def test_ping_tool_call_and_execution_history(self) -> None:
        ping = self.client.post(f"/api/servers/{self.server['id']}/ping")
        self.assertEqual(ping.json()["status"], "connected")
        self.assertEqual(ping.json()["tools_count"], 2)

        execution = self.client.post("/api/chat", json={"message": "please echo hello"})
        self.assertEqual(execution.json()["status"], "success", execution.text)
        self.assertIn("echo:please echo hello", execution.json()["content"])

        history = self.client.get("/api/history").json()
        self.assertEqual(len(history), 1)
        self.assertEqual(history[0]["status"], "success")
        self.assertEqual(history[0]["tool"], "echo")
        self.assertGreater(history[0]["confidence"], 0)
        self.assertLessEqual(history[0]["confidence"], 100)

        cleared = self.client.delete("/api/history")
        self.assertEqual(cleared.status_code, 204)
        self.assertEqual(self.client.get("/api/history").json(), [])

    def test_history_filter_search_and_pagination(self) -> None:
        with service.connect_db() as connection:
            for index, (query, server, tool, status) in enumerate([
                ("weather in Tokyo", "Weather MCP", "forecast", "success"),
                ("read report", "Filesystem MCP", "read_file", "error"),
                ("weather in Osaka", "Weather MCP", "forecast", "success"),
            ]):
                connection.execute(
                    "INSERT INTO executions (id, query, server, tool, latency_ms, status, confidence, created_at) VALUES (?, ?, ?, ?, 10, ?, 50, ?)",
                    (f"history-{index}", query, server, tool, status, f"2026-01-0{index + 1}T00:00:00+00:00"),
                )

        self.assertEqual(len(self.client.get("/api/history?status=success").json()), 2)
        self.assertEqual(self.client.get("/api/history?search=Weather").json()[0]["server"], "Weather MCP")
        self.assertEqual(len(self.client.get("/api/history?search=%25").json()), 0)
        page = self.client.get("/api/history?limit=1&offset=1").json()
        self.assertEqual(len(page), 1)
        self.assertEqual(page[0]["id"], "history-1")

    def test_optional_bearer_auth_protects_api_routes(self) -> None:
        original_key = service.API_KEY
        service.API_KEY = "test-secret"
        try:
            self.assertEqual(self.client.get("/api/health").status_code, 200)
            self.assertEqual(self.client.get("/api/servers").status_code, 401)
            authorized = self.client.get("/api/servers", headers={"Authorization": "Bearer test-secret"})
            self.assertEqual(authorized.status_code, 200)
        finally:
            service.API_KEY = original_key

    def test_metrics_report_execution_and_server_counts(self) -> None:
        response = self.client.post("/api/chat", json={"message": "please echo hello"})
        self.assertEqual(response.json()["status"], "success")
        metrics = self.client.get("/api/metrics").json()
        self.assertEqual(metrics["executions"]["total"], 1)
        self.assertEqual(metrics["executions"]["succeeded"], 1)
        self.assertGreaterEqual(metrics["executions"]["average_latency_ms"], 0)
        self.assertEqual(metrics["servers"]["connected"], 1)

    def test_mcp_http_credentials_load_from_environment_only(self) -> None:
        with patch.dict("os.environ", {"MCP_SERVER_HEADERS_JSON": '{"server-id":{"Authorization":"Bearer private"}}'}):
            self.assertEqual(service.server_headers({"id": "server-id"}), {"Authorization": "Bearer private"})
            self.assertEqual(service.server_headers({"id": "other-id"}), {})
            self.assertNotIn("Authorization", self.client.get("/api/servers").json()[0])

    def test_model_router_only_returns_an_advertised_tool_and_arguments(self) -> None:
        captured = {}

        class MockResponse:
            def raise_for_status(self):
                return None

            def json(self):
                return {"output": [{"type": "function_call", "name": "mcp_tool_0", "arguments": '{"city":"Tokyo"}'}]}

        class MockClient:
            def __init__(self, **_kwargs):
                pass

            async def __aenter__(self):
                return self

            async def __aexit__(self, *_args):
                return None

            async def post(self, url, *, headers, json):
                captured.update({"url": url, "headers": headers, "payload": json})
                return MockResponse()

        server = {"id": "s1", "name": "Weather"}
        tool = SimpleNamespace(
            name="forecast",
            description="Weather forecast",
            inputSchema={"type": "object", "properties": {"city": {"type": "string"}}, "required": ["city"]},
        )
        with patch.dict("os.environ", {
            "ORCHESTRATOR_LLM_API_KEY": "test-provider-key",
            "ORCHESTRATOR_LLM_MODEL": "test-model",
            "ORCHESTRATOR_LLM_BASE_URL": "https://llm.example/v1",
        }), patch.object(service.httpx, "AsyncClient", MockClient):
            selected, arguments = asyncio.run(service.model_select_tool("weather in Tokyo", [(server, tool)]))

        self.assertEqual(selected, (server, tool))
        self.assertEqual(arguments, {"city": "Tokyo"})
        self.assertEqual(captured["url"], "https://llm.example/v1/responses")
        self.assertEqual(captured["payload"]["parallel_tool_calls"], False)

    def test_database_adapter_converts_placeholders_for_postgres(self) -> None:
        class FakePostgresConnection:
            def __init__(self):
                self.calls = []

            def execute(self, statement, values):
                self.calls.append((statement, values))

        raw = FakePostgresConnection()
        adapter = service.DatabaseConnection(raw, postgres=True)
        adapter.execute("SELECT * FROM servers WHERE id = ? AND name = ?", ("id", "name"))
        self.assertEqual(raw.calls, [("SELECT * FROM servers WHERE id = %s AND name = %s", ("id", "name"))])

    def test_server_marked_unavailable_is_retried_on_next_chat(self) -> None:
        with service.connect_db() as connection:
            connection.execute("UPDATE servers SET status = 'error' WHERE id = ?", (self.server["id"],))

        execution = self.client.post("/api/chat", json={"message": "please echo hello"})
        self.assertEqual(execution.json()["status"], "success", execution.text)
        server = self.client.get("/api/servers").json()[0]
        self.assertEqual(server["status"], "connected")

    def test_missing_arguments_can_be_supplied_on_retry(self) -> None:
        first = self.client.post("/api/chat", json={"message": "get weather forecast"}).json()
        self.assertEqual(first["status"], "error")
        self.assertEqual(first["tool"]["result"]["required_arguments"], ["city"])

        retry = self.client.post(
            "/api/chat",
            json={
                "message": "get weather forecast",
                "server_id": self.server["id"],
                "tool_name": "get_weather",
                "arguments": {"city": "Tokyo"},
            },
        ).json()
        self.assertEqual(retry["status"], "success", retry)
        self.assertIn("Weather for Tokyo: sunny", retry["content"])

    def test_schema_validation_rejects_wrong_argument_types(self) -> None:
        response = self.client.post(
            "/api/chat",
            json={
                "message": "get weather forecast",
                "server_id": self.server["id"],
                "tool_name": "get_weather",
                "arguments": {"city": 42},
            },
        ).json()
        self.assertEqual(response["status"], "error")
        self.assertIn("validation_error", response["tool"]["result"])

    def test_context_goal_is_only_a_small_ranking_tiebreaker(self) -> None:
        tool = SimpleNamespace(name="get_weather", description="Get the weather forecast for a city")
        query_score = service.rank_tool("weather", tool)
        context_score = service.rank_tool("weather", tool, ["city forecast"])
        self.assertGreater(context_score, query_score)
        self.assertEqual(service.rank_tool("unrelated", tool, ["city forecast"]), 0.4)

    def test_invalid_server_configuration_is_rejected(self) -> None:
        response = self.client.post(
            "/api/servers",
            json={"name": "Bad URL", "url": "file:///etc/passwd", "transport": "HTTP"},
        )
        self.assertEqual(response.status_code, 422)

        credential_url = self.client.post(
            "/api/servers",
            json={"name": "Credentials in URL", "url": "http://user:secret@localhost:8080/mcp", "transport": "HTTP"},
        )
        self.assertEqual(credential_url.status_code, 422)

        invalid_transport = self.client.post(
            "/api/servers",
            json={"name": "Unsupported", "url": "http://localhost:8080/mcp", "transport": "WEBSOCKET"},
        )
        self.assertEqual(invalid_transport.status_code, 422)


if __name__ == "__main__":
    unittest.main()
import asyncio
import json
