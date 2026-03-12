# Product Overview

## Project Identity
**Urjamitra** (ऊर्जा मित्र) — "Share electricity, grow friendship"

A peer-to-peer energy exchange platform enabling homeowners with solar panels to sell surplus electricity directly to neighbors, eliminating middlemen and maximizing community energy efficiency.

Built for Prayatna 3.0 Hackathon 2026 at Acropolis Institute of Technology, Indore.

## Core Problem
Indian neighborhoods with rooftop solar panels generate surplus electricity that goes unused while neighbors pay full grid rates for power that could come from 50 meters away. No efficient mechanism exists for direct peer-to-peer energy trading.

## Solution
A marketplace platform where:
- Solar panel owners list surplus energy with custom pricing
- Neighbors discover and purchase energy directly
- Transactions execute automatically with wallet system
- Community builds trust through ratings and reviews
- Environmental impact is tracked and visualized

## Key Features

### Energy Marketplace
- Browse available energy listings from nearby sellers
- Filter by availability, price, and seller ratings
- Create listings with custom units and pricing
- Real-time inventory tracking
- Automatic listing expiry (30 days)

### Transaction System
- Direct peer-to-peer energy purchases
- Automatic wallet debit/credit on completion
- Complete transaction history (purchases and sales)
- Status tracking (pending, completed, cancelled)
- Net earnings/spending calculations

### Wallet & Economy
- Virtual wallet for managing funds
- Add balance functionality
- Automatic payment processing
- Earnings tracking for sellers
- Spending tracking for buyers

### Trust & Reputation
- 5-star rating system for users
- Transaction-based reviews
- Community trust scores
- Seller ratings visible on listings
- Accountability through feedback

### Environmental Impact
- CO₂ savings calculated per transaction
- Personal environmental impact tracking
- Community-wide savings visualization
- Energy generation and sharing statistics

### User Profiles
- Personal energy generation capacity
- Total energy shared/sold/bought metrics
- Wallet balance display
- Community rating and reviews
- Complete trading history

### Interactive Map (MapView)
- Visual neighborhood map showing sellers and buyers
- Click markers to view listing details
- Geographic discovery of nearby energy sources
- Location-based filtering

## Target Users

### Primary: Solar Panel Owners
- Homeowners with rooftop solar installations
- Generate more electricity than they consume
- Want to monetize surplus energy
- Prefer direct community transactions

### Secondary: Energy Buyers
- Neighbors without solar panels
- Want cheaper electricity than grid rates
- Prefer supporting local renewable energy
- Value community-based solutions

## Value Proposition

**For Sellers:**
- Monetize wasted surplus energy
- Set your own pricing
- Build community reputation
- Track environmental contribution
- Average earnings: ₹820/month (projected)

**For Buyers:**
- Access cheaper electricity than grid rates
- Support local renewable energy
- Transparent pricing and seller ratings
- Contribute to environmental goals
- Community savings: ₹14,820/month (10-home pilot)

**For Community:**
- Reduce collective carbon footprint
- Strengthen neighborhood connections
- Decentralized energy distribution
- Fair price discovery
- Environmental impact: 186 kg CO₂ saved/month (projected)

## Use Cases

### Daily Surplus Trading
Solar owner generates 12 kWh daily, uses 7 kWh, lists 5 kWh for sale at ₹18/unit. Neighbor buys 3 kWh for ₹54. Both benefit.

### Emergency Backup
Grid outage occurs. Neighbors with battery storage list available energy. Community stays powered through peer support.

### Seasonal Optimization
Summer months generate excess solar. Owners list surplus at competitive rates. Buyers reduce AC costs significantly.

### Community Building
Regular transactions build trust. Ratings create accountability. Neighborhood becomes energy-resilient collective.

## Success Metrics (Projected 10-Home Pilot)
- Homes connected: 48
- Energy traded: 284 kWh/month
- Community savings: ₹14,820/month
- CO₂ reduced: 186 kg/month
- Average seller earnings: ₹820/month

## Technology Approach
Full-stack web application with React frontend, Node.js/Express backend, MongoDB database, JWT authentication, and Leaflet.js mapping. Designed for rapid deployment on Vercel (frontend) and Railway (backend).
