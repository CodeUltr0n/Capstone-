"""Copy the local SQLite registry and history into the configured PostgreSQL database."""

from __future__ import annotations

import argparse
import sqlite3
import sys
from pathlib import Path

import app as service


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--source",
        type=Path,
        default=service.DB_PATH,
        help="SQLite database file to copy (defaults to ORCHESTRATOR_DB_PATH)",
    )
    args = parser.parse_args()
    if not service.DATABASE_URL.startswith(("postgres://", "postgresql://")):
        parser.error("Set ORCHESTRATOR_DATABASE_URL to a PostgreSQL connection URL before migrating.")
    if not args.source.is_file():
        parser.error(f"SQLite source does not exist: {args.source}")

    with sqlite3.connect(args.source) as source:
        source.row_factory = sqlite3.Row
        servers = source.execute("SELECT id, name, url, transport, status, last_latency_ms, created_at FROM servers").fetchall()
        executions = source.execute(
            "SELECT id, query, server, tool, latency_ms, status, confidence, result_json, error, created_at FROM executions"
        ).fetchall()

    service.initialize_db()
    with service.connect_db() as target:
        for row in servers:
            target.execute(
                "INSERT INTO servers (id, name, url, transport, status, last_latency_ms, created_at) "
                "VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT (id) DO NOTHING",
                tuple(row),
            )
        for row in executions:
            target.execute(
                "INSERT INTO executions (id, query, server, tool, latency_ms, status, confidence, result_json, error, created_at) "
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (id) DO NOTHING",
                tuple(row),
            )

    print(f"Copied {len(servers)} server records and {len(executions)} execution records.")
    print("Existing PostgreSQL records with matching IDs were left unchanged; the SQLite source was not modified.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
