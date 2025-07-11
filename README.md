# FoodieHub - Smart Canteen Order Management System

A modern, full-stack web application for managing canteen orders with real-time updates, payment processing, and user management.

## Features

### For Students/Users
- 🍽️ Browse menu items with search and filters
- 🛒 Shopping cart with real-time stock updates
- 💳 Secure payment processing with Stripe
- 📱 Real-time order status updates
- 👤 User profile management
- 📊 Order history and statistics

### For Staff/Admin
- 📋 Order management dashboard
- 🍕 Menu item management
- 👥 User management
- 📈 Analytics and reporting
- 🔔 Real-time notifications

### Technical Features
- 🚀 Real-time updates with Socket.IO
- 🔐 JWT-based authentication
- 💾 MongoDB database
- 💳 Stripe payment integration
- 📱 Responsive design
- 🎨 Modern UI/UX

## Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **Socket.IO** - Real-time communication
- **Stripe** - Payment processing
- **JWT** - Authentication
- **bcryptjs** - Password hashing

### Frontend
- **Vanilla JavaScript** - No framework dependencies
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with CSS Grid/Flexbox
- **Socket.IO Client** - Real-time updates
- **Stripe.js** - Payment processing

## Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud)
- Stripe account (for payments)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd foodie-hub
   ```

2. **Install dependencies**
   ```bash
   npm run setup
   ```

3. **Configure environment variables**
   ```bash
   cd backend
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   MONGODB_URI=mongodb://localhost:27017/foodie-hub
   JWT_SECRET=your-super-secret-jwt-key-here
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
   STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
   ```

4. **Seed the database**
   ```bash
   npm run seed
   ```

5. **Start the development servers**
   ```bash
   npm run dev
   ```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Default Login Credentials

After seeding the database, you can use these credentials:

- **Student**: john.doe@university.edu / password123
- **Admin**: admin@foodiehub.com / admin123
- **Staff**: staff@foodiehub.com / staff123

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### Menu Endpoints
- `GET /api/menu` - Get menu items (with filters)
- `GET /api/menu/:id` - Get single menu item
- `POST /api/menu` - Create menu item (Admin/Staff)
- `PUT /api/menu/:id` - Update menu item (Admin/Staff)
- `DELETE /api/menu/:id` - Delete menu item (Admin)

### Order Endpoints
- `POST /api/orders` - Create new order
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get single order
- `PUT /api/orders/:id/status` - Update order status (Admin/Staff)

### Payment Endpoints
- `POST /api/payments/create-payment-intent` - Create payment intent
- `POST /api/payments/confirm-payment` - Confirm payment
- `GET /api/payments/config` - Get Stripe config

## Project Structure

```
foodie-hub/
├── backend/
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── User.js
│   │   ├── MenuItem.js
│   │   └── Order.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── menu.js
│   │   ├── orders.js
│   │   ├── users.js
│   │   └── payments.js
│   ├── scripts/
│   │   └── seedData.js
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── js/
│   │   ├── api.js
│   │   ├── app.js
│   │   ├── auth.js
│   │   ├── cart.js
│   │   ├── config.js
│   │   ├── menu.js
│   │   ├── notifications.js
│   │   ├── orders.js
│   │   ├── payments.js
│   │   └── profile.js
│   ├── styles.css
│   └── index.html
└── package.json
```

## Development

### Running in Development Mode
```bash
npm run dev
```

This starts both backend and frontend servers concurrently.

### Backend Only
```bash
npm run backend:dev
```

### Frontend Only
```bash
npm run frontend:dev
```

### Database Seeding
```bash
npm run seed
```

## Deployment

### Backend Deployment
1. Set production environment variables
2. Use a process manager like PM2
3. Configure reverse proxy (nginx)
4. Set up SSL certificates

### Frontend Deployment
1. Serve static files through web server
2. Update API URLs in config.js
3. Configure CORS on backend

## Environment Variables

### Backend (.env)
```env
# Database
MONGODB_URI=mongodb://localhost:27017/foodie-hub

# JWT
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Server
PORT=5000
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

## Testing

### Test Stripe Payments
Use Stripe test card numbers:
- Success: 4242 4242 4242 4242
- Decline: 4000 0000 0000 0002

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@foodiehub.com or create an issue in the repository.