# Project Structure

## Repository Layout

```
urjamitra/
├── frontend/          # React.js client application
├── backend/           # Node.js/Express API server
├── .amazonq/          # Amazon Q configuration and rules
├── README.md          # Project documentation
├── FEATURES_IMPLEMENTED.md  # Implementation details
└── .gitignore         # Git ignore rules
```

## Frontend Structure (`frontend/`)

```
frontend/
├── public/
│   ├── index.html           # HTML entry point
│   ├── favicon.ico          # App icon
│   ├── manifest.json        # PWA manifest
│   └── robots.txt           # SEO configuration
│
├── src/
│   ├── components/
│   │   └── Navbar.js        # Navigation bar with user info
│   │
│   ├── pages/
│   │   ├── Login.js         # Authentication (login/signup)
│   │   ├── Dashboard.js     # User stats and community overview
│   │   ├── Marketplace.js   # Browse/create energy listings
│   │   ├── MapView.js       # Interactive neighborhood map
│   │   └── Transactions.js  # Transaction history and analytics
│   │
│   ├── services/
│   │   └── api.js           # Centralized API client (axios)
│   │
│   ├── App.js               # Main app component with routing
│   ├── App.css              # Global styles
│   ├── index.js             # React entry point
│   ├── index.css            # Tailwind CSS imports
│   └── setupTests.js        # Jest configuration
│
├── .env                     # Environment variables (API URL)
├── package.json             # Dependencies and scripts
├── tailwind.config.js       # Tailwind CSS configuration
└── postcss.config.js        # PostCSS configuration
```

### Frontend Component Relationships

```
App.js (Router)
├── Navbar (persistent across routes)
└── Routes
    ├── /login → Login.js
    ├── /dashboard → Dashboard.js
    ├── /marketplace → Marketplace.js
    ├── /map → MapView.js
    └── /transactions → Transactions.js

All pages use api.js service for backend communication
```

## Backend Structure (`backend/`)

```
backend/
├── controllers/
│   └── authController.js    # Authentication logic (signup/login)
│
├── models/
│   ├── user.js              # User schema with wallet and stats
│   ├── Listing.js           # Energy listing schema
│   ├── Transaction.js       # Transaction schema
│   └── Review.js            # Review/rating schema
│
├── routes/
│   ├── authRoutes.js        # Auth endpoints (signup/login)
│   ├── listingRoutes.js     # Listing CRUD endpoints
│   ├── transactionRoutes.js # Transaction endpoints
│   └── userRoutes.js        # User profile endpoints
│
├── .env                     # Environment variables (DB, JWT secret)
├── package.json             # Dependencies and scripts
├── jsconfig.json            # JavaScript configuration
└── server.js                # Express app entry point
```

### Backend Architecture

```
server.js
├── Express app initialization
├── Middleware (CORS, JSON parser)
├── MongoDB connection
└── Route mounting
    ├── /api/auth → authRoutes
    ├── /api/listings → listingRoutes
    ├── /api/transactions → transactionRoutes
    └── /api/users → userRoutes

Routes → Controllers → Models → MongoDB
```

## Data Models & Relationships

### User Model
```
User
├── Authentication: email, password (hashed)
├── Profile: name, address, phone, location (lat/long)
├── Wallet: balance, totalEarnings
├── Energy Stats: totalEnergyGenerated, totalEnergyShared, 
│                 totalEnergySold, totalEnergyBought
├── Reputation: rating, co2Saved
└── References: transactions[], listings[]
```

### Listing Model
```
Listing
├── seller (ref: User)
├── units (available energy in kWh)
├── pricePerUnit (₹/kWh)
├── location (address, lat, long)
├── isAvailable (boolean)
├── expiresAt (auto-set to 30 days)
└── timestamps (createdAt, updatedAt)
```

### Transaction Model
```
Transaction
├── buyer (ref: User)
├── seller (ref: User)
├── listing (ref: Listing)
├── units (energy purchased)
├── pricePerUnit (₹/kWh)
├── totalAmount (calculated)
├── status (pending/completed/cancelled)
├── transactionType (purchase/sale)
└── timestamps (createdAt, updatedAt)
```

### Review Model
```
Review
├── reviewer (ref: User)
├── reviewee (ref: User)
├── transaction (ref: Transaction)
├── rating (1-5 stars)
├── comment (text)
└── timestamps (createdAt)
```

## API Architecture

### Authentication Flow
```
Client → POST /api/auth/signup → authController.signup
                                → bcrypt hash password
                                → save User to MongoDB
                                → generate JWT token
                                → return token + user data

Client → POST /api/auth/login → authController.login
                               → find User by email
                               → bcrypt compare password
                               → generate JWT token
                               → return token + user data
```

### Protected Route Flow
```
Client → Request with JWT in Authorization header
      → authMiddleware verifies token
      → extracts userId from token
      → attaches to req.user
      → route handler executes with authenticated user
```

### Transaction Flow
```
Buyer → POST /api/transactions/purchase
     → Verify buyer has sufficient wallet balance
     → Verify listing has sufficient units
     → Create Transaction document
     → Debit buyer wallet
     → Credit seller wallet
     → Update listing inventory
     → Update both users' energy stats
     → Return transaction details
```

## Key Architectural Patterns

### Separation of Concerns
- **Frontend**: UI/UX, state management, user interactions
- **Backend**: Business logic, data validation, database operations
- **Database**: Data persistence and relationships

### RESTful API Design
- Resource-based URLs (`/api/listings`, `/api/transactions`)
- HTTP methods map to CRUD (GET, POST, PUT, DELETE)
- JSON request/response format
- Stateless authentication with JWT

### Component-Based UI
- Reusable React components
- Single responsibility principle
- Props for data flow
- Hooks for state management (useState, useEffect)

### Service Layer Pattern
- `api.js` centralizes all HTTP requests
- Consistent error handling
- Token management in one place
- Easy to mock for testing

### Middleware Chain
```
Request → CORS → JSON Parser → Auth Middleware → Route Handler → Response
```

### Database Indexing
- User email (unique index)
- Listing seller (query optimization)
- Transaction buyer/seller (query optimization)

## Configuration Files

### Frontend
- **tailwind.config.js**: Tailwind CSS customization
- **postcss.config.js**: PostCSS plugins (Tailwind, Autoprefixer)
- **package.json**: Dependencies (React 19, Axios, Leaflet, React Router)
- **.env**: `REACT_APP_API_BASE_URL=http://localhost:5000/api`

### Backend
- **package.json**: Dependencies (Express 5, Mongoose, JWT, bcryptjs)
- **.env**: `PORT`, `MONGODB_URI`, `JWT_SECRET`
- **jsconfig.json**: JavaScript module resolution

## Deployment Architecture

```
Frontend (Vercel)
    ↓ HTTP requests
Backend (Railway)
    ↓ Mongoose ODM
Database (MongoDB Atlas)
```

### Environment-Specific Configuration
- **Development**: localhost:3000 (frontend), localhost:5000 (backend)
- **Production**: Vercel domain (frontend), Railway domain (backend)
- **Database**: MongoDB Atlas (same for dev and prod, different databases)

## Security Architecture

### Authentication
- Passwords hashed with bcryptjs (10 salt rounds)
- JWT tokens with expiration
- Tokens stored in localStorage (client-side)
- Authorization header: `Bearer <token>`

### Authorization
- Middleware verifies JWT on protected routes
- User can only modify their own data
- Seller verification on listing operations
- Buyer/seller verification on transactions

### Data Validation
- Required field checks in Mongoose schemas
- Type validation (String, Number, Date)
- Unique constraints (email)
- Range validation (rating 1-5, positive numbers)

## Scalability Considerations

### Database
- Indexed queries for performance
- Reference-based relationships (not embedded)
- Pagination-ready structure
- Automatic listing expiry

### API
- Stateless design (horizontal scaling possible)
- JWT eliminates session store
- RESTful conventions
- Versioned endpoints ready (`/api/v1/...`)

### Frontend
- Code splitting with React Router
- Lazy loading potential
- Static asset optimization
- CDN-ready build output
