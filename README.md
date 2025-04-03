# Funraise Backend API

Node.js Express backend API for a React Native application using Prisma ORM with SQLite/PostgreSQL.

## Requirements

- Node.js (v14+)
- npm

## Installation

1. Clone the repository:
```bash
git clone https://github.com/shibakir/funraise.git
cd funraise
```

2. Install dependencies:
```bash
npm install
```

3. Database setup:
   
   **SQLite** (for development):
   ```bash
   # No additional setup needed
   # SQLite database file will be created automatically
   ```
   
   **PostgreSQL** (for production):
   ```bash
   # Setup PostgreSQL
   # Create a database named "funraise"
   # Update .env file with your database credentials
   ```
   
   Configure environment variables:
   Create a `.env` file in the project root with:
   ```
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/funraise?schema=public"
   PORT=3001
   ```

4. Generate Prisma client and apply migrations:
```bash
npm run prisma:generate
npm run prisma:migrate
```

## Running the Application

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm run build
npm start
```

## API Endpoints

### Users

- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## Data Model

### User
- id: Int (auto-increment)
- email: String (unique)
- name: String (optional)
- password: String
- createdAt: DateTime
- updatedAt: DateTime

## Project Structure

```
funraise/
├── prisma/
│   ├── schema.prisma     # Database schema
│   ├── migrations/       # Database migrations
│   └── dev.db            # SQLite database (development)
├── src/
│   ├── controllers/      # Request handlers
│   ├── routes/           # API routes
│   ├── middleware/       # Express middleware
│   ├── config/           # Configuration files
│   └── index.ts          # Entry point
├── .env                  # Environment variables
├── package.json          # Dependencies and scripts
└── tsconfig.json         # TypeScript configuration
``` 