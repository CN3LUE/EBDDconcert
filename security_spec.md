# Security Specification (Phase 0 TDD)

## 1. Data Invariants
1. **User State (`/users/{userId}`)**:
   - Only the authenticated owner (`request.auth.uid == userId` and `incoming().uid == request.auth.uid`) can read, create, update, or delete their document.
   - `checkedDates` is strictly bounded (`<= 100` items), `ebddJumps`, `runBestScore`, and `roofBestScore` are bounded numbers (`>= 0`), and `updatedAt == request.time`.
2. **Public Advent Answers (`/advent_answers/{answerId}`)**:
   - Creation requires authentication (`request.auth != null`), `authorUid == request.auth.uid`, `isPublic == true`, valid `dateStr` (`^202[67]-[0-9]{2}-[0-9]{2}$`), non-empty `text` (`1..120` chars), and server timestamp `createdAt == request.time`.
   - Listing requires `isSignedIn() && existing().isPublic == true` (enforcing `where('isPublic', '==', true)` query).
   - Updates are disallowed; only the original `authorUid` can delete.
3. **Flower Memos (`/flower_memos/{memoId}`)**:
   - Creation requires authentication, `authorUid == request.auth.uid`, `isPublic == true`, bounded `author` (`1..20`), `seatZone` (`1..40`), `text` (`1..60`), valid hex `color` (`^#[0-9a-fA-F]{6}$`), finite coordinates `x`/`z` in `[-120, 120]`, initial `likes == 1`, and server timestamps `createdAt == request.time`, `updatedAt == request.time`.
   - Updates are partitioned by action:
     - **Owner Edit**: `existing().authorUid == request.auth.uid`, modifying only `['text', 'color', 'updatedAt']`, preserving immutable `authorUid`, `authorId`, `createdAt`.
     - **Like Toggle**: any signed-in user modifying only `['likes', 'updatedAt']` by exactly `+1` or `-1` (`>= 0`).
   - Only the original `authorUid` can delete.
4. **Connection Probe (`/test/{docId}`)**:
   - Read-only `get` strictly for `docId == 'connection'`; all writes denied.

## 2. Dirty Dozen Attack Payloads (Must Return PERMISSION_DENIED)
1. Unauthenticated read/write on `/users/u1`
2. Cross-user read/write (`uid = u2` accessing `/users/u1`)
3. Shadow field injection on `/users/u1` (`{ ...valid, isAdmin: true }`)
4. Forged `uid` inside `/users/u1` (`uid: "other_user"`)
5. Client-forged timestamp on `/advent_answers/a1` (`createdAt: 1700000000000`)
6. Oversized text (`> 120` chars) on `/advent_answers/a1`
7. Spoofed `authorUid` on `/flower_memos/m1`
8. Invalid hex color (`"red"` or `"#12345"`) on `/flower_memos/m1`
9. Shadow field (`likes: 99999`) on `/flower_memos/m1` creation
10. Non-owner attempting to edit `text` on `/flower_memos/m1`
11. Arbitrary like jump (`likes: existing.likes + 50`) on `/flower_memos/m1`
12. Poisoned oversized document ID (`> 128` chars or special characters like `a/b/../c`)
