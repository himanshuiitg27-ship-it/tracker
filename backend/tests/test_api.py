"""End-to-end API tests. Run against whatever DATABASE_URL points at (a throwaway DB!)."""
import os
from datetime import date, timedelta

import pytest
from fastapi.testclient import TestClient

from app.database import Base, engine
from app.main import app


@pytest.fixture()
def client():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    with TestClient(app) as c:
        yield c


def d(days_ago: int) -> str:
    return (date.today() - timedelta(days=days_ago)).isoformat()


def add(client, start, end=None, notes=None):
    return client.post("/api/periods", json={"start_date": start, "end_date": end, "notes": notes})


def test_health(client):
    assert client.get("/api/health").json()["status"] == "ok"


def test_create_list_persist_and_order(client):
    assert add(client, d(60), d(56)).status_code == 201
    assert add(client, d(32), d(28)).status_code == 201
    assert add(client, d(4), d(1), "light").status_code == 201
    rows = client.get("/api/periods").json()
    assert [r["start_date"] for r in rows] == [d(60), d(32), d(4)]  # chronological
    assert rows[0]["cycle_length"] is None
    assert rows[1]["cycle_length"] == 28
    assert rows[2]["duration_days"] == 4
    assert rows[2]["notes"] == "light"


def test_new_period_never_overwrites_old(client):
    first = add(client, d(40), d(36)).json()
    add(client, d(10), d(6))
    rows = client.get("/api/periods").json()
    assert len(rows) == 2
    assert any(r["id"] == first["id"] and r["end_date"] == d(36) for r in rows)


def test_duplicate_start_rejected(client):
    assert add(client, d(20), d(16)).status_code == 201
    r = add(client, d(20), d(15))
    assert r.status_code == 409
    assert len(client.get("/api/periods").json()) == 1


def test_overlap_rejected(client):
    add(client, d(20), d(15))
    assert add(client, d(17), d(14)).status_code == 409
    assert add(client, d(25), d(18)).status_code == 409


def test_validation(client):
    assert add(client, (date.today() + timedelta(days=10)).isoformat()).status_code == 422
    assert add(client, d(10), d(12)).status_code == 422  # end before start
    assert add(client, d(60), d(30)).status_code == 422  # too long
    assert add(client, "not-a-date").status_code == 422
    assert client.get("/api/periods").json() == []


def test_ongoing_period_rules(client):
    assert add(client, d(3)).status_code == 201  # ongoing
    r = add(client, d(1))  # can't start another while one is open
    assert r.status_code == 409
    p = client.get("/api/periods").json()[0]
    assert p["is_ongoing"] and p["duration_days"] is None
    # close it, then a later one is fine
    assert client.put(f"/api/periods/{p['id']}", json={"start_date": d(3), "end_date": d(1)}).status_code == 200
    assert add(client, d(0)).status_code == 201


def test_edit_and_delete(client):
    a = add(client, d(60), d(56)).json()
    b = add(client, d(30), d(26)).json()
    r = client.put(f"/api/periods/{b['id']}", json={"start_date": d(31), "end_date": d(27), "notes": "edited"})
    assert r.status_code == 200 and r.json()["start_date"] == d(31)
    # editing onto another record's start date is a conflict
    assert client.put(f"/api/periods/{b['id']}", json={"start_date": d(60), "end_date": d(58)}).status_code == 409
    # saving a record without changing dates is fine (excludes itself)
    assert client.put(f"/api/periods/{a['id']}", json={"start_date": d(60), "end_date": d(56)}).status_code == 200
    assert client.delete(f"/api/periods/{a['id']}").status_code == 204
    assert client.delete(f"/api/periods/{a['id']}").status_code == 404
    assert len(client.get("/api/periods").json()) == 1


def test_stats(client):
    s = client.get("/api/stats").json()
    assert s["total_periods"] == 0 and s["next_period_start"] is None and s["average_cycle_is_estimate"]
    # starts 84, 56, 28, 0 days ago -> 28-day cycles
    for ago in (84, 56, 28):
        add(client, d(ago), d(ago - 4))
    add(client, d(10), d(6))
    s = client.get("/api/stats").json()
    assert s["total_periods"] == 4
    assert s["last_period_start"] == d(10)
    assert s["current_cycle_day"] == 11
    lengths = [c["cycle_length"] for c in s["cycle_lengths"]]
    assert lengths == [28, 28, 18]
    assert s["average_cycle_length"] == round(74 / 3)
    expected_next = date.today() - timedelta(days=10) + timedelta(days=s["average_cycle_length"])
    assert s["next_period_start"] == expected_next.isoformat()
    assert len(s["predictions"]) == 3
    assert s["shortest_cycle"] == 18 and s["longest_cycle"] == 28


def test_symptoms_upsert(client):
    body = {"log_date": d(1), "cramps": 4, "energy": 2, "mood": "tired", "flow": "heavy", "notes": " rough day "}
    r = client.put("/api/symptoms", json=body)
    assert r.status_code == 200 and r.json()["notes"] == "rough day"
    body["cramps"] = 1
    r2 = client.put("/api/symptoms", json=body)
    assert r2.json()["id"] == r.json()["id"] and r2.json()["cramps"] == 1
    assert len(client.get("/api/symptoms").json()) == 1
    assert client.put("/api/symptoms", json={**body, "cramps": 9}).status_code == 422
    assert client.put("/api/symptoms", json={**body, "mood": "bogus"}).status_code == 422
    assert client.delete(f"/api/symptoms/{r.json()['id']}").status_code == 204
