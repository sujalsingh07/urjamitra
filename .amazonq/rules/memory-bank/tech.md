# Technology Stack

## Programming Languages

### JavaScript (ES6+)
- **Frontend**: React.js components, JSX syntax
- **Backend**: Node.js runtime, CommonJS modules
- **Version**: Node.js v18+ required

## Frontend Technologies

### Core Framework
**React.js 19.2.4**
- Component-based UI architecture
- Hooks for state management (useState, useEffect)
- Virtual DOM for performance
- JSX for declarative UI

### Routing
**React Router DOM 7.13.1**
- Client-side routing
- Protected route handling
- Navigation between pages
- URL parameter management

### HTTP Client
**Axios 1.13.6**
- Promise-based HTTP requests
- Request/response interceptors
- Automatic JSON transformation
- Error handling

### Mapping
**Leaflet.js 1.9.4 + React Leaflet 5.0.0**
- Interactive maps without API keys
- Marker clustering
- Custom popups
- Geolocation support

### Styling
**Tailwind CSS 3.4.19**
- Utility-first CSS framework
- Responsive design utilities
- Custom configuration support
- PostCSS integration

**PostCSS 8.5.8 + Autoprefixer 10.4.27**
- CSS processing pipeline
- Vendor prefix automation
- Tailwind compilation

### Build Tools
**React Scripts 5.0.1**
- Webpack configuration abstraction
- Development server with hot reload
- Production build optimization
- Jest test runner integration

### Testing
**Jest + React Testing Library**
- `@testing-library/react` 16.3.2
- `@testing-library/jest-dom` 6.9.1
- `@testing-library/user-event` 13.5.0
- Component testing utilities
- DOM testing utilities

## Backend Technologies

### Runtime & Framework
**Node.js + Express.js 5.2.1**
- Lightweight REST API framework
- Middleware support
- Routing system
- JSON parsing

### Database
**MongoDB + Mongoose 9.2.4**
- NoSQL document database
- Schema-based modeling
- Query builder
- Validation and middleware hooks
- Reference population

**MongoDB Atlas**
- Cloud-hosted database
- Free tier (512MB storage)
- Automatic backups
- Geospatial queries support

### Authentication
**JSON Web Tokens (jsonwebtoken 9.0.3)**
- Stateless authentication
- Token-based sessions
- Payload encryption
- Expiration handling

**bcryptjs 3.0.3**
- Password hashing
- Salt generation (10 rounds)
- Secure password comparison

### Middleware
**CORS 2.8.6**
- Cross-Origin Resource Sharing
- Frontend-backend communication
- Configurable origins

**dotenv 17.3.1**
- Environment variable management
- Configuration separation
- Secret key protection

### Development Tools
**Nodemon 3.1.14**
- Auto-restart on file changes
- Development server
- Watch mode

## Development Commands

### Frontend Commands
```bash
npm start          # Start development server (localhost:3000)
npm run build      # Create production build
npm test           # Run Jest tests
npm run eject      # Eject from Create React App
```

### Backend Commands
```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
```

## Environment Configuration

### Frontend Environment Variables
```
REACT_APP_API_BASE_URL=http://localhost:5000/api
```
- Prefix `REACT_APP_` required for Create React App
- Embedded at build time
- Accessible via `process.env.REACT_APP_API_BASE_URL`

### Backend Environment Variables
```
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_secret_key_here
```
- Loaded via dotenv package
- Never committed to version control
- Required for server startup

## Package Management

### Frontend Dependencies
```json
{
  "react": "^19.2.4",
  "react-dom": "^19.2.4",
  "react-router-dom": "^7.13.1",
  "axios": "^1.13.6",
  "leaflet": "^1.9.4",
  "react-leaflet": "^5.0.0"
}
```

### Frontend DevDependencies
```json
{
  "tailwindcss": "^3.4.19",
  "autoprefixer": "^10.4.27",
  "postcss": "^8.5.8"
}
```

### Backend Dependencies
```json
{
  "express": "^5.2.1",
  "mongoose": "^9.2.4",
  "jsonwebtoken": "^9.0.3",
  "bcryptjs": "^3.0.3",
  "cors": "^2.8.6",
  "dotenv": "^17.3.1"
}
```

### Backend DevDependencies
```json
{
  "nodemon": "^3.1.14"
}
```

## Database Schema Design

### Mongoose Schema Features Used
- **Schema Types**: String, Number, Date, Boolean, ObjectId
- **Validation**: required, unique, min, max, enum
- **Defaults**: Default values, Date.now, calculated fields
- **References**: Population of related documents
- **Virtuals**: Computed properties
- **Timestamps**: Automatic createdAt/updatedAt
- **Indexes**: Performance optimization

### Example Schema Pattern
```javascript
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  wallet: { type: Number, default: 0 },
  transactions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' }]
}, { timestamps: true });
```

## API Design Patterns

### RESTful Conventions
- **GET**: Retrieve resources
- **POST**: Create resources
- **PUT**: Update resources
- **DELETE**: Remove resources

### Response Format
```javascript
// Success
{ success: true, data: {...}, message: "..." }

// Error
{ success: false, message: "Error description" }
```

### Authentication Pattern
```javascript
// Protected route
router.get('/protected', authMiddleware, controller);

// Middleware extracts user from JWT
req.user = { userId: "..." }
```

## Build & Deployment

### Frontend Build Process
1. React Scripts compiles JSX to JavaScript
2. Tailwind CSS processes utility classes
3. Webpack bundles all assets
4. Output to `build/` directory
5. Static files ready for CDN/hosting

### Backend Deployment
- No build step required (Node.js runs directly)
- Environment variables configured on host
- MongoDB connection string updated for production
- CORS origins configured for production frontend URL

### Hosting Platforms
**Frontend**: Vercel
- Automatic deployments from Git
- CDN distribution
- Environment variable management
- Custom domain support

**Backend**: Railway
- Automatic deployments from Git
- Environment variable management
- Persistent storage
- Custom domain support

**Database**: MongoDB Atlas
- Cloud-hosted MongoDB
- Automatic backups
- Monitoring and alerts
- Connection string authentication

## Security Technologies

### Password Security
- bcryptjs hashing (10 salt rounds)
- Never store plain text passwords
- Secure comparison function

### Token Security
- JWT with secret key
- Token expiration (configurable)
- Stored in localStorage (client-side)
- Sent via Authorization header

### CORS Configuration
```javascript
cors({
  origin: 'http://localhost:3000', // Frontend URL
  credentials: true
})
```

## Performance Optimizations

### Frontend
- React.memo for component memoization
- Lazy loading with React.lazy (ready)
- Code splitting with React Router
- Tailwind CSS purging unused styles

### Backend
- MongoDB indexing on frequently queried fields
- Lean queries for read-only operations
- Population only when needed
- Connection pooling (Mongoose default)

### Database
- Indexed fields: email (unique), seller, buyer
- Compound indexes ready for complex queries
- Automatic expiry with TTL indexes (listings)

## Development Tools

### Code Quality
- ESLint (via React Scripts)
- React app linting rules
- Jest for testing

### Version Control
- Git for source control
- .gitignore for sensitive files
- Commit history tracking

### IDE Support
- jsconfig.json for JavaScript IntelliSense
- ESLint integration
- Prettier-ready (not configured)

## Browser Compatibility

### Production Targets
- \>0.2% market share
- Not dead browsers
- Not Opera Mini

### Development Targets
- Last 1 Chrome version
- Last 1 Firefox version
- Last 1 Safari version

## Module System

### Frontend
- ES6 modules (import/export)
- Create React App handles transpilation
- Webpack bundling

### Backend
- CommonJS modules (require/module.exports)
- `"type": "commonjs"` in package.json
- Native Node.js module resolution

## API Versioning Strategy
- Current: `/api/...`
- Future-ready: `/api/v1/...`, `/api/v2/...`
- Backward compatibility maintained

## Monitoring & Logging
- Console logging for development
- Error logging in try-catch blocks
- MongoDB connection status logging
- Server startup confirmation logging

## Testing Strategy
- Frontend: Jest + React Testing Library
- Backend: Manual testing (Postman/curl)
- Integration: End-to-end user flows
- Unit tests ready for expansion
