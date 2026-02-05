# Tenantflow Backend

A Node.js backend for Tenantflow - an issue, task, and payment management system.

## Features

- User authentication
- Issue management
- Task tracking
- Cost management
- Invoice generation
- Payment processing (PayHere integration)
- AI-powered suggestions and analysis
- Role-based access control

## Project Structure

```
├── config/           # Configuration files
├── controllers/      # Request handlers
├── routes/          # API routes
├── models/          # Data models
├── middleware/      # Custom middleware
├── services/        # Business logic
├── utils/           # Utility functions
└── server.js        # Entry point
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd tenantflow-backend
```

2. Install dependencies
```bash
npm install
```

3. Create a `.env` file with required environment variables
```
PORT=5000
OPENAI_API_KEY=your_openai_api_key
PAYHERE_MERCHANT_ID=your_payhere_merchant_id
PAYHERE_MERCHANT_SECRET=your_payhere_merchant_secret
```

4. Start the server
```bash
npm start
```

## API Endpoints

- `/api/auth` - Authentication routes
- `/api/issues` - Issue management
- `/api/tasks` - Task management
- `/api/payments` - Payment processing
- `/api/invoices` - Invoice management
- `/api/ai` - AI services

## License

MIT
