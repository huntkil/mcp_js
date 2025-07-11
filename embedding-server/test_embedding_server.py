import pytest

# 더미 테스트 (pytest가 정상 동작하는지 확인)
def test_dummy():
    assert 1 + 1 == 2

# FastAPI 앱이 있으면 아래와 같이 테스트할 수 있습니다.
try:
    from embedding_server import app
    from fastapi.testclient import TestClient

    client = TestClient(app)

    def test_health_check():
        response = client.get("/")
        assert response.status_code == 200
except ImportError:
    pass 