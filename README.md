# 💸 Spendly - Expense Tracker

A full-stack expense tracking application with Google OAuth authentication, built with React (frontend) and Go (backend).

## 🚀 Features

- 📊 Track expenses with categories and subcategories
- 💰 Income and receivables management
- 📈 Analytics and statistics dashboard
- 🎨 Dark/Light theme support
- 🔐 Google OAuth authentication
- 🗄️ PostgreSQL database with optimized queries
- 📱 Responsive design

## 🛠️ Tech Stack

**Frontend:**

- React 18
- Recharts (data visualization)
- Google OAuth
- Vite (build tool)
- Native Fetch API (no axios)

**Backend:**

- Go (Golang)
- PostgreSQL
- JWT authentication
- pgx (PostgreSQL driver)

**Package Manager:**

- pnpm (fast, disk space efficient)

## 📋 Prerequisites

- Go 1.21+
- PostgreSQL 14+
- pnpm 8+ (install globally: `npm install -g pnpm`)
- Google OAuth Client ID

## 🔧 Installation

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/Expense-Tracker.git
cd Expense-Tracker
```

### 2. Set up PostgreSQL

Create a database:

```bash
createdb expense_tracker
```

Run the database migrations:

```bash
psql -d expense_tracker -f backend/database/add_categories_tables.sql
```

### 3. Configure environment variables

Create a `.env` file in the root directory:

```env
DATABASE_URL=postgres://username:password@localhost:5432/expense_tracker
JWT_SECRET=your-secret-key-here
```

Create `frontend/.env`:

```env
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id
```

### 4. Install dependencies

**Frontend:**

```bash
cd frontend
pnpm install
```

**Backend:**

```bash
cd ..
go mod download
```

## 🚀 Running the Application

### Development Mode

**Start the backend:**

```bash
go run main.go
```

The backend will run on `http://localhost:8080`

**Start the frontend (in a new terminal):**

```bash
cd frontend
pnpm dev
```

The frontend will run on `http://localhost:5173`

### Production Build

**Build the frontend:**

```bash
cd frontend
pnpm build
```

**Build the backend:**

```bash
go build -o expense-tracker main.go
./expense-tracker
```

## 📦 Package Manager Migration

This project uses **pnpm** instead of npm for better performance and disk space efficiency.

**Benefits of pnpm:**

- ⚡ Faster installation
- 💾 Efficient disk space usage (global store)
- 🔒 Strict dependency resolution
- 📦 Better monorepo support

**Common pnpm commands:**

```bash
pnpm install          # Install dependencies
pnpm add <package>    # Add a new dependency
pnpm remove <package> # Remove a dependency
pnpm dev              # Run dev script
pnpm build            # Build for production
```

## 🗄️ Database Schema

The application uses a database-driven category system with the following tables:

- `users` - User accounts
- `categories` - Expense categories
- `subcategories` - Subcategories linked to categories
- `expenses` - Transaction records
- `incomes` - Income tracking
- `receivables` - Money to be received

See [`CATEGORIES_MIGRATION.md`](CATEGORIES_MIGRATION.md) for detailed schema documentation.

## 📚 API Endpoints

**Authentication:**

- `POST /api/auth/google` - Google OAuth login
- `GET /api/session` - Get current user session

**Expenses:**

- `GET /api/expenses` - Get all expenses
- `POST /api/expenses/add` - Add new expense
- `DELETE /api/expenses/delete` - Delete expense

**Categories:**

- `GET /api/categories` - Get all categories

**Income:**

- `GET /api/incomes` - Get all incomes
- `POST /api/incomes/add` - Add income

**Receivables:**

- `GET /api/receivables` - Get all receivables
- `POST /api/receivables/add` - Add receivable
- `PUT /api/receivables/update` - Update receivable

**Stats:**

- `GET /api/stats` - Get expense statistics

## 🧪 Testing

See [`TEST_CATEGORIES.md`](TEST_CATEGORIES.md) for testing procedures.

## 📖 Documentation

- [`IMPLEMENTATION_SUMMARY.md`](IMPLEMENTATION_SUMMARY.md) - Implementation details
- [`CATEGORIES_MIGRATION.md`](CATEGORIES_MIGRATION.md) - Database migration guide
- [`TEST_CATEGORIES.md`](TEST_CATEGORIES.md) - Testing guide

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Built with ❤️ using React and Go
- Icons and emojis for better UX
- Google OAuth for secure authentication
- PostgreSQL for robust data storage
