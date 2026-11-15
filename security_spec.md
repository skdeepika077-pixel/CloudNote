# CloudNote Security Specification

## 1. Data Invariants
1. **Strict Ownership Isolation**: Every document under `/users/{userId}` and `/users/{userId}/notes/{noteId}` can only be read, listed, created, updated, or deleted when `request.auth != null && request.auth.uid == userId`.
2. **Path & ID Validation**: All document ID path parameters (`userId`, `noteId`) must satisfy `^[a-zA-Z0-9_-]+$` and length `<= 128` on single-document operations (`get`, `create`, `update`, `delete`).
3. **Schema & Size Boundaries**:
   - `UserProfile`: requires exact keys `['uid', 'displayName', 'email', 'createdAt', 'updatedAt']`, `uid == userId`, `displayName` string (1..100), `email` string (3..254).
   - `Note`: requires exact keys `['title', 'content', 'isPinned', 'createdAt', 'updatedAt']`, `title` string (0..200), `content` string (0..50000), `isPinned` boolean.
4. **Temporal Integrity**: `createdAt` and `updatedAt` must equal `request.time` (Firebase server timestamp) on creation. On update, `createdAt` is immutable (`incoming().createdAt == existing().createdAt`) and `updatedAt == request.time`.
5. **No Shadow Fields**: Both `create` (`keys().hasAll(...) && keys().hasOnly(...)`) and `update` (`affectedKeys().hasOnly(...)`) strictly reject unexpected fields.

## 2. Adversarial Test Matrix ("Dirty Dozen" Payloads)
1. **Unauthenticated Read**: `GET /users/userA/notes/note1` with `auth = null` -> `PERMISSION_DENIED`.
2. **Cross-User Note Read**: `GET /users/userA/notes/note1` authenticated as `userB` -> `PERMISSION_DENIED`.
3. **Cross-User List Query**: `LIST /users/userA/notes` authenticated as `userB` -> `PERMISSION_DENIED`.
4. **Cross-User Note Create**: `CREATE /users/userA/notes/note2` authenticated as `userB` -> `PERMISSION_DENIED`.
5. **Cross-User Note Delete**: `DELETE /users/userA/notes/note1` authenticated as `userB` -> `PERMISSION_DENIED`.
6. **PII Leak Attempt**: `GET /users/userA` authenticated as `userB` -> `PERMISSION_DENIED`.
7. **Shadow Field Injection on Create**: `CREATE /users/userA/notes/note2` with extra field `isAdmin: true` -> `PERMISSION_DENIED`.
8. **Shadow Field Injection on Update**: `UPDATE /users/userA/notes/note1` modifying `createdAt` or adding `role: 'admin'` -> `PERMISSION_DENIED`.
9. **Timestamp Spoofing on Create**: `CREATE /users/userA/notes/note2` with client-forged `createdAt` != `request.time` -> `PERMISSION_DENIED`.
10. **Immutable Field Tampering**: `UPDATE /users/userA/notes/note1` changing `createdAt` -> `PERMISSION_DENIED`.
11. **Resource Exhaustion / Oversized Payload**: `CREATE /users/userA/notes/note2` with `title` > 200 chars or `content` > 50,000 chars -> `PERMISSION_DENIED`.
12. **ID Poisoning**: `CREATE /users/userA/notes/bad$id..string` -> `PERMISSION_DENIED`.
