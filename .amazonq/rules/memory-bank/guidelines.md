# Development Guidelines

## Code Quality Standards

### Naming Conventions

**Variables and Functions**
- Use camelCase for variables and functions: `fetchListings`, `showSuccess`, `listingForm`
- Use descriptive names that indicate purpose: `authenticateToken`, `getMyTransactions`
- Boolean variables start with `is`, `has`, `show`: `isAvailable`, `showListModal`, `showSuccess`
- Event handlers prefixed with `handle`: `handlePurchase`, `handleCreateListing`

**Constants**
- Use UPPER_SNAKE_CASE for true constants: `API_BASE`, `JWT_SECRET`
- Environment variables use UPPER_SNAKE_CASE: `MONGODB_URI`, `REACT_APP_API_BASE_URL`

**React Components**
- Use PascalCase for component names: `Marketplace`, `Dashboard`, `Navbar`
- File names match component names: `Marketplace.js`, `Login.js`

**Database Models**
- Use PascalCase for model names: `User`, `Listing`, `Transaction`, `Review`
- File names match model names: `user.js`, `Listing.js`

**Routes and Endpoints**
- Use kebab-case for multi-word endpoints: `/my-listings`, `/my-transactions`, `/add-balance`
- RESTful resource naming: `/listings`, `/transactions`, `/users`

### Code Formatting

**Indentation**
- Use 2 spaces for indentation (no tabs)
- Consistent across frontend and backend

**String Literals**
- Use single quotes for strings: `'Content-Type'`, `'application/json'`
- Template literals for string interpolation: `` `Bearer ${gettoken()}` ``

**Semicolons**
- Use semicolons consistently at statement ends
- Applied in both frontend and backend code

**Line Length**
- Keep lines under 100 characters when practical
- Break long JSX attributes into multiple lines

**Spacing**
- Space after keywords: `if (condition)`, `function name()`
- Space around operators: `a + b`, `x === y`
- No space before function parentheses: `function name()` not `function name ()`

### File Organization

**Frontend Files**
- Components in `src/components/`
- Pages in `src/pages/`
- Services/utilities in `src/services/`
- One component per file
- Export default at end of file

**Backend Files**
- Models in `models/`
- Routes in `routes/`
- Controllers in `controllers/`
- Middleware in `middleware/`
- One model/route per file
- Export with `module.exports`

### Import Organization

**Frontend (ES6 modules)**
```javascript
// 1. External dependencies first
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// 2. Internal imports second
import { api } from '../services/api';
import Navbar from './components/Navbar';

// 3. CSS imports last
import 'leaflet/dist/leaflet.css';
```

**Backend (CommonJS)**
```javascript
// 1. External dependencies first
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// 2. Internal imports second
const User = require('../models/user');
const Review = require('../models/Review');

// 3. Environment config
require('dotenv').config();
```

## Semantic Patterns

### React Component Structure

**Standard Component Pattern**
```javascript
import { useState, useEffect } from 'react';
import { api } from '../services/api';

function ComponentName() {
  // 1. State declarations
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // 2. Effects
  useEffect(() => {
    fetchData();
  }, []);
  
  // 3. Helper functions
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.getData();
      if (response.success) {
        setData(response.data);
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError('Error message');
    } finally {
      setLoading(false);
    }
  };
  
  // 4. Event handlers
  const handleAction = async () => {
    // implementation
  };
  
  // 5. Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
}

export default ComponentName;
```

### API Call Pattern

**Frontend API Calls**
```javascript
// Always use try-catch-finally
const fetchData = async () => {
  try {
    setLoading(true);
    const response = await api.method();
    if (response.success) {
      // Handle success
      setData(response.data);
    } else {
      // Handle API error
      setError(response.message);
    }
  } catch (err) {
    // Handle network error
    setError('Error fetching data');
  } finally {
    setLoading(false);
  }
};
```

**Backend API Response Pattern**
```javascript
// Success response
res.json({ 
  success: true, 
  data: result,
  message: 'Optional success message'
});

// Error response
res.status(400).json({ 
  success: false, 
  message: 'Error description'
});
```

### Authentication Middleware Pattern

**Token Verification**
```javascript
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'No token provided' 
    });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    }
    req.userId = decoded.id;
    next();
  });
};
```

**Usage in Routes**
```javascript
router.get('/protected', authenticateToken, async (req, res) => {
  // req.userId available here
});
```

### Database Query Pattern

**Mongoose Queries with Population**
```javascript
const user = await User.findById(userId)
  .select('-password')  // Exclude sensitive fields
  .populate('transactions', 'units totalAmount createdAt')  // Populate references
  .populate('listings', 'units pricePerUnit available');
```

**Error Handling in Routes**
```javascript
router.get('/endpoint', async (req, res) => {
  try {
    // Database operations
    const result = await Model.find();
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});
```

### State Management Pattern

**Form State**
```javascript
const [formData, setFormData] = useState({ 
  field1: '', 
  field2: '', 
  field3: '' 
});

// Update single field
onChange={(e) => setFormData({ ...formData, field1: e.target.value })}
```

**Loading States**
```javascript
const [loading, setLoading] = useState(true);

// In async function
setLoading(true);
// ... operation
setLoading(false);

// In JSX
{loading ? <LoadingComponent /> : <DataComponent />}
```

**Error States**
```javascript
const [error, setError] = useState('');

// Set error
setError('Error message');

// Clear error
setError('');

// Display error
{error && (
  <div className="bg-red-50 text-red-600">
    ❌ {error}
  </div>
)}
```

**Success Notifications**
```javascript
const [showSuccess, setShowSuccess] = useState(false);

// Show temporarily
setShowSuccess(true);
setTimeout(() => setShowSuccess(false), 3000);

// Display
{showSuccess && (
  <div className="bg-green-500 text-white">
    ✅ Success message
  </div>
)}
```

