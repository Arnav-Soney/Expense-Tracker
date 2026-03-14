import express from "express";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory database
let expenses = [
  {
    id: "1",
    title: "Zomato dinner",
    category: "🍔 Food & Dining",
    subcategory: "Restaurants",
    amount: 650,
    date: "2025-03-09",
    note: "",
  },
  {
    id: "2",
    title: "Monthly metro pass",
    category: "🚗 Transport",
    subcategory: "Metro / Bus",
    amount: 1200,
    date: "2025-03-01",
    note: "",
  },
  {
    id: "3",
    title: "Netflix",
    category: "🎮 Entertainment",
    subcategory: "Streaming",
    amount: 649,
    date: "2025-03-03",
    note: "",
  },
  {
    id: "4",
    title: "Gym membership",
    category: "🏥 Health",
    subcategory: "Gym",
    amount: 2000,
    date: "2025-03-01",
    note: "",
  },
  {
    id: "5",
    title: "Grocery run",
    category: "🍔 Food & Dining",
    subcategory: "Groceries",
    amount: 1840,
    date: "2025-03-06",
    note: "",
  },
  {
    id: "6",
    title: "Uber to airport",
    category: "🚗 Transport",
    subcategory: "Uber / Ola",
    amount: 980,
    date: "2025-03-08",
    note: "",
  },
  {
    id: "7",
    title: "New hoodie",
    category: "👗 Shopping",
    subcategory: "Clothing",
    amount: 1299,
    date: "2025-03-07",
    note: "",
  },
  {
    id: "8",
    title: "AWS course",
    category: "📚 Education",
    subcategory: "Courses",
    amount: 3499,
    date: "2025-03-05",
    note: "",
  },
  {
    id: "9",
    title: "Dominos pizza",
    category: "🍔 Food & Dining",
    subcategory: "Fast Food",
    amount: 520,
    date: "2025-03-10",
    note: "",
  },
  {
    id: "10",
    title: "Electricity bill",
    category: "🏠 Housing",
    subcategory: "Electricity",
    amount: 1450,
    date: "2025-03-02",
    note: "",
  },
];

// Routes

// Get all expenses
app.get("/api/expenses", (req, res) => {
  res.json(expenses);
});

// Get single expense
app.get("/api/expenses/:id", (req, res) => {
  const expense = expenses.find((e) => e.id === req.params.id);
  if (!expense) {
    return res.status(404).json({ error: "Expense not found" });
  }
  res.json(expense);
});

// Create expense
app.post("/api/expenses", (req, res) => {
  const { title, category, subcategory, amount, date, note } = req.body;

  if (!title || !category || !subcategory || !amount) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const newExpense = {
    id: uuidv4(),
    title,
    category,
    subcategory,
    amount: parseFloat(amount),
    date,
    note,
  };

  expenses.push(newExpense);
  res.status(201).json(newExpense);
});

// Update expense
app.put("/api/expenses/:id", (req, res) => {
  const expense = expenses.find((e) => e.id === req.params.id);
  if (!expense) {
    return res.status(404).json({ error: "Expense not found" });
  }

  const { title, category, subcategory, amount, date, note } = req.body;
  if (title) expense.title = title;
  if (category) expense.category = category;
  if (subcategory) expense.subcategory = subcategory;
  if (amount) expense.amount = parseFloat(amount);
  if (date) expense.date = date;
  if (note !== undefined) expense.note = note;

  res.json(expense);
});

// Delete expense
app.delete("/api/expenses/:id", (req, res) => {
  const index = expenses.findIndex((e) => e.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Expense not found" });
  }

  const deletedExpense = expenses.splice(index, 1);
  res.json(deletedExpense[0]);
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(
    `📚 API Docs: GET/POST/PUT/DELETE http://localhost:${PORT}/api/expenses`,
  );
});
