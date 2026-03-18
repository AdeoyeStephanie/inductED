# WICS Point Tracker

A point tracking web app for **Morgan State University's WICS (Women in Computer Science)** organization. Built with React and Firebase.

## Features

- **Login / Sign up** — Email and password auth (open to everyone)
- **Dashboard** — Personal view; UI varies by status (prospective, inducted, officer)
- **Submit** — Prospective members can submit point claims
- **Officer** — Officers can approve or reject pending claims

### User statuses

| Status       | Can submit points? | Can approve/reject? | Dashboard view                    |
|-------------|--------------------|----------------------|-----------------------------------|
| Prospective | Yes                | No                   | Total, progress, submit link      |
| Inducted    | No                 | No                   | Read-only history + inducted badge|
| Officer     | No                 | Yes                  | Link to officer dashboard         |

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Firebase project

1. Create a project at [Firebase Console](https://console.firebase.google.com).
2. Enable **Authentication** → Sign-in method → **Email/Password**.
3. Create a **Firestore Database** (start in test mode for dev, then add rules).
4. Get your config: Project Settings → Your apps → Add app (Web) → copy the `firebaseConfig` object.

### 3. Add your Firebase config

Open `src/firebase/config.js` and replace the placeholder values with your config:

```js
const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT_ID.appspot.com',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'YOUR_APP_ID',
};
```

### 4. Firestore indexes (required for queries)

In Firebase Console → Firestore → Indexes, create these **composite indexes**:

- **Collection:** `pointClaims`  
  **Fields:** `userId` (Ascending), `createdAt` (Descending)

- **Collection:** `pointClaims`  
  **Fields:** `status` (Ascending), `createdAt` (Ascending)

Or run the app once; the Firebase error message will include a link to auto-create the index.

### 5. Firestore security rules (example)

For production, lock down Firestore. Example rules:

- Users can read/write their own document in `users`.
- Users can create and read their own docs in `pointClaims`; officers can read all and update `status`, `reviewedAt`, `reviewedBy`.
- You’ll also need to update `users/{userId}.totalPoints` from the backend or via a Cloud Function when a claim is approved (this app does it from the client for simplicity).

### 6. Run the app

```bash
npm run dev
```

Open the URL shown (e.g. http://localhost:5173).

## Firestore data shape

### `users` collection

Each document ID = Firebase Auth UID.

| Field        | Type   | Description                          |
|-------------|--------|--------------------------------------|
| name        | string | Display name                         |
| email       | string | Email address                        |
| status      | string | `"prospective"` \| `"inducted"` \| `"officer"` |
| totalPoints | number | Sum of approved points               |

### `pointClaims` collection

| Field       | Type    | Description                    |
|------------|---------|--------------------------------|
| userId     | string  | Claimant’s UID                 |
| points     | number  | Points claimed                 |
| description| string  | What the points are for        |
| status     | string  | `"pending"` \| `"approved"` \| `"rejected"` |
| createdAt  | timestamp| When submitted                |
| reviewedAt | timestamp \| null | When reviewed          |
| reviewedBy | string \| null   | Officer UID who reviewed  |

## Folder structure

```
src/
  components/   # Navbar, ProtectedRoute
  context/      # AuthContext (current user + profile)
  firebase/     # config.js, authHelpers, roleHelper, firestoreHelpers
  pages/        # Login, Dashboard, Submit, Officer
  App.jsx
  main.jsx
```

## Making someone an officer or inducted

Update their document in the `users` collection in Firestore:

- Set `status` to `"officer"` or `"inducted"` as needed.

New sign-ups get `status: "prospective"` and `totalPoints: 0` by default.
