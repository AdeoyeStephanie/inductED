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

