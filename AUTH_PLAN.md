# Canvas Cal Authentication & Multi-User Architecture Plan

**Version:** 1.0  
**Date:** January 17, 2026  
**Goal:** Transition from a single-user "API Key Paste" model to a secure, database-backed multi-user OAuth2 system.

---

## 1. High-Level Architecture

The authentication system will rely on **Supabase Auth** for user identity management and a custom Python backend for handling OAuth2 exchanges with Canvas and Google Calendar.

### Components
1.  **Identity Provider (IdP):** Supabase Auth (handles "Sign in with Google").
2.  **Token Store:** A secure PostgreSQL table (via Supabase) storing encrypted Access & Refresh tokens for third-party services.
3.  **Backend Middleware:** Intercepts requests, validates the User Session, decrypts tokens, and proxies requests to Canvas/Google.

---

## 2. Database Schema (Supabase)

We need a dedicated table to store user-specific credentials. **Security Note:** Tokens must never be stored in plain text.

### Table: `user_integrations`

| Column | Type | Description |
| :--- | :--- | :--- |
| `user_id` | `UUID` (PK) | References `auth.users.id` (Supabase Auth ID) |
| `email` | `TEXT` | User's email address |
| `canvas_base_url` | `TEXT` | e.g., `https://canvas.instructure.com` |
| `canvas_access_token` | `TEXT` | **Encrypted** OAuth2 Access Token |
| `canvas_refresh_token` | `TEXT` | **Encrypted** OAuth2 Refresh Token |
| `canvas_token_expires_at`| `TIMESTAMP` | When the access token needs refreshing |
| `google_access_token` | `TEXT` | **Encrypted** Google Calendar Token |
| `google_refresh_token` | `TEXT` | **Encrypted** Google Calendar Refresh Token |
| `created_at` | `TIMESTAMP` | Record creation time |
| `updated_at` | `TIMESTAMP` | Last update time |

---

## 3. User Flows

### A. Initial Sign-Up / Login
1.  **Frontend:** User clicks "Sign in with Google" (Supabase Auth).
2.  **Supabase:** Authenticates user and returns a JWT (`access_token`).
3.  **Frontend:** Stores JWT in memory/cookie and sends it in the `Authorization: Bearer <token>` header for all backend requests.

### B. Connecting Canvas (The "OAuth Dance")
1.  **Frontend:** User clicks "Connect Canvas".
2.  **Frontend:** Redirects user to Backend endpoint: `GET /auth/canvas/login?user_id=...`
3.  **Backend:** Constructs the Canvas Authorization URL and redirects user to:
    `https://<canvas_url>/login/oauth2/auth?client_id=...&response_type=code&redirect_uri=...`
4.  **User:** Approves the app on Canvas.
5.  **Canvas:** Redirects back to `GET /auth/canvas/callback?code=...`
6.  **Backend:** 
    *   Exchanges `code` for `access_token` and `refresh_token`.
    *   **Encrypts** the tokens (using `fernet` or similar).
    *   Upserts the record in `user_integrations` table matching the session user.
    *   Redirects user back to Frontend Dashboard with `?status=success`.

### C. Fetching Assignments (Authenticated)
1.  **Frontend:** Requests `GET /canvas/assignments` (No params).
2.  **Backend:**
    *   Decodes JWT to identify `user_id`.
    *   Queries `user_integrations` for the encrypted Canvas token.
    *   **Decrypts** the token.
    *   Checks expiry. If expired, uses `refresh_token` to get a new one (and updates DB).
    *   Calls Canvas API using the valid token.
    *   Returns data to Frontend.

---

## 4. Backend Implementation Tasks

### Phase 1: Dependencies & Crypto
- [ ] Install `cryptography` library for token encryption.
- [ ] Generate a `SECRET_KEY` for encryption (store in `.env`).

### Phase 2: Supabase Connection
- [ ] Configure `supabase-py` client in Backend.
- [ ] Create middleware to validate Supabase JWTs on protected routes.

### Phase 3: OAuth Endpoints
- [ ] Implement `GET /auth/canvas/login`
- [ ] Implement `GET /auth/canvas/callback`
- [ ] Implement `GET /auth/google/login`
- [ ] Implement `GET /auth/google/callback`

---

## 5. Security Checklist
- [ ] **HTTPS Only:** Ensure cookies and redirects only work over HTTPS (local dev exception).
- [ ] **State Parameter:** Use a random `state` string in OAuth requests to prevent CSRF attacks.
- [ ] **Token Rotation:** Ensure Refresh Tokens are rotated if the provider issues new ones.
- [ ] **Scope Minimization:** Only request `url:GET|/api/v1/courses` and `url:GET|/api/v1/planner/items` scopes.
