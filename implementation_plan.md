# Real-Time Chat Implementation Plan

Adding real-time messaging between buyers and sellers to Urjamitra using Socket.io, MongoDB, Express, and React.

## User Review Required
> [!IMPORTANT]
> This feature introduces new real-time dependencies (`socket.io` and `socket.io-client`). Please review the approach. WebSockets will require your hosting provider to support sticky sessions or WebSockets if you plan to deploy this (e.g., Render, Heroku support this out of the box).

## Proposed Changes

### Dependencies Layer
#### [MODIFY] [backend/package.json](file:///c:/Users/yashw/OneDrive/Documents/GitHub/urjamitra/backend/package.json)
- Add `socket.io` dependency.

#### [MODIFY] [frontend/package.json](file:///c:/Users/yashw/OneDrive/Documents/GitHub/urjamitra/frontend/package.json)
- Add `socket.io-client` dependency.

---

### Backend Components

#### [MODIFY] [backend/server.js](file:///c:/Users/yashw/OneDrive/Documents/GitHub/urjamitra/backend/server.js)
- Integrate `socket.io` with the Express server.
- Setup socket event listeners for `join`, `sendMessage`, `disconnect`.
- Manage online users (mapping socket ID to user ID).

#### [NEW] [backend/models/Message.js](file:///c:/Users/yashw/OneDrive/Documents/GitHub/urjamitra/backend/models/Message.js)
- Create MongoDB schema for messages:
  - `senderId` (ObjectId, ref User)
  - `receiverId` (ObjectId, ref User)
  - `content` (String)
  - `read` (Boolean, default false)
  - `createdAt` (Date)
  - *Optional:* `transactionId` (ObjectId, ref Transaction) to link chats to specific deals.

#### [NEW] [backend/routes/messageRoutes.js](file:///c:/Users/yashw/OneDrive/Documents/GitHub/urjamitra/backend/routes/messageRoutes.js)
- `GET /api/messages/conversations` - Get a list of users the current user has chatted with (latest message per user).
- `GET /api/messages/:userId` - Get chat history with a specific user.
- Add route to [backend/server.js](file:///c:/Users/yashw/OneDrive/Documents/GitHub/urjamitra/backend/server.js).

#### [NEW] [backend/controllers/messageController.js](file:///c:/Users/yashw/OneDrive/Documents/GitHub/urjamitra/backend/controllers/messageController.js)
- Logic for fetching conversations and message histories.

---

### Frontend Components

#### [MODIFY] [frontend/src/services/api.js](file:///c:/Users/yashw/OneDrive/Documents/GitHub/urjamitra/frontend/src/services/api.js)
- Add API calls for fetching conversations and chat history.

#### [NEW] [frontend/src/pages/Messages.js](file:///c:/Users/yashw/OneDrive/Documents/GitHub/urjamitra/frontend/src/pages/Messages.js)
- Create the full-page hub for messaging.
- Split-screen layout matching current UI (Glassmorphism, gradients).
  - **Left Sidebar:** List of conversations.
  - **Right Main Area:** Active chat window.
- Implement `socket.io-client` logic inside a `useEffect` to connect, listen for incoming messages, and emit outgoing messages.

#### [MODIFY] [frontend/src/components/Sidebar.js](file:///c:/Users/yashw/OneDrive/Documents/GitHub/urjamitra/frontend/src/components/Sidebar.js)
- Add a navigation link to `/messages` below "Transactions".
- Add an unread badge if possible (requires fetching unread count on mount/socket update).

#### [MODIFY] [frontend/src/pages/Marketplace.js](file:///c:/Users/yashw/OneDrive/Documents/GitHub/urjamitra/frontend/src/pages/Marketplace.js)
- Add an "Ask Seller" button next to "Buy ⚡". Clicking this navigates to `/messages` and auto-selects/starts a chat with that seller.

#### [MODIFY] [frontend/src/pages/Transactions.js](file:///c:/Users/yashw/OneDrive/Documents/GitHub/urjamitra/frontend/src/pages/Transactions.js)
- Add contextual chat buttons on transaction rows (e.g., "Message Buyer" or "Message Seller") to coordinate delivery.

#### [MODIFY] [frontend/src/App.js](file:///c:/Users/yashw/OneDrive/Documents/GitHub/urjamitra/frontend/src/App.js)
- (Assuming this exists) Add the `/messages` route.

## Verification Plan

### Automated Tests
- No existing automated test suite (Jest/React Testing Library setup exists but no tests written). We will rely on manual testing for real-time WebSocket features as they are hard to unit test without significant mock setup.

### Manual Verification
1. **Dependency Installation:** Run `npm install socket.io` in backend and `npm install socket.io-client` in frontend. Start both servers. Verify no crash.
2. **Database:** Verify [Message](file:///c:/Users/yashw/OneDrive/Documents/GitHub/urjamitra/frontend/src/pages/Marketplace.js#112-120) collection is created in MongoDB when the first message is sent.
3. **UI Integration:**
   - Click "Messages" in Sidebar, ensure UI loads empty state.
   - Go to Marketplace, click "Ask Seller" on a listing. Verify it redirects to Messages and opens a chat with that seller.
   - Go to Transactions, click "Message Buyer/Seller". Verify redirect.
4. **Real-time Flow (Requires 2 browser tabs):**
   - Login as User A in Tab 1, User B in Tab 2.
   - User A sends a message to User B.
   - Verify User B receives the message *instantly* without refreshing the page.
   - Verify the message is saved to MongoDB (refresh page, history should load).
5. **Offline Delivery:**
   - Close Tab 2 (User B offline).
   - User A sends a message.
   - Open Tab 2 (User B logs in).
   - Verify User B sees the new message in their conversation history.
