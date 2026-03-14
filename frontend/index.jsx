import { useState, useEffect, useRef } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from "recharts";

// ── Google Auth Mock ──────────────────────────────────────────────────────────
const MOCK_USERS = [
  { id: "1", name: "Alex Rivera", email: "alex@gmail.com", avatar: "AR" },
];

// ── Categories & Subcategories ────────────────────────────────────────────────
const CATEGORIES = {
  "🍔 Food & Dining": [
    "Restaurants",
    "Groceries",
    "Coffee & Tea",
    "Fast Food",
    "Bars & Nightlife",
    "Bakeries",
  ],
  "🚗 Transport": [
    "Fuel",
    "Uber / Ola",
    "Metro / Bus",
    "Flight",
    "Parking",
    "Bike Rental",
  ],
  "🏠 Housing": [
    "Rent",
    "Electricity",
    "Water",
    "Internet",
    "Maintenance",
    "Furniture",
  ],
  "🎮 Entertainment": [
    "Streaming",
    "Games",
    "Movies",
    "Concerts",
    "Books",
    "Hobbies",
  ],
  "🏥 Health": [
    "Doctor",
    "Pharmacy",
    "Gym",
    "Dental",
    "Insurance",
    "Mental Health",
  ],
  "👗 Shopping": [
    "Clothing",
    "Electronics",
    "Accessories",
    "Home Decor",
    "Beauty",
    "Sports",
  ],
  "📚 Education": [
    "Courses",
    "Books",
    "Subscriptions",
    "Workshops",
    "Stationery",
    "Tuition",
  ],
  "✈️ Travel": [
    "Hotels",
    "Flights",
    "Activities",
    "Food Abroad",
    "Souvenirs",
    "Visas",
  ],
};

const CAT_COLORS = [
  "#22d3a0",
  "#f59e0b",
  "#6366f1",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#8b5cf6",
  "#06b6d4",
];

// ── Utility ───────────────────────────────────────────────────────────────────
function fmt(n) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

function today() {
  return new Date().toISOString().split("T")[0];
}

function dayLabel(d) {
  return new Date(d).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

// ── Seed Data ─────────────────────────────────────────────────────────────────
const SEED = [
  {
    id: 1,
    title: "Zomato dinner",
    category: "🍔 Food & Dining",
    subcategory: "Restaurants",
    amount: 650,
    date: "2025-03-09",
    note: "",
  },
  {
    id: 2,
    title: "Monthly metro pass",
    category: "🚗 Transport",
    subcategory: "Metro / Bus",
    amount: 1200,
    date: "2025-03-01",
    note: "",
  },
  {
    id: 3,
    title: "Netflix",
    category: "🎮 Entertainment",
    subcategory: "Streaming",
    amount: 649,
    date: "2025-03-03",
    note: "",
  },
  {
    id: 4,
    title: "Gym membership",
    category: "🏥 Health",
    subcategory: "Gym",
    amount: 2000,
    date: "2025-03-01",
    note: "",
  },
  {
    id: 5,
    title: "Grocery run",
    category: "🍔 Food & Dining",
    subcategory: "Groceries",
    amount: 1840,
    date: "2025-03-06",
    note: "",
  },
  {
    id: 6,
    title: "Uber to airport",
    category: "🚗 Transport",
    subcategory: "Uber / Ola",
    amount: 980,
    date: "2025-03-08",
    note: "",
  },
  {
    id: 7,
    title: "New hoodie",
    category: "👗 Shopping",
    subcategory: "Clothing",
    amount: 1299,
    date: "2025-03-07",
    note: "",
  },
  {
    id: 8,
    title: "AWS course",
    category: "📚 Education",
    subcategory: "Courses",
    amount: 3499,
    date: "2025-03-05",
    note: "",
  },
  {
    id: 9,
    title: "Dominos pizza",
    category: "🍔 Food & Dining",
    subcategory: "Fast Food",
    amount: 520,
    date: "2025-03-10",
    note: "",
  },
  {
    id: 10,
    title: "Electricity bill",
    category: "🏠 Housing",
    subcategory: "Electricity",
    amount: 1450,
    date: "2025-03-02",
    note: "",
  },
];

// ── Components ────────────────────────────────────────────────────────────────

function Avatar({ initials, size = 36 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "linear-gradient(135deg,#22d3a0,#6366f1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: size * 0.38,
        color: "#0a0f1e",
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

// ── SIGN-IN PAGE ──────────────────────────────────────────────────────────────
function AuthPage({ onAuth }) {
  const [tab, setTab] = useState("signin");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [spinning, setSpinning] = useState(false);

  function handleGoogle() {
    setSpinning(true);
    setTimeout(() => {
      onAuth({
        id: "g1",
        name: "Alex Rivera",
        email: "alex@gmail.com",
        avatar: "AR",
      });
    }, 1200);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#07090f",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'DM Sans', sans-serif",
        backgroundImage:
          "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(34,211,160,0.18) 0%, transparent 70%)",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: #0d1117; } ::-webkit-scrollbar-thumb { background: #22d3a020; border-radius:3px; }
        .auth-tab { cursor:pointer; padding:8px 20px; border-radius:6px; font-size:14px; font-weight:600; transition:all .2s; color:#64748b; background:transparent; border:none; }
        .auth-tab.active { background:#1a2236; color:#22d3a0; }
        .auth-input { width:100%; padding:12px 14px; background:#1a2236; border:1.5px solid #1e2d47; border-radius:10px; color:#e2e8f0; font-size:14px; outline:none; transition:border .2s; font-family:inherit; }
        .auth-input:focus { border-color:#22d3a0; }
        .auth-input::placeholder { color:#475569; }
        .google-btn { width:100%; padding:13px; background:#fff; border:none; border-radius:12px; display:flex; align-items:center; justify-content:center; gap:10px; font-size:15px; font-weight:600; color:#1e293b; cursor:pointer; transition:transform .15s, box-shadow .15s; }
        .google-btn:hover { transform:translateY(-1px); box-shadow:0 6px 20px rgba(255,255,255,.1); }
        .primary-btn { width:100%; padding:13px; background:linear-gradient(135deg,#22d3a0,#14b8a6); border:none; border-radius:12px; color:#0a0f1e; font-size:15px; font-weight:700; cursor:pointer; transition:opacity .2s; }
        .primary-btn:hover { opacity:.9; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform:rotate(360deg); } }
      `}</style>

      <div
        style={{
          width: 420,
          background: "#0d1117",
          border: "1px solid #1e2d47",
          borderRadius: 20,
          padding: 40,
          boxShadow: "0 40px 80px rgba(0,0,0,.6)",
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 36, marginBottom: 6 }}>💸</div>
          <div
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 28,
              fontWeight: 800,
              color: "#f1f5f9",
              letterSpacing: -0.5,
            }}
          >
            Spendly
          </div>
          <div style={{ fontSize: 13, color: "#475569", marginTop: 4 }}>
            Track every rupee, effortlessly
          </div>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            background: "#0a0f1e",
            borderRadius: 8,
            padding: 4,
            marginBottom: 28,
          }}
        >
          <button
            className={`auth-tab${tab === "signin" ? " active" : ""}`}
            style={{ flex: 1 }}
            onClick={() => setTab("signin")}
          >
            Sign In
          </button>
          <button
            className={`auth-tab${tab === "signup" ? " active" : ""}`}
            style={{ flex: 1 }}
            onClick={() => setTab("signup")}
          >
            Sign Up
          </button>
        </div>

        {/* Google Auth */}
        <button
          className="google-btn"
          onClick={handleGoogle}
          style={{ marginBottom: 20 }}
        >
          {spinning ? (
            <div
              className="spin"
              style={{
                width: 20,
                height: 20,
                border: "2px solid #ccc",
                borderTopColor: "#22d3a0",
                borderRadius: "50%",
              }}
            />
          ) : (
            <svg width="20" height="20" viewBox="0 0 48 48">
              <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
              />
              <path
                fill="#4285F4"
                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
              />
              <path
                fill="#FBBC05"
                d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
              />
              <path
                fill="#34A853"
                d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
              />
              <path fill="none" d="M0 0h48v48H0z" />
            </svg>
          )}
          Continue with Google
        </button>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 20,
          }}
        >
          <div style={{ flex: 1, height: 1, background: "#1e2d47" }} />
          <span style={{ fontSize: 12, color: "#475569" }}>or with email</span>
          <div style={{ flex: 1, height: 1, background: "#1e2d47" }} />
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            marginBottom: 20,
          }}
        >
          {tab === "signup" && (
            <input
              className="auth-input"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}
          <input
            className="auth-input"
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="auth-input"
            type="password"
            placeholder="Password"
          />
        </div>

        <button className="primary-btn" onClick={handleGoogle}>
          {tab === "signin" ? "Sign In" : "Create Account"}
        </button>
      </div>
    </div>
  );
}

// ── ADD EXPENSE MODAL ─────────────────────────────────────────────────────────
function AddExpenseModal({ onClose, onAdd }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today());
  const [note, setNote] = useState("");

  const subcats = category ? CATEGORIES[category] : [];

  function submit() {
    if (!title || !category || !subcategory || !amount) return;
    onAdd({
      id: Date.now(),
      title,
      category,
      subcategory,
      amount: parseFloat(amount),
      date,
      note,
    });
    onClose();
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.75)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#0d1117",
          border: "1px solid #1e2d47",
          borderRadius: 20,
          padding: 36,
          width: 480,
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 40px 80px rgba(0,0,0,.8)",
          animation: "slideUp .25s ease",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <style>{`@keyframes slideUp { from { transform:translateY(20px); opacity:0; } to { transform:translateY(0); opacity:1; } }`}</style>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 28,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "'Syne',sans-serif",
                fontSize: 22,
                fontWeight: 800,
                color: "#f1f5f9",
              }}
            >
              Add Expense
            </div>
            <div style={{ fontSize: 13, color: "#475569", marginTop: 2 }}>
              Log a new transaction
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "#1a2236",
              border: "none",
              color: "#64748b",
              width: 34,
              height: 34,
              borderRadius: "50%",
              cursor: "pointer",
              fontSize: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ×
          </button>
        </div>

        {/* Form fields */}
        {[
          {
            label: "Expense Title",
            el: (
              <input
                className="modal-input"
                placeholder="e.g. Zomato dinner"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            ),
          },
          {
            label: "Category",
            el: (
              <select
                className="modal-input"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setSubcategory("");
                }}
              >
                <option value="">Select a category</option>
                {Object.keys(CATEGORIES).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            ),
          },
          {
            label: "Subcategory",
            el: (
              <select
                className="modal-input"
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                disabled={!category}
              >
                <option value="">
                  {category ? "Select subcategory" : "Pick a category first"}
                </option>
                {subcats.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            ),
          },
          {
            label: "Amount (₹)",
            el: (
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#22d3a0",
                    fontWeight: 700,
                  }}
                >
                  ₹
                </span>
                <input
                  className="modal-input"
                  style={{ paddingLeft: 32 }}
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            ),
          },
          {
            label: "Date",
            el: (
              <input
                className="modal-input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            ),
          },
          {
            label: "Note (optional)",
            el: (
              <textarea
                className="modal-input"
                rows={3}
                style={{ resize: "none" }}
                placeholder="Any extra details..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            ),
          },
        ].map(({ label, el }) => (
          <div key={label} style={{ marginBottom: 16 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#64748b",
                marginBottom: 6,
                letterSpacing: 0.5,
                textTransform: "uppercase",
              }}
            >
              {label}
            </div>
            {el}
          </div>
        ))}

        <style>{`
          .modal-input { width:100%; padding:12px 14px; background:#1a2236; border:1.5px solid #1e2d47; border-radius:10px; color:#e2e8f0; font-size:14px; outline:none; transition:border .2s; font-family:'DM Sans',sans-serif; }
          .modal-input:focus { border-color:#22d3a0; }
          .modal-input::placeholder { color:#475569; }
          .modal-input option { background:#0d1117; }
        `}</style>

        <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: 13,
              background: "#1a2236",
              border: "none",
              borderRadius: 12,
              color: "#94a3b8",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={submit}
            style={{
              flex: 2,
              padding: 13,
              background: "linear-gradient(135deg,#22d3a0,#14b8a6)",
              border: "none",
              borderRadius: 12,
              color: "#0a0f1e",
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Save Expense
          </button>
        </div>
      </div>
    </div>
  );
}

// ── EXPENSE ROW ───────────────────────────────────────────────────────────────
function ExpenseRow({ exp, onDelete }) {
  const idx = Object.keys(CATEGORIES).indexOf(exp.category);
  const color = CAT_COLORS[idx % CAT_COLORS.length] || "#22d3a0";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        background: "#0d1117",
        border: "1px solid #1e2d47",
        borderRadius: 14,
        padding: "14px 18px",
        transition: "border-color .2s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#22d3a040")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#1e2d47")}
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 12,
          background: color + "22",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 20,
          flexShrink: 0,
        }}
      >
        {exp.category.split(" ")[0]}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: 600,
            color: "#f1f5f9",
            fontSize: 14,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {exp.title}
        </div>
        <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>
          {exp.subcategory} · {dayLabel(exp.date)}
        </div>
      </div>
      <div
        style={{
          fontFamily: "'Syne',sans-serif",
          fontWeight: 700,
          fontSize: 16,
          color: "#f1f5f9",
          flexShrink: 0,
        }}
      >
        {fmt(exp.amount)}
      </div>
      <button
        onClick={() => onDelete(exp.id)}
        style={{
          background: "none",
          border: "none",
          color: "#334155",
          cursor: "pointer",
          fontSize: 16,
          padding: 4,
          lineHeight: 1,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#f43f5e")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#334155")}
      >
        ✕
      </button>
    </div>
  );
}

// ── HOME PAGE ─────────────────────────────────────────────────────────────────
function HomePage({ expenses, onAdd }) {
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const thisMonth = expenses.filter((e) => e.date.startsWith("2025-03"));
  const monthTotal = thisMonth.reduce((s, e) => s + e.amount, 0);
  const recent = [...expenses]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  const catTotals = {};
  expenses.forEach((e) => {
    catTotals[e.category] = (catTotals[e.category] || 0) + e.amount;
  });
  const topCat = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0];

  return (
    <div style={{ padding: "32px 36px", maxWidth: 900, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div
          style={{
            fontFamily: "'Syne',sans-serif",
            fontSize: 28,
            fontWeight: 800,
            color: "#f1f5f9",
          }}
        >
          Good morning 👋
        </div>
        <div style={{ color: "#475569", marginTop: 4 }}>
          Here's your spending overview
        </div>
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: 16,
          marginBottom: 32,
        }}
      >
        {[
          {
            label: "Total Logged",
            value: fmt(total),
            icon: "📊",
            accent: "#22d3a0",
          },
          {
            label: "This Month",
            value: fmt(monthTotal),
            icon: "📅",
            accent: "#6366f1",
          },
          {
            label: "Top Category",
            value: topCat ? topCat[0].split(" ").slice(1).join(" ") : "—",
            icon: "🏆",
            accent: "#f59e0b",
          },
        ].map(({ label, value, icon, accent }) => (
          <div
            key={label}
            style={{
              background: "#0d1117",
              border: `1px solid ${accent}33`,
              borderRadius: 16,
              padding: "20px 22px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -10,
                right: -10,
                fontSize: 50,
                opacity: 0.08,
              }}
            >
              {icon}
            </div>
            <div
              style={{
                fontSize: 12,
                color: "#475569",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              {label}
            </div>
            <div
              style={{
                fontFamily: "'Syne',sans-serif",
                fontSize: 24,
                fontWeight: 800,
                color: accent,
                marginTop: 6,
              }}
            >
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Add button */}
      <div style={{ marginBottom: 32 }}>
        <button
          onClick={onAdd}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            background: "linear-gradient(135deg,#22d3a0,#14b8a6)",
            border: "none",
            borderRadius: 16,
            padding: "18px 28px",
            cursor: "pointer",
            boxShadow: "0 8px 32px rgba(34,211,160,.25)",
            transition: "transform .15s, box-shadow .15s",
            fontFamily: "'DM Sans',sans-serif",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow =
              "0 12px 40px rgba(34,211,160,.35)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 8px 32px rgba(34,211,160,.25)";
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              background: "rgba(0,0,0,.2)",
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
            }}
          >
            🧾
          </div>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#0a0f1e" }}>
              Add Expense
            </div>
            <div
              style={{
                fontSize: 12,
                color: "rgba(10,15,30,.65)",
                marginTop: 1,
              }}
            >
              Log a new transaction instantly
            </div>
          </div>
          <div
            style={{
              marginLeft: "auto",
              fontSize: 22,
              color: "rgba(10,15,30,.5)",
            }}
          >
            +
          </div>
        </button>
      </div>

      {/* Recent */}
      <div>
        <div
          style={{
            fontFamily: "'Syne',sans-serif",
            fontSize: 17,
            fontWeight: 700,
            color: "#f1f5f9",
            marginBottom: 14,
          }}
        >
          Recent Transactions
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {recent.length === 0 ? (
            <div
              style={{
                color: "#475569",
                fontSize: 14,
                textAlign: "center",
                padding: "30px 0",
              }}
            >
              No expenses yet. Add one above!
            </div>
          ) : (
            recent.map((e) => (
              <ExpenseRow key={e.id} exp={e} onDelete={() => {}} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── EXPENSES PAGE ─────────────────────────────────────────────────────────────
function ExpensesPage({ expenses, onDelete }) {
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("All");

  const filtered = expenses
    .filter((e) => filterCat === "All" || e.category === filterCat)
    .filter(
      (e) =>
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        e.subcategory.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => b.date.localeCompare(a.date));

  const cats = ["All", ...Object.keys(CATEGORIES)];

  return (
    <div style={{ padding: "32px 36px", maxWidth: 900, margin: "0 auto" }}>
      <div
        style={{
          fontFamily: "'Syne',sans-serif",
          fontSize: 28,
          fontWeight: 800,
          color: "#f1f5f9",
          marginBottom: 8,
        }}
      >
        All Expenses
      </div>
      <div style={{ color: "#475569", marginBottom: 28 }}>
        {filtered.length} transaction{filtered.length !== 1 ? "s" : ""}
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 20 }}>
        <span
          style={{
            position: "absolute",
            left: 14,
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: 16,
          }}
        >
          🔍
        </span>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search expenses..."
          style={{
            width: "100%",
            padding: "12px 14px 12px 40px",
            background: "#0d1117",
            border: "1.5px solid #1e2d47",
            borderRadius: 12,
            color: "#e2e8f0",
            fontSize: 14,
            outline: "none",
            fontFamily: "inherit",
          }}
        />
      </div>

      {/* Category filter pills */}
      <div
        style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}
      >
        {cats.map((c) => (
          <button
            key={c}
            onClick={() => setFilterCat(c)}
            style={{
              padding: "6px 14px",
              borderRadius: 20,
              border: "1px solid",
              borderColor: filterCat === c ? "#22d3a0" : "#1e2d47",
              background: filterCat === c ? "#22d3a022" : "transparent",
              color: filterCat === c ? "#22d3a0" : "#64748b",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {c === "All" ? "All" : c.split(" ")[0]}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.length === 0 ? (
          <div
            style={{
              color: "#475569",
              fontSize: 14,
              textAlign: "center",
              padding: "40px 0",
            }}
          >
            No matching expenses found.
          </div>
        ) : (
          filtered.map((e) => (
            <ExpenseRow key={e.id} exp={e} onDelete={onDelete} />
          ))
        )}
      </div>

      <div
        style={{
          marginTop: 24,
          padding: "18px 22px",
          background: "#0d1117",
          border: "1px solid #1e2d47",
          borderRadius: 14,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span style={{ color: "#64748b", fontWeight: 600 }}>Total</span>
        <span
          style={{
            fontFamily: "'Syne',sans-serif",
            fontWeight: 800,
            color: "#22d3a0",
            fontSize: 18,
          }}
        >
          {fmt(filtered.reduce((s, e) => s + e.amount, 0))}
        </span>
      </div>
    </div>
  );
}

// ── VISUALISE PAGE ────────────────────────────────────────────────────────────
const CUSTOM_TOOLTIP = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "#1a2236",
        border: "1px solid #1e2d47",
        borderRadius: 10,
        padding: "10px 14px",
        fontFamily: "'DM Sans',sans-serif",
        fontSize: 13,
        color: "#f1f5f9",
      }}
    >
      <div style={{ fontWeight: 700 }}>
        {payload[0].name || payload[0].dataKey}
      </div>
      <div style={{ color: "#22d3a0", fontWeight: 600 }}>
        {typeof payload[0].value === "number" && payload[0].value > 100
          ? fmt(payload[0].value)
          : `${payload[0].value}${typeof payload[0].value === "number" && payload[0].value < 100 ? "%" : ""}`}
      </div>
    </div>
  );
};

function VisualisePage({ expenses }) {
  const [dayView, setDayView] = useState("week");

  // Category totals
  const catTotals = {};
  expenses.forEach((e) => {
    catTotals[e.category] = (catTotals[e.category] || 0) + e.amount;
  });
  const total = Object.values(catTotals).reduce((s, v) => s + v, 0);
  const piePercent = Object.entries(catTotals).map(([name, value], i) => ({
    name: name.split(" ").slice(1).join(" "),
    value: Math.round((value / total) * 100),
    color: CAT_COLORS[i % CAT_COLORS.length],
  }));
  const pieAbs = Object.entries(catTotals).map(([name, value], i) => ({
    name: name.split(" ").slice(1).join(" "),
    value,
    color: CAT_COLORS[i % CAT_COLORS.length],
  }));

  // Day-wise bar
  const dayMap = {};
  expenses.forEach((e) => {
    dayMap[e.date] = (dayMap[e.date] || 0) + e.amount;
  });
  const allDates = Object.keys(dayMap).sort();

  // Month-wise bar
  const monthMap = {};
  expenses.forEach((e) => {
    const m = e.date.slice(0, 7);
    monthMap[m] = (monthMap[m] || 0) + e.amount;
  });
  const monthData = Object.entries(monthMap)
    .sort()
    .map(([m, v]) => ({
      name: new Date(m + "-01").toLocaleDateString("en-IN", {
        month: "short",
        year: "2-digit",
      }),
      value: v,
    }));

  const weekDates = allDates.slice(-7);
  const dayData = (dayView === "week" ? weekDates : allDates).map((d) => ({
    name: new Date(d).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    }),
    value: dayMap[d],
  }));

  const Section = ({ title, sub, children }) => (
    <div
      style={{
        background: "#0d1117",
        border: "1px solid #1e2d47",
        borderRadius: 18,
        padding: "24px 28px",
        marginBottom: 24,
      }}
    >
      <div
        style={{
          fontFamily: "'Syne',sans-serif",
          fontSize: 18,
          fontWeight: 700,
          color: "#f1f5f9",
          marginBottom: 4,
        }}
      >
        {title}
      </div>
      {sub && (
        <div style={{ fontSize: 13, color: "#475569", marginBottom: 20 }}>
          {sub}
        </div>
      )}
      {children}
    </div>
  );

  const renderCustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    name,
  }) => {
    if (percent < 0.07) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text
        x={x}
        y={y}
        fill="#0a0f1e"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={12}
        fontWeight={700}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div style={{ padding: "32px 36px", maxWidth: 900, margin: "0 auto" }}>
      <div
        style={{
          fontFamily: "'Syne',sans-serif",
          fontSize: 28,
          fontWeight: 800,
          color: "#f1f5f9",
          marginBottom: 8,
        }}
      >
        Visualise
      </div>
      <div style={{ color: "#475569", marginBottom: 32 }}>
        Charts & spending patterns
      </div>

      {/* Pie charts row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            background: "#0d1117",
            border: "1px solid #1e2d47",
            borderRadius: 18,
            padding: "24px",
          }}
        >
          <div
            style={{
              fontFamily: "'Syne',sans-serif",
              fontSize: 16,
              fontWeight: 700,
              color: "#f1f5f9",
              marginBottom: 4,
            }}
          >
            Category Split
          </div>
          <div style={{ fontSize: 12, color: "#475569", marginBottom: 16 }}>
            Percentage breakdown
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={piePercent}
                cx="50%"
                cy="50%"
                outerRadius={90}
                dataKey="value"
                labelLine={false}
                label={renderCustomLabel}
              >
                {piePercent.map((e, i) => (
                  <Cell key={i} fill={e.color} />
                ))}
              </Pie>
              <Tooltip content={<CUSTOM_TOOLTIP />} />
            </PieChart>
          </ResponsiveContainer>
          <div
            style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}
          >
            {piePercent.map((e, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 11,
                  color: "#94a3b8",
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 2,
                    background: e.color,
                  }}
                />
                {e.name}
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            background: "#0d1117",
            border: "1px solid #1e2d47",
            borderRadius: 18,
            padding: "24px",
          }}
        >
          <div
            style={{
              fontFamily: "'Syne',sans-serif",
              fontSize: 16,
              fontWeight: 700,
              color: "#f1f5f9",
              marginBottom: 4,
            }}
          >
            Amounts by Category
          </div>
          <div style={{ fontSize: 12, color: "#475569", marginBottom: 16 }}>
            Absolute values (₹)
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieAbs}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={90}
                dataKey="value"
                paddingAngle={3}
              >
                {pieAbs.map((e, i) => (
                  <Cell key={i} fill={e.color} />
                ))}
              </Pie>
              <Tooltip
                content={<CUSTOM_TOOLTIP />}
                formatter={(v) => [fmt(v)]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div
            style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}
          >
            {pieAbs.map((e, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 11,
                  color: "#94a3b8",
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 2,
                    background: e.color,
                  }}
                />
                {e.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Day-wise bar */}
      <div
        style={{
          background: "#0d1117",
          border: "1px solid #1e2d47",
          borderRadius: 18,
          padding: "24px 28px",
          marginBottom: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 20,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "'Syne',sans-serif",
                fontSize: 18,
                fontWeight: 700,
                color: "#f1f5f9",
              }}
            >
              Daily Spend
            </div>
            <div style={{ fontSize: 13, color: "#475569", marginTop: 2 }}>
              Expense amount per day
            </div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {["week", "all"].map((v) => (
              <button
                key={v}
                onClick={() => setDayView(v)}
                style={{
                  padding: "5px 14px",
                  borderRadius: 8,
                  border: "1px solid",
                  borderColor: dayView === v ? "#22d3a0" : "#1e2d47",
                  background: dayView === v ? "#22d3a022" : "transparent",
                  color: dayView === v ? "#22d3a0" : "#475569",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {v === "week" ? "7 Days" : "All"}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={230}>
          <BarChart data={dayData} barSize={28}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#1e2d47"
              vertical={false}
            />
            <XAxis
              dataKey="name"
              tick={{ fill: "#475569", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#475569", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) =>
                `₹${v >= 1000 ? (v / 1000).toFixed(0) + "k" : v}`
              }
            />
            <Tooltip
              content={<CUSTOM_TOOLTIP />}
              cursor={{ fill: "#22d3a010" }}
            />
            <Bar
              dataKey="value"
              name="Amount"
              fill="#22d3a0"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Month-wise bar */}
      <div
        style={{
          background: "#0d1117",
          border: "1px solid #1e2d47",
          borderRadius: 18,
          padding: "24px 28px",
        }}
      >
        <div
          style={{
            fontFamily: "'Syne',sans-serif",
            fontSize: 18,
            fontWeight: 700,
            color: "#f1f5f9",
            marginBottom: 4,
          }}
        >
          Monthly Overview
        </div>
        <div style={{ fontSize: 13, color: "#475569", marginBottom: 20 }}>
          Total spend per calendar month
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={monthData} barSize={36}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#1e2d47"
              vertical={false}
            />
            <XAxis
              dataKey="name"
              tick={{ fill: "#475569", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#475569", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) =>
                `₹${v >= 1000 ? (v / 1000).toFixed(0) + "k" : v}`
              }
            />
            <Tooltip
              content={<CUSTOM_TOOLTIP />}
              cursor={{ fill: "#6366f110" }}
            />
            <Bar
              dataKey="value"
              name="Amount"
              fill="#6366f1"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── SIDEBAR ───────────────────────────────────────────────────────────────────
function Sidebar({ page, setPage, user, onSignOut, onAdd }) {
  const nav = [
    { id: "home", icon: "🏠", label: "Home" },
    { id: "expenses", icon: "📋", label: "Expenses" },
    { id: "visualise", icon: "📊", label: "Visualise" },
  ];
  return (
    <div
      style={{
        width: 230,
        background: "#07090f",
        borderRight: "1px solid #1e2d47",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "sticky",
        top: 0,
        flexShrink: 0,
      }}
    >
      {/* Brand */}
      <div
        style={{ padding: "28px 24px 20px", borderBottom: "1px solid #0f1623" }}
      >
        <div
          style={{
            fontFamily: "'Syne',sans-serif",
            fontSize: 22,
            fontWeight: 800,
            color: "#f1f5f9",
          }}
        >
          💸 Spendly
        </div>
        <div
          style={{
            fontSize: 11,
            color: "#334155",
            marginTop: 2,
            letterSpacing: 0.5,
          }}
        >
          EXPENSE TRACKER
        </div>
      </div>

      {/* Add Expense CTA */}
      <div style={{ padding: "16px 18px 8px" }}>
        <button
          onClick={onAdd}
          style={{
            width: "100%",
            padding: "11px 16px",
            background: "linear-gradient(135deg,#22d3a0,#14b8a6)",
            border: "none",
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            gap: 10,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          <span style={{ fontSize: 16 }}>🧾</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#0a0f1e" }}>
            Add Expense
          </span>
          <span
            style={{
              marginLeft: "auto",
              color: "rgba(10,15,30,.6)",
              fontSize: 18,
              lineHeight: 1,
            }}
          >
            +
          </span>
        </button>
      </div>

      {/* Navigation */}
      <nav style={{ padding: "8px 12px", flex: 1 }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: "#334155",
            letterSpacing: 1,
            padding: "8px 12px 6px",
            textTransform: "uppercase",
          }}
        >
          Navigation
        </div>
        {nav.map(({ id, icon, label }) => (
          <button
            key={id}
            onClick={() => setPage(id)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "11px 14px",
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              background: page === id ? "#22d3a015" : "transparent",
              color: page === id ? "#22d3a0" : "#64748b",
              fontSize: 14,
              fontWeight: page === id ? 700 : 500,
              marginBottom: 4,
              fontFamily: "inherit",
              borderLeft:
                page === id ? "3px solid #22d3a0" : "3px solid transparent",
              transition: "all .15s",
            }}
            onMouseEnter={(e) => {
              if (page !== id) e.currentTarget.style.background = "#ffffff08";
            }}
            onMouseLeave={(e) => {
              if (page !== id) e.currentTarget.style.background = "transparent";
            }}
          >
            <span style={{ fontSize: 17 }}>{icon}</span>
            {label}
          </button>
        ))}
      </nav>

      {/* User */}
      <div
        style={{
          padding: "16px 20px",
          borderTop: "1px solid #0f1623",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <Avatar initials={user.avatar} size={34} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#e2e8f0",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {user.name}
          </div>
          <div
            style={{
              fontSize: 11,
              color: "#334155",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {user.email}
          </div>
        </div>
        <button
          onClick={onSignOut}
          title="Sign out"
          style={{
            background: "none",
            border: "none",
            color: "#334155",
            cursor: "pointer",
            fontSize: 16,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#f43f5e")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#334155")}
        >
          ⏏
        </button>
      </div>
    </div>
  );
}

// ── APP ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("home");
  const [expenses, setExpenses] = useState(SEED);
  const [modal, setModal] = useState(false);

  function addExpense(exp) {
    setExpenses((prev) => [exp, ...prev]);
  }
  function deleteExpense(id) {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }

  if (!user) return <AuthPage onAuth={setUser} />;

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#07090f",
        fontFamily: "'DM Sans',sans-serif",
        color: "#f1f5f9",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Syne:wght@700;800&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { width:6px; }
        ::-webkit-scrollbar-track { background:#07090f; }
        ::-webkit-scrollbar-thumb { background:#1e2d47; border-radius:3px; }
      `}</style>

      <Sidebar
        page={page}
        setPage={setPage}
        user={user}
        onSignOut={() => setUser(null)}
        onAdd={() => setModal(true)}
      />

      <main style={{ flex: 1, overflowY: "auto", minHeight: "100vh" }}>
        {page === "home" && (
          <HomePage expenses={expenses} onAdd={() => setModal(true)} />
        )}
        {page === "expenses" && (
          <ExpensesPage expenses={expenses} onDelete={deleteExpense} />
        )}
        {page === "visualise" && <VisualisePage expenses={expenses} />}
      </main>

      {modal && (
        <AddExpenseModal onClose={() => setModal(false)} onAdd={addExpense} />
      )}
    </div>
  );
}
