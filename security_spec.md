# SkillBattle Security Specification & Threat Model

## 1. Data Invariants
1. **Default Deny**: Every unmatched path is denied (`allow read, write: if false`).
2. **Verified Email Gate**: All authenticated read/write operations require `request.auth != null && request.auth.token.email_verified == true`.
3. **Admin RBAC**: Only verified admins (`request.auth.token.email == 'habbik758@gmail.com'` with `email_verified == true`, or `exists(/databases/$(database)/documents/admins/$(request.auth.uid))` with `email_verified == true`) can modify admin-only collections (`admins`, `categories`, `games`, `banners`, `announcements`, `notifications`, `activityLog`, `appSettings`, `leaderboard`, `publicWithdrawals`), publish matches/results, approve/reject withdrawals, or credit/ban users.
4. **Atomic Wallet Integrity**: Users can NEVER self-credit `balance`, `depositedBalance`, `winningBalance`, or `bonusBalance`. Users may only decrease their own balance via:
   - Atomic `joinMatch` transaction (`balance` decreases by exact `match.entryFee`, `matchesPlayed` increments by `1`, and `/matchParticipants/{matchId}_{uid}` is created in the same transaction via `existsAfter`).
   - Atomic `submitWithdrawalRequest` transaction (`winningBalance` and `balance` decrease by exact `withdrawal.amount >= 20`, and `/withdrawals/{withdrawalId}` + `/transactions/{txId}` are created).
5. **PII & Room Secret Isolation**:
   - `/users/{userId}` (contains email, phone, wallet) is readable only by the owner (`request.auth.uid == userId`) or `isAdmin()`.
   - `/matches/{matchId}/secrets/room` is readable only by `isAdmin()`, the private match host (`hostUid == request.auth.uid`), or a verified joined participant (`exists(/databases/$(database)/documents/matchParticipants/$(matchId + '_' + request.auth.uid))`).
   - `/transactions`, `/withdrawals`, `/tickets`, `/promoSubmissions` list queries require `resource.data.userId == request.auth.uid || isAdmin()`.
6. **Temporal Integrity & Path Validation**: All document IDs match `^[a-zA-Z0-9_-]+$` (`size <= 128`). Created documents validate `createdAt == request.time`.

## 2. "Dirty Dozen" Attack Payloads (Must Return PERMISSION_DENIED)
1. **Unverified Email Bypass**: User with `email_verified: false` tries to update `/users/{uid}` or create `/feedbacks/{id}`.
2. **Self-Credit Wallet Attack**: Verified player attempts `updateDoc(doc(db, 'users', uid), { balance: 99999, winningBalance: 99999 })`.
3. **Role Escalation on Signup**: New user attempts `setDoc(doc(db, 'users', uid), { ..., role: 'admin' })`.
4. **Ghost Field / Shadow Update**: Verified player attempts `updateDoc(doc(db, 'users', uid), { firstName: 'Pro', isVerifiedHost: true })`.
5. **Cross-User PII Read**: Player A tries `getDoc(doc(db, 'users', playerB_uid))` or `getDocs(collection(db, 'users'))`.
6. **Non-Participant Room Secret Snooping**: Player who has NOT joined `match-1` tries `getDoc(doc(db, 'matches/match-1/secrets/room'))`.
7. **Orphaned Participant Without Match Deduction**: Player tries to create `/matchParticipants/match-1_uid` without updating `/matches/match-1` or deducting paid entry fee.
8. **Fake Deposit Approval**: Player tries to create `/transactions/tx-1` with `type: 'DEPOSIT', status: 'SUCCESS'` or `type: 'WINNING'`.
9. **Negative Withdrawal Exploit**: Player tries `submitWithdrawalRequest` with `amount: -500` to inflate `winningBalance`.
10. **Cross-User Ticket/Withdrawal Scraping**: Player A queries `collection(db, 'withdrawals')` without `where('userId', '==', uid)`.
11. **Admin Collection Tampering**: Normal player tries to write `/announcements/ann-1` or approve `/withdrawals/w-1`.
12. **ID Poisoning**: Attacker attempts `setDoc(doc(db, 'feedbacks', 'a'.repeat(200)), ...)` or invalid characters in document ID.
