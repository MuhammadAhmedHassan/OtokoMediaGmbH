This is a small token management service built with the [Next.js](https://nextjs.org) App Router.

It exposes a typed API for creating and listing user access tokens with scopes and expiry, plus a minimal frontend to exercise the API.

## Stack

- **Framework**: Next.js (App Router, TypeScript)
- **Runtime**: Node.js (API routes)
- **Storage**: In-memory store (module-level array)

> **Note**: In-memory storage is used for simplicity:
> - Tokens are lost when the server restarts.
> - Tokens are not shared across multiple instances of the app.

## Running the Project

Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

Then open `http://localhost:3000` in your browser.

The home page provides:

- A form to **create a token** (userId, scopes, expiry).
- A form to **list all non-expired tokens** for a given `userId`.

## API Overview

### `POST /api/tokens`

Create a new token for a user.

**Request body (JSON)**:

```json
{
  "userId": "123",
  "scopes": ["read", "write"],
  "expiresInMinutes": 60
}
```

**Validation**

- `userId`: non-empty string.
- `scopes`: non-empty array of non-empty strings.
- `expiresInMinutes`: positive integer.

**Response (201, JSON)**:

```json
{
  "id": "token_abc123",
  "userId": "123",
  "scopes": ["read", "write"],
  "createdAt": "2025-01-01T10:00:00.000Z",
  "expiresAt": "2025-01-01T11:00:00.000Z",
  "token": "9f0c2d6a3b..."
}
```

### `GET /api/tokens?userId=123`

List all **non-expired** tokens for a user.

- Required query param: `userId` (non-empty string).
- Expired tokens are filtered out server-side.

**Response (200, JSON)**:

```json
[
  {
    "id": "token_abc123",
    "userId": "123",
    "scopes": ["read", "write"],
    "createdAt": "2025-01-01T10:00:00.000Z",
    "expiresAt": "2025-01-01T11:00:00.000Z",
    "token": "9f0c2d6a3b..."
  }
]
```

## Implementation Notes & Assumptions

- Tokens are stored in an in-memory array in `lib/tokens.ts`.
- Tokens are identified by an `id` like `token_<uuid>` and a separate random token string.
- Dates are stored as `Date` instances server-side and returned as ISO8601 strings in the API.
- No authentication is implemented for the API endpoints (could be added via an API key header or similar).

