# Smart Restaurant Server API

A comprehensive multi-tenant restaurant management system backend built with NestJS, TypeORM, and MySQL. This API serves as the core backend for restaurant operations, providing secure authentication, menu management, order processing, and analytics capabilities.

## 🎆 Overview

The Smart Restaurant Server API is designed to support multi-tenant restaurant operations with:

- **Multi-tenant Architecture**: Each restaurant operates as an isolated tenant
- **Comprehensive Restaurant Management**: Complete solution for restaurant operations
- **Scalable Design**: Built to handle multiple restaurants and high traffic
- **Security First**: JWT authentication with role-based access control
- **Real-time Analytics**: Dashboard insights and business intelligence

## ✨ Key Features

### 🔐 Authentication & Authorization

- **JWT-based Authentication**: Secure token-based authentication
- **Multi-tenant Support**: Tenant-specific user management
- **Role-based Access Control**: Admin, Customer, and Super Admin roles
- **Password Security**: Bcrypt hashing and validation
- **Session Management**: Token refresh and logout capabilities

### 🍽️ Menu Management

- **Dynamic Menu System**: Flexible menu structure with categories
- **Ingredient Tracking**: Comprehensive ingredient management
- **Menu Items & Meals**: Support for both individual items and combo meals
- **Rich Content**: Image uploads and detailed descriptions
- **Pricing Management**: Flexible pricing with discount support
- **Soft Delete**: Safe deletion with restore capabilities

### 📝 Order Processing

- **Order Management**: Complete order lifecycle management
- **Table Management**: Restaurant table configuration and status
- **Reservation System**: Table booking and scheduling
- **Coupon System**: Promotional codes and discounts
- **Order Analytics**: Real-time order tracking and insights

### 📈 Analytics & Dashboard

- **Real-time Statistics**: Live business metrics
- **Revenue Analytics**: Sales tracking and reporting
- **Order Insights**: Order patterns and trends
- **Table Utilization**: Table occupancy and turnover rates
- **Popular Items**: Best-selling menu analysis

### 📁 File Management

- **Image Uploads**: Menu item and restaurant images
- **File Storage**: Organized file structure
- **Image Processing**: Optimized image handling

## 🛠️ Technology Stack

### Core Framework

- **NestJS**: Progressive Node.js framework
- **TypeScript**: Full type safety and enhanced development
- **Node.js**: Runtime environment

### Database & ORM

- **MySQL**: Relational database management
- **TypeORM**: Object-relational mapping with decorators
- **Connection Pooling**: Optimized database connections
- **Migrations**: Database schema version control

### Authentication & Security

- **Passport.js**: Authentication middleware
- **JWT**: JSON Web Tokens for stateless auth
- **Bcrypt**: Password hashing and validation
- **Guards**: Route protection and authorization

### API & Documentation

- **Swagger/OpenAPI**: Comprehensive API documentation
- **Class Validator**: Request validation and sanitization
- **Class Transformer**: Data transformation and serialization

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **MySQL** (v8.0 or higher)
- **npm** or **yarn**
- **Git** for version control

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd smart-restaurant/server
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Configuration**

   Create a `.env` file in the root directory:

   ```env
   # Application Configuration
   PORT=3030
   NODE_ENV=development

   # Database Configuration
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=smart_restaurant

   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRES_IN=24h

   # File Upload Configuration
   UPLOAD_DEST=./uploads

   # CORS Configuration
   FRONTEND_URL=http://localhost:5173

   # Logging Configuration
   LOG_LEVEL=info
   ```

4. **Database Setup**

   Create the database:

   ```sql
   CREATE DATABASE smart_restaurant;
   ```

### Running the Application

```bash
# Development mode with hot reload
npm run start:dev

# Production build
npm run build

# Production mode
npm run start:prod

# Debug mode
npm run start:debug
```

The API will be available at `http://localhost:3030`

### API Documentation

Access the interactive Swagger documentation:

```
http://localhost:3030/api/api-docs
```

## 📁 Project Structure

```
src/
├── auth/                    # Authentication & authorization
│   ├── guards/              # Auth guards and strategies
│   ├── dto/                 # Data transfer objects
│   └── strategies/          # Passport strategies
├── dashboard/              # Analytics and dashboard endpoints
├── database/               # Database configuration
├── file-upload/            # File upload handling
├── logger/                 # Custom logging configuration
├── menu-entities/          # Menu-related modules
│   ├── ingredients/        # Ingredient management
│   ├── menu-categories/    # Menu category management
│   ├── menu-items/         # Menu item management
│   └── menu-meals/         # Meal management
├── order-entities/         # Order-related modules
│   ├── coupons/            # Coupon management
│   ├── orders/             # Order processing
│   ├── tables/             # Table management
│   └── reservations/       # Reservation system
├── roles/                  # Role and permission management
├── tenant/                 # Multi-tenant support
├── users/                  # User management
└── utils/                  # Utility functions and helpers
```

## 📚 API Endpoints

_For complete API documentation, visit the Swagger UI at `/api/api-docs`_

## 📄 License

This project is part of the Smart Restaurant Management System. All rights reserved.