### Modal Pattern

**Modal State and Toggle**
```javascript
const [showModal, setShowModal] = useState(false);

// Open modal
<button onClick={() => setShowModal(true)}>Open</button>

// Modal JSX
{showModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-2xl p-6">
      {/* Modal content */}
      <button onClick={() => setShowModal(false)}>Close</button>
    </div>
  </div>
)}
```

## Internal API Usage

### API Service Layer (`api.js`)

**Authentication APIs**
```javascript
// Signup
const response = await api.signup({ name, email, password, address });

// Login
const response = await api.login(email, password);

// Store token
localStorage.setItem('token', response.token);
```

**Listing APIs**
```javascript
// Get all listings
const response = await api.getListings();

// Get user's listings
const response = await api.getMyListings();

// Create listing
const response = await api.createListing({
  units: 5,
  pricePerUnit: 18,
  location: { address: 'House #7' }
});

// Delete listing
const response = await api.deleteListing(listingId);
```

**Transaction APIs**
```javascript
// Get user's transactions
const response = await api.getMyTransactions();

// Purchase energy
const response = await api.purchaseEnergy(listingId, units);
```

**User Profile APIs**
```javascript
// Get any user's profile
const response = await api.getProfile(userId);

// Get current user's profile
const response = await api.getMyProfile();

// Update profile
const response = await api.updateProfile({ name, address, totalEnergyGenerated });

// Add wallet balance
const response = await api.addBalance(amount);

// Leave review
const response = await api.leaveReview(revieweeId, rating, comment, transactionId);

// Get user reviews
const response = await api.getUserReviews(userId);
```

**Token Management**
```javascript
// Token automatically included in protected requests
const gettoken = () => localStorage.getItem('token');

// Used in Authorization header
headers: { Authorization: `Bearer ${gettoken()}` }
```

## Frequently Used Code Idioms

### Conditional Rendering
```javascript
// Ternary for two states
{loading ? <Loading /> : <Content />}

// Logical AND for single condition
{error && <ErrorMessage />}

// Multiple conditions
{loading ? <Loading /> : error ? <Error /> : <Content />}
```

### Array Filtering and Sorting
```javascript
const filtered = items
  .filter(item => condition ? item.field : true)
  .sort((a, b) => sortKey === 'price' ? a.price - b.price : 0);
```

### Dynamic Class Names
```javascript
className={`base-classes ${
  condition 
    ? 'active-classes' 
    : 'inactive-classes'
}`}
```

### Async/Await with Fetch
```javascript
const response = await fetch(url, {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(data)
}).then(res => res.json());
```

### Mongoose Atomic Updates
```javascript
// Increment field
await User.findByIdAndUpdate(
  userId,
  { $inc: { wallet: amount } },
  { new: true }
);

// Update multiple fields
await User.findByIdAndUpdate(
  userId,
  { name, address, totalEnergyGenerated },
  { new: true }
);
```

### Express Route Mounting
```javascript
// In server.js
app.use('/api/resource', require('./routes/resourceRoutes'));

// In route file
const router = express.Router();
router.get('/endpoint', handler);
module.exports = router;
```

## Popular Annotations and Comments

### JSX Section Comments
```javascript
{/* Header */}
{/* Filter Tabs */}
{/* Success Toast */}
{/* Loading State */}
{/* Modal */}
```

### Function Documentation
```javascript
// Middleware to verify token
const authenticateToken = (req, res, next) => { ... }

// Get user profile
router.get('/profile/:userId', async (req, res) => { ... }
```

### TODO Comments
```javascript
// In a real scenario, ask for units to purchase
// TODO: Add pagination
// TODO: Implement real-time notifications
```

## Best Practices Followed

### Security
- Never store passwords in plain text (bcryptjs hashing)
- Always use JWT for authentication
- Exclude password field in queries: `.select('-password')`
- Validate input before database operations
- Use environment variables for secrets

### Error Handling
- Always wrap async operations in try-catch
- Provide meaningful error messages
- Use appropriate HTTP status codes (400, 401, 403, 404, 500)
- Display user-friendly error messages in UI

### Data Validation
- Check required fields before processing
- Validate data types and ranges
- Prevent duplicate operations (e.g., duplicate reviews)
- Use Mongoose schema validation

### Performance
- Use `.select()` to exclude unnecessary fields
- Populate references only when needed
- Set loading states before async operations
- Use `finally` block to ensure loading state cleanup

### User Experience
- Show loading states during async operations
- Display success notifications temporarily (3 seconds)
- Clear form data after successful submission
- Provide feedback for all user actions

### Code Reusability
- Centralize API calls in service layer
- Create reusable authentication middleware
- Use consistent response format across all endpoints
- Share common patterns across components

### Database Design
- Use references for relationships (not embedded documents)
- Add timestamps to all models: `{ timestamps: true }`
- Index frequently queried fields
- Use meaningful field names

### Environment Configuration
- Never commit `.env` files
- Use environment variables for all configuration
- Provide default values: `process.env.VAR || 'default'`
- Document required environment variables

### React Best Practices
- One component per file
- Use functional components with hooks
- Declare state at component top
- Group related state together
- Use descriptive state variable names
- Clean up effects when needed

### Express Best Practices
- Use middleware for cross-cutting concerns
- Mount routes with clear prefixes
- Return early on validation failures
- Use async/await for database operations
- Always send JSON responses

### Git Practices
- Use `.gitignore` for sensitive files
- Exclude `node_modules/`, `.env`, build artifacts
- Commit meaningful changes
- Keep commit history clean
