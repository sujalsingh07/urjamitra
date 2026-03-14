# Transaction Workflow and API Contract

This document defines the recommended seller-buyer transaction flow for UrjaMitra.

## 1. Roles

- Seller: User who lists surplus energy.
- Buyer: User who purchases energy units.
- Platform: Manages reservation, wallet holds, settlement, and disputes.

## 2. Lifecycle States

Use a strict state machine:

1. pending_request
2. reserved
3. seller_accepted
4. seller_rejected
5. in_delivery
6. completed
7. cancelled
8. disputed
9. refunded
10. expired

## 3. State Transition Rules

Allowed transitions:

- pending_request -> reserved
- reserved -> seller_accepted
- reserved -> seller_rejected
- reserved -> expired
- seller_accepted -> in_delivery
- in_delivery -> completed
- in_delivery -> disputed
- seller_rejected -> refunded
- expired -> refunded
- disputed -> completed
- disputed -> refunded

Disallowed transitions should return 409 Conflict.

## 4. Business Rules

- Inventory lock: Units are reserved instantly on order creation.
- Reservation TTL: Default 10 minutes.
- Price lock: pricePerUnit is frozen at reservation time.
- Wallet hold: Buyer amount is held at reservation; not transferred yet.
- Auto-expiry: If seller does not respond before TTL, reservation expires and hold is released.
- No oversell: Parallel purchases cannot reserve same units.
- Settlement: Seller credited only on completion.

## 5. Data Model Additions

## 5.1 Transaction (expanded)

- \_id
- listingId
- sellerId
- buyerId
- requestedUnits
- reservedUnits
- deliveredUnits
- pricePerUnitLocked
- grossAmount
- platformFee
- netAmount
- holdRef
- status
- statusReason
- reservationExpiresAt
- acceptedAt
- deliveredAt
- settledAt
- cancelledAt
- disputedAt
- createdAt
- updatedAt

## 5.2 Wallet Ledger (append-only)

- \_id
- userId
- transactionId
- type: hold | hold_release | debit | credit | refund | fee
- amount
- balanceAfter
- note
- createdAt

## 5.3 Transaction Event Log

- \_id
- transactionId
- actorId
- actorRole: buyer | seller | system | admin
- fromStatus
- toStatus
- reason
- metadata
- createdAt

## 6. API Contract

Base path: /api/transactions

All endpoints require Authorization: Bearer <token> unless marked public.

## 6.1 Create Order Request

POST /api/transactions/request

Request body:

{
"listingId": "<listing_id>",
"units": 2.5
}

Server actions:

- Validate listing exists and availableUnits >= units.
- Compute grossAmount = units \* listing.pricePerUnit.
- Create transaction in pending_request.
- Move to reserved and set reservationExpiresAt.
- Create buyer wallet hold entry.

Success response (201):

{
"success": true,
"transaction": {
"id": "tx_123",
"status": "reserved",
"requestedUnits": 2.5,
"pricePerUnitLocked": 18,
"grossAmount": 45,
"reservationExpiresAt": "2026-03-14T12:15:00.000Z"
}
}

## 6.2 Seller Decision

POST /api/transactions/:id/seller-decision

Request body:

{
"decision": "accept"
}

or

{
"decision": "reject",
"reason": "Insufficient generation window"
}

Rules:

- Only seller can decide.
- Allowed only from reserved.
- If reject, hold is released and status becomes seller_rejected -> refunded.

Success response (200):

{
"success": true,
"transaction": {
"id": "tx_123",
"status": "seller_accepted"
}
}

## 6.3 Start Delivery

POST /api/transactions/:id/start-delivery

Request body:

{
"deliveryNote": "Starting scheduled transfer"
}

Rules:

- Only seller.
- Allowed only from seller_accepted.

## 6.4 Mark Delivery Complete

POST /api/transactions/:id/complete

Request body:

{
"deliveredUnits": 2.5,
"proof": {
"meterReading": "MR-20260314-001",
"note": "Smart meter sync confirmed"
}
}

Rules:

- Seller or system metering service can call this.
- Allowed from in_delivery.
- Settles wallet:
  - Buyer hold captured.
  - Seller credited netAmount.
  - Platform fee posted.
- listing.availableUnits reduced by deliveredUnits.

Success response (200):

{
"success": true,
"transaction": {
"id": "tx_123",
"status": "completed",
"settledAt": "2026-03-14T12:34:12.000Z"
}
}

## 6.5 Cancel by Buyer

POST /api/transactions/:id/cancel

Request body:

{
"reason": "Changed plan"
}

Rules:

- Buyer only.
- Allowed in pending_request or reserved.
- Not allowed after seller_accepted unless policy allows penalty.

## 6.6 Raise Dispute

POST /api/transactions/:id/dispute

Request body:

{
"category": "delivery_mismatch",
"comment": "Delivered units lower than committed",
"evidence": {
"meterBefore": "img_1",
"meterAfter": "img_2"
}
}

Rules:

- Buyer or seller.
- Allowed from in_delivery or completed within dispute window (for example 24h).

## 6.7 Resolve Dispute (admin)

POST /api/transactions/:id/resolve

Request body:

{
"resolution": "refund",
"refundAmount": 45,
"note": "Meter evidence mismatch confirmed"
}

Rules:

- Admin/system only.
- Allowed only from disputed.

## 6.8 Get My Transactions

GET /api/transactions/my

Query params:

- role=buyer|seller|all
- status=<state>
- page=1
- limit=20

Response (200):

{
"success": true,
"items": [
{
"id": "tx_123",
"status": "completed",
"buyer": { "id": "u1", "name": "A" },
"seller": { "id": "u2", "name": "B" },
"units": 2.5,
"amount": 45,
"createdAt": "..."
}
],
"page": 1,
"limit": 20,
"total": 1
}

## 6.9 Get Transaction Details

GET /api/transactions/:id

Response includes:

- current state
- status timeline
- wallet entries summary
- dispute summary (if any)

## 7. Error Contract

Standard format:

{
"success": false,
"code": "INSUFFICIENT_WALLET",
"message": "Wallet balance is insufficient for reservation",
"details": {}
}

Recommended codes:

- LISTING_NOT_FOUND
- LISTING_UNAVAILABLE
- INSUFFICIENT_UNITS
- INSUFFICIENT_WALLET
- INVALID_STATE_TRANSITION
- RESERVATION_EXPIRED
- FORBIDDEN_ACTION
- DISPUTE_WINDOW_CLOSED

## 8. Concurrency and Safety

- Use MongoDB transaction/session for reserve + hold creation.
- Use conditional updates for listing units to avoid race conditions.
- Use idempotency key on buyer request endpoint.
- Add background job every minute to expire stale reservations.

## 9. Notifications

Emit events on:

- transaction_reserved
- seller_decision_required
- transaction_accepted
- transaction_rejected
- delivery_started
- transaction_completed
- transaction_disputed
- refund_processed

## 10. Suggested Frontend Screens

- Buyer: Confirm Request modal with countdown timer.
- Seller: Incoming Requests queue with Accept/Reject actions.
- Both: Live status stepper and event timeline.
- Both: Dispute form with evidence upload.

## 11. Migration Plan from Current Endpoints

Current endpoint in codebase:

- POST /api/transactions/purchase
- GET /api/transactions/my-transactions

Recommended migration:

1. Keep old endpoints for backward compatibility.
2. Implement new v2 endpoints in parallel.
3. Move frontend flows to /request and state-based actions.
4. Deprecate old purchase endpoint after UI migration.

## 12. Minimum Viable Rollout (Phase 1)

Implement first:

1. request
2. seller-decision
3. complete
4. my

Then add:

1. dispute flow
2. admin resolve
3. full ledger view
