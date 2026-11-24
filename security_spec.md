# SMASH OR PASS — Security Specification & Threat Model

## 1. Data Invariants
1. **Identity & PII Isolation**: Public `/profiles/{userId}` documents contain zero PII (no email, phone, or billing fields). Private PII (`email`, `subscriptionStatus`, `monthlySpendUsd`, `creatorEarningsUsd`) lives strictly in `/users/{userId}/private/account`, readable and writable only by the owner or verified admin.
2. **Verified Email Mandate**: All mutations require `request.auth != null && request.auth.token.email_verified == true`.
3. **1,000-Follower Gate for Video & Live**: A user cannot create documents in `/videos` or `/liveStreams` unless their `/profiles/{uid}.followersCount >= 1000` (or they are a verified admin).
4. **Private Conversation Master Gate**: `/conversations/{convId}/messages/{messageId}` strictly validates via `get()` that `request.auth.uid` is one of the two participants in the parent `/conversations/{convId}` document.
5. **Bounded Session Commissions**: Users cannot forge arbitrary commission amounts in `/sessionCommissions`; `commissionUsd` is strictly clamped between `$0.001` and `$0.02`, and `userId` must match `request.auth.uid`.
6. **Immutable Ownership & Server Timestamps**: `uid`, `ownerId`, `fromUid`, `followerUid`, `senderId`, `creatorId`, `hostId`, and `createdAt` cannot be spoofed or altered after creation; `createdAt` and `updatedAt` must equal `request.time`.

## 2. The Dirty Dozen Adversarial Payloads (Must Return PERMISSION_DENIED)
1. **Unauthenticated Profile Read/Write**: `setDoc(doc(db, 'profiles', 'u1'), {...})` with `auth = null`.
2. **Email Spoof Admin Escalation**: Request with `token.email = 'tshepiramara@gmail.com'` and `token.email_verified = false`.
3. **Shadow Field Injection on Profile**: Create profile with valid fields plus ghost field `followersCount: 5000` or `isAdmin: true`.
4. **PII Leak Attempt**: Signed-in User B reading `/users/userA/private/account`.
5. **Under-Age Profile Injection**: Creating profile with `age: 16` (violates `age >= 18`).
6. **Sub-1000 Follower Video Bypass**: User with `followersCount: 120` attempting to create `/videos/v1`.
7. **Sub-1000 Follower Live Stream Bypass**: User with `followersCount: 999` attempting to create `/liveStreams/l1`.
8. **Conversation Eavesdropping**: User C reading or listing `/conversations/userA__userB/messages`.
9. **Spoofed Sender ID in Chat**: User A sending message in `/conversations/userA__userB/messages` with `senderId: 'userB'`.
10. **Arbitrary Follower Count Tampering**: User A updating User B's `/profiles/userB` to `followersCount: 9999` without an atomic `+1` follow doc write.
11. **Session Commission Inflation**: User A logging `/sessionCommissions/s1` with `commissionUsd: 500.00`.
12. **Client-Spoofed Timestamp / ID Poisoning**: Creating `/swipes/..%2Fadmin` or setting `createdAt` to a past timestamp (`Timestamp.fromMillis(1000)`).
