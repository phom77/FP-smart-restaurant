# Project Updates - Port Configuration

## [2026-01-08] Backend Port Change

The backend server port has been changed from `5000` to `5001`.

### Reason
- Updated as per user request (possibly to avoid conflicts with other services like Control Center or system services often running on 5000 on macOS).

### Changes
1.  **Backend Config**: `backend/src/index.js` default port updated to `5001`.
2.  **Docker**: `docker-compose.yml` backend service now maps `5001:5001` and sets `PORT=5001`.
3.  **Frontend Config**: `frontend/src/services/api.js` points to `http://localhost:5001` as fallback.
4.  **Documentation**: `README.md` and `docs/api_endpoints.md` updated to reflect the new API base URL.

### Action Required
run `make stop` and `make dev` to apply changes.
