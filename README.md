# Smart Restaurant Management System API

A comprehensive backend API for restaurant management built with NestJS, TypeORM, and MySQL.

## Features

- **User Management**: Authentication, authorization, and user roles
- **Menu Management**:
  - Ingredients tracking
  - Menu items and meals
  - Menu categories
  - Item-ingredient relationships
- **Order Processing**:
  - Order management
  - Table management
  - Coupon and discount system
- **API Documentation**: Swagger UI for easy API exploration

## Technology Stack

- **Framework**: NestJS
- **Database**: MySQL with TypeORM
- **Authentication**: JWT with Passport
- **API Documentation**: Swagger
- **Validation**: Class Validator
- **Logging**: Winston

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MySQL database
- npm or yarn

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/IbrahimMoatazMohamed/smart-restaurant-management-system-api.git
   cd smart-restaurant-management-system-api
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with the following variables:
   ```
   PORT=3030
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=smart_restaurant
   JWT_SECRET=your_jwt_secret
   ```

### Running the Application

#### Development Mode

```bash
npm run start:dev
```

#### Production Mode

```bash
npm run build
npm run start:prod
```

### API Documentation

Once the application is running, you can access the Swagger documentation at:

```
http://localhost:3030/api/api-docs
```

## Project Structure

- `src/auth`: Authentication and authorization
- `src/logger`: Custom logging configuration
- `src/menu-entities`: Menu-related entities (ingredients, items, meals, categories)
- `src/order-entities`: Order-related entities (orders, tables, coupons)
- `src/users`: User management
- `src/utils`: Utility functions and helpers

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```
