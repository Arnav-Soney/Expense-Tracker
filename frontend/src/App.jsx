import { useState, useEffect, useRef } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

// ── API Configuration ────────────────────────────────────────────────────────
const API_BASE = "/api";

async function apiCall(endpoint, options = {}) {
  const token = localStorage.getItem("expense_tracker_token");

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

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

function getGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return "Good morning 👋";
  } else if (hour >= 12 && hour < 17) {
    return "Good afternoon 👋";
  } else if (hour >= 17 && hour < 21) {
    return "Good evening 👋";
  } else {
    return "Good night 🌙";
  }
}

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

// ── THEMES ────────────────────────────────────────────────────────────────────
const THEMES = {
  dark: {
    mode: "dark",
    bg: "#0a0f1e",
    sidebarBg: "#07090f",
    cardBg: "#0d1117",
    cardBgHover: "#161b22",
    text: "#f1f5f9",
    textSecondary: "#64748b",
    textTertiary: "#334155",
    border: "#1e2d47",
    borderLight: "#0f1623",
    inputBg: "#0a0f1e",
    accent: "#22d3a0",
  },
  light: {
    mode: "light",
    bg: "#f8fafc",
    sidebarBg: "#ffffff",
    cardBg: "#ffffff",
    cardBgHover: "#f1f5f9",
    text: "#0f172a",
    textSecondary: "#64748b",
    textTertiary: "#94a3b8",
    border: "#e2e8f0",
    borderLight: "#f1f5f9",
    inputBg: "#f8fafc",
    accent: "#22d3a0",
  },
};

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
  const [spinning, setSpinning] = useState(false);

  function handleSuccess(credentialResponse) {
    setSpinning(true);
    const token = credentialResponse.credential;

    // Save to localStorage so API calls can use it immediately
    localStorage.setItem("expense_tracker_token", token);

    // Send to backend to verify and ensure user exists
    apiCall("/auth/google", {
      method: "POST",
      body: JSON.stringify({ token }),
    })
      .then((user) => {
        setSpinning(false);
        onAuth(user);
      })
      .catch((err) => {
        console.error("Auth failed:", err);
        setSpinning(false);
        // Fallback for development if backend isn't ready
        const decoded = jwtDecode(token);
        onAuth({
          id: decoded.sub,
          name: decoded.name,
          email: decoded.email,
          avatar: decoded.name
            ? decoded.name.substring(0, 2).toUpperCase()
            : "U",
        });
      });
  }

  function handleError() {
    console.error("Google Login Failed");
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
        .google-btn { width:100%; padding:13px; background:#fff; border:none; border-radius:12px; display:flex; align-items:center; justify-content:center; gap:10px; font-size:15px; font-weight:600; color:#1e293b; cursor:pointer; transition:transform .15s, box-shadow .15s; }
        .google-btn:hover { transform:translateY(-1px); box-shadow:0 6px 20px rgba(255,255,255,.1); }
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

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: 20,
          }}
        >
          {spinning ? (
            <div
              className="spin"
              style={{
                width: 32,
                height: 32,
                border: "3px solid #ccc",
                borderTopColor: "#22d3a0",
                borderRadius: "50%",
              }}
            />
          ) : (
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={handleError}
              theme="filled_black"
              size="large"
              shape="pill"
              text="continue_with"
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ── ADD EXPENSE MODAL ─────────────────────────────────────────────────────────
function AddExpenseModal({ onClose, onAdd, categories }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today());
  const [note, setNote] = useState("");
  const [txnType, setTxnType] = useState("debit");
  const [loading, setLoading] = useState(false);

  const subcats = category
    ? categories.find((c) => c.name === category)?.subcategories || []
    : [];

  async function submit() {
    if (!title || !category || !subcategory || !amount) return;

    setLoading(true);
    try {
      await apiCall("/expenses/add", {
        method: "POST",
        body: JSON.stringify({
          title,
          category: `${categories.find((c) => c.name === category).emoji} ${category}`,
          subcategory,
          amount: parseFloat(amount),
          date,
          note,
          txnType,
        }),
      });
      onAdd();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to add expense");
    }
    setLoading(false);
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
            label: "Transaction Type",
            el: (
              <div style={{ display: "flex", gap: 8 }}>
                {["debit", "credit"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTxnType(t)}
                    style={{
                      flex: 1,
                      padding: "11px 14px",
                      borderRadius: 10,
                      border: "1.5px solid",
                      borderColor:
                        txnType === t
                          ? t === "debit"
                            ? "#f43f5e"
                            : "#22d3a0"
                          : "#1e2d47",
                      background:
                        txnType === t
                          ? t === "debit"
                            ? "#f43f5e18"
                            : "#22d3a018"
                          : "#1a2236",
                      color:
                        txnType === t
                          ? t === "debit"
                            ? "#f43f5e"
                            : "#22d3a0"
                          : "#64748b",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      transition: "all .2s",
                    }}
                  >
                    <span style={{ fontSize: 16 }}>
                      {t === "debit" ? "🔴" : "🟢"}
                    </span>
                    {t === "debit" ? "Paid (Debit)" : "To Receive (Credit)"}
                  </button>
                ))}
              </div>
            ),
          },
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
                {categories.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.emoji} {c.name}
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
            disabled={loading}
            style={{
              flex: 2,
              padding: 13,
              background: "linear-gradient(135deg,#22d3a0,#14b8a6)",
              border: "none",
              borderRadius: 12,
              color: "#0a0f1e",
              fontSize: 15,
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "Saving..." : "Save Expense"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── EXPENSE ROW ───────────────────────────────────────────────────────────────
function ExpenseRow({ exp, onDelete, categories, theme }) {
  const catInfo = categories.find((c) => exp.category.includes(c.name));
  const idx = categories.indexOf(catInfo);
  const color = CAT_COLORS[idx % CAT_COLORS.length] || "#22d3a0";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        background: theme.cardBg,
        border: `1px solid ${theme.border}`,
        borderRadius: 14,
        padding: "14px 18px",
        transition: "border-color .2s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#22d3a040")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = theme.border)}
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
        {catInfo?.emoji}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: 600,
            color: theme.text,
            fontSize: 14,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {exp.title}
          {exp.txnType === "credit" && (
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: "#22d3a0",
                background: "#22d3a018",
                border: "1px solid #22d3a044",
                padding: "2px 7px",
                borderRadius: 6,
                letterSpacing: 0.5,
                textTransform: "uppercase",
                flexShrink: 0,
              }}
            >
              To Receive
            </span>
          )}
        </div>
        <div style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2 }}>
          {exp.subcategory ? `${exp.subcategory} · ` : ""}{dayLabel(exp.date)}
        </div>
      </div>
      <div
        style={{
          fontFamily: "'Syne',sans-serif",
          fontWeight: 700,
          fontSize: 16,
          color: exp.txnType === "credit" ? "#22d3a0" : theme.text,
          flexShrink: 0,
        }}
      >
        {exp.txnType === "credit" ? "+" : ""}
        {fmt(exp.amount)}
      </div>
      <button
        onClick={() => onDelete(exp.id)}
        style={{
          background: "none",
          border: "none",
          color: theme.textTertiary,
          cursor: "pointer",
          fontSize: 16,
          padding: 4,
          lineHeight: 1,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#f43f5e")}
        onMouseLeave={(e) => (e.currentTarget.style.color = theme.textTertiary)}
      >
        ✕
      </button>
    </div>
  );
}

// ── HOME PAGE ─────────────────────────────────────────────────────────────────
function HomePage({ expenses, onAdd, onDelete, categories, stats, theme }) {
  const recent = expenses.slice(0, 5);

  return (
    <div style={{ padding: "32px 36px", maxWidth: 900, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div
          style={{
            fontFamily: "'Syne',sans-serif",
            fontSize: 28,
            fontWeight: 800,
            color: theme.text,
          }}
        >
          {getGreeting()}
        </div>
        <div style={{ color: theme.textSecondary, marginTop: 4 }}>
          Here's your spending overview
        </div>
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2,1fr)",
          gap: 16,
          marginBottom: 32,
        }}
      >
        {[
          {
            label: "Total Spent",
            value: fmt(stats.total),
            icon: "📊",
            accent: "#f43f5e",
          },
          {
            label: "To Receive",
            value: fmt(stats.totalCredit || 0),
            icon: "💰",
            accent: "#22d3a0",
          },
          {
            label: "This Month Spent",
            value: fmt(stats.thisMonth),
            icon: "📅",
            accent: "#6366f1",
          },
          {
            label: "Top Category",
            value: stats.topCategory
              ? stats.topCategory.split(" ").slice(1).join(" ")
              : "—",
            icon: "🏆",
            accent: "#f59e0b",
          },
        ].map(({ label, value, icon, accent }) => (
          <div
            key={label}
            style={{
              background: theme.cardBg,
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
                color: theme.textSecondary,
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
            color: theme.text,
            marginBottom: 14,
          }}
        >
          Recent Transactions
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {recent.length === 0 ? (
            <div
              style={{
                color: theme.textSecondary,
                fontSize: 14,
                textAlign: "center",
                padding: "30px 0",
              }}
            >
              No expenses yet. Add one above!
            </div>
          ) : (
            recent.map((e) => (
              <ExpenseRow
                key={e.id}
                exp={e}
                onDelete={onDelete}
                categories={categories}
                theme={theme}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── EXPENSES PAGE ─────────────────────────────────────────────────────────────
function ExpensesPage({ expenses, onDelete, categories, theme }) {
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("All");

  const filtered = expenses
    .filter((e) => filterCat === "All" || e.category === filterCat)
    .filter(
      (e) =>
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        e.subcategory.toLowerCase().includes(search.toLowerCase()),
    );

  const cats = ["All", ...Array.from(new Set(expenses.map((e) => e.category)))];

  return (
    <div style={{ padding: "32px 36px", maxWidth: 900, margin: "0 auto" }}>
      <div
        style={{
          fontFamily: "'Syne',sans-serif",
          fontSize: 28,
          fontWeight: 800,
          color: theme.text,
          marginBottom: 8,
        }}
      >
        All Expenses
      </div>
      <div style={{ color: theme.textSecondary, marginBottom: 28 }}>
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
            background: theme.cardBg,
            border: `1.5px solid ${theme.border}`,
            borderRadius: 12,
            color: theme.text,
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
              borderColor: filterCat === c ? "#22d3a0" : theme.border,
              background: filterCat === c ? "#22d3a022" : "transparent",
              color: filterCat === c ? "#22d3a0" : theme.textSecondary,
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
              color: theme.textSecondary,
              fontSize: 14,
              textAlign: "center",
              padding: "40px 0",
            }}
          >
            No matching expenses found.
          </div>
        ) : (
          filtered.map((e) => (
            <ExpenseRow
              key={e.id}
              exp={e}
              onDelete={onDelete}
              categories={categories}
              theme={theme}
            />
          ))
        )}
      </div>

      <div
        style={{
          marginTop: 24,
          padding: "18px 22px",
          background: theme.cardBg,
          border: `1px solid ${theme.border}`,
          borderRadius: 14,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span style={{ color: theme.textSecondary, fontWeight: 600 }}>
          Total
        </span>
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

// ── MONTH PICKER ──────────────────────────────────────────────────────────────
const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function MonthPicker({ value, onChange, theme }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const [selYear, selMonth] = value.split("-").map(Number);
  const [viewYear, setViewYear] = useState(selYear);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function pick(m) {
    onChange(`${viewYear}-${String(m).padStart(2, "0")}`);
    setOpen(false);
  }

  const displayLabel = `${MONTH_LABELS[selMonth - 1]} ${selYear}`;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => {
          setViewYear(selYear);
          setOpen(!open);
        }}
        style={{
          width: "100%",
          padding: "10px 12px",
          background: theme.inputBg,
          border: `1px solid ${theme.border}`,
          borderRadius: 10,
          color: theme.text,
          fontSize: 13,
          fontFamily: "inherit",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          transition: "border-color .2s",
          outline: "none",
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = theme.accent)}
        onBlur={(e) => {
          if (!open) e.currentTarget.style.borderColor = theme.border;
        }}
      >
        <span>{displayLabel}</span>
        <span style={{ fontSize: 15, color: theme.textSecondary, lineHeight: 1 }}>
          📅
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            width: 260,
            background: theme.cardBg,
            border: `1px solid ${theme.border}`,
            borderRadius: 14,
            boxShadow: theme.mode === 'dark' ? "0 16px 48px rgba(0,0,0,.55)" : "0 16px 48px rgba(0,0,0,.15)",
            zIndex: 999,
            padding: "16px",
            animation: "mpFadeIn .15s ease",
          }}
        >
          <style>{`@keyframes mpFadeIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}`}</style>

          {/* Year nav */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 14,
            }}
          >
            <button
              type="button"
              onClick={() => setViewYear((y) => y - 1)}
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                border: "none",
                background: theme.inputBg,
                color: theme.textSecondary,
                fontSize: 14,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background .15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = `${theme.accent}22`)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = theme.inputBg)
              }
            >
              ‹
            </button>
            <span
              style={{
                fontFamily: "'Syne',sans-serif",
                fontWeight: 700,
                fontSize: 15,
                color: theme.text,
                letterSpacing: 0.5,
              }}
            >
              {viewYear}
            </span>
            <button
              type="button"
              onClick={() => setViewYear((y) => y + 1)}
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                border: "none",
                background: theme.inputBg,
                color: theme.textSecondary,
                fontSize: 14,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background .15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = `${theme.accent}22`)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = theme.inputBg)
              }
            >
              ›
            </button>
          </div>

          {/* Month grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 6,
            }}
          >
            {MONTH_LABELS.map((label, i) => {
              const monthNum = i + 1;
              const isSelected = viewYear === selYear && monthNum === selMonth;
              const isCurrent =
                viewYear === new Date().getFullYear() &&
                monthNum === new Date().getMonth() + 1;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => pick(monthNum)}
                  style={{
                    padding: "9px 0",
                    borderRadius: 9,
                    border: isSelected
                      ? `1.5px solid ${theme.accent}`
                      : isCurrent
                        ? `1px solid ${theme.accent}44`
                        : "1px solid transparent",
                    background: isSelected
                      ? `linear-gradient(135deg,${theme.accent}22,${theme.accent}22)`
                      : "transparent",
                    color: isSelected ? theme.accent : theme.textSecondary,
                    fontSize: 12,
                    fontWeight: isSelected ? 700 : 500,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "all .15s",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = theme.cardBgHover;
                      e.currentTarget.style.color = theme.text;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = theme.textSecondary;
                    }
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Quick actions */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 12,
              paddingTop: 10,
              borderTop: `1px solid ${theme.border}`,
            }}
          >
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                setViewYear(now.getFullYear());
                pick(now.getMonth() + 1);
              }}
              style={{
                background: "none",
                border: "none",
                color: theme.accent,
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                padding: "4px 8px",
                borderRadius: 6,
                transition: "background .15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = `${theme.accent}15`)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              This month
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── INCOME PAGE ─────────────────────────────────────────────────────────────
function IncomePage({ incomes, onAdd, onDelete, theme }) {
  const [form, setForm] = useState({
    month: new Date().toISOString().slice(0, 7),
    source: "",
    amount: "",
  });
  const [error, setError] = useState("");

  const thisMonth = new Date().toISOString().slice(0, 7);
  const thisMonthTotal = incomes
    .filter((i) => i.month === thisMonth)
    .reduce((s, i) => s + i.amount, 0);
  const allTimeTotal = incomes.reduce((s, i) => s + i.amount, 0);

  function handleSubmit(e) {
    e.preventDefault();
    if (
      !form.amount ||
      isNaN(Number(form.amount)) ||
      Number(form.amount) <= 0
    ) {
      setError("Enter a valid positive amount");
      return;
    }
    onAdd({
      id: Date.now(),
      month: form.month,
      source: form.source.trim() || "Income",
      amount: Number(form.amount),
    });
    setForm({
      month: new Date().toISOString().slice(0, 7),
      source: "",
      amount: "",
    });
    setError("");
  }

  const byMonth = {};
  incomes.forEach((i) => {
    if (!byMonth[i.month]) byMonth[i.month] = [];
    byMonth[i.month].push(i);
  });
  const sortedMonths = Object.keys(byMonth).sort().reverse();

  return (
    <div style={{ padding: "32px 36px", maxWidth: 800, margin: "0 auto" }}>
      <div
        style={{
          fontFamily: "'Syne',sans-serif",
          fontSize: 28,
          fontWeight: 800,
          color: theme.text,
          marginBottom: 8,
        }}
      >
        Income
      </div>
      <div style={{ color: theme.textSecondary, marginBottom: 32 }}>
        Track your monthly revenue &amp; earnings
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          marginBottom: 28,
        }}
      >
        <div
          style={{
            background: theme.cardBg,
            border: `1px solid ${theme.border}`,
            borderRadius: 16,
            padding: "20px 24px",
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: theme.textSecondary,
              fontWeight: 700,
              letterSpacing: 0.8,
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            This Month
          </div>
          <div
            style={{
              fontFamily: "'Syne',sans-serif",
              fontSize: 26,
              fontWeight: 800,
              color: "#22d3a0",
            }}
          >
            {fmt(thisMonthTotal)}
          </div>
        </div>
        <div
          style={{
            background: theme.cardBg,
            border: `1px solid ${theme.border}`,
            borderRadius: 16,
            padding: "20px 24px",
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: theme.textSecondary,
              fontWeight: 700,
              letterSpacing: 0.8,
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Total Logged
          </div>
          <div
            style={{
              fontFamily: "'Syne',sans-serif",
              fontSize: 26,
              fontWeight: 800,
              color: "#6366f1",
            }}
          >
            {fmt(allTimeTotal)}
          </div>
        </div>
      </div>

      {/* Add form */}
      <div
        style={{
          background: theme.cardBg,
          border: `1px solid ${theme.border}`,
          borderRadius: 18,
          padding: "24px 28px",
          marginBottom: 28,
        }}
      >
        <div
          style={{
            fontFamily: "'Syne',sans-serif",
            fontSize: 16,
            fontWeight: 700,
            color: theme.text,
            marginBottom: 16,
          }}
        >
          + Add Income Entry
        </div>
        <form
          onSubmit={handleSubmit}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr auto",
            gap: 12,
            alignItems: "end",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                color: theme.textSecondary,
                fontWeight: 600,
                marginBottom: 6,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Month
            </div>
            <MonthPicker
              value={form.month}
              onChange={(v) => setForm((f) => ({ ...f, month: v }))}
              theme={theme}
            />
          </div>
          <div>
            <div
              style={{
                fontSize: 11,
                color: theme.textSecondary,
                fontWeight: 600,
                marginBottom: 6,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Source
            </div>
            <input
              type="text"
              placeholder="Salary, Freelance…"
              value={form.source}
              onChange={(e) =>
                setForm((f) => ({ ...f, source: e.target.value }))
              }
              style={{
                width: "100%",
                padding: "10px 12px",
                background: theme.inputBg,
                border: `1px solid ${theme.border}`,
                borderRadius: 10,
                color: theme.text,
                fontSize: 13,
                fontFamily: "inherit",
                outline: "none",
              }}
            />
          </div>
          <div>
            <div
              style={{
                fontSize: 11,
                color: theme.textSecondary,
                fontWeight: 600,
                marginBottom: 6,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Amount (₹)
            </div>
            <input
              type="number"
              placeholder="0"
              value={form.amount}
              min="0"
              onChange={(e) =>
                setForm((f) => ({ ...f, amount: e.target.value }))
              }
              style={{
                width: "100%",
                padding: "10px 12px",
                background: theme.inputBg,
                border: `1px solid ${theme.border}`,
                borderRadius: 10,
                color: theme.text,
                fontSize: 13,
                fontFamily: "inherit",
                outline: "none",
              }}
            />
          </div>
          <button
            type="submit"
            style={{
              padding: "10px 20px",
              background: "linear-gradient(135deg,#22d3a0,#14b8a6)",
              border: "none",
              borderRadius: 10,
              color: "#0a0f1e",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              fontFamily: "inherit",
              height: 40,
              whiteSpace: "nowrap",
            }}
          >
            Add
          </button>
        </form>
        {error && (
          <div style={{ color: "#f43f5e", fontSize: 12, marginTop: 8 }}>
            {error}
          </div>
        )}
      </div>

      {/* Income list */}
      {sortedMonths.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            color: theme.textTertiary,
            padding: "48px 0",
            fontSize: 14,
          }}
        >
          No income logged yet. Add your first entry above.
        </div>
      ) : (
        sortedMonths.map((month) => {
          const monthTotal = byMonth[month].reduce((s, i) => s + i.amount, 0);
          const label = new Date(month + "-01").toLocaleDateString("en-IN", {
            month: "long",
            year: "numeric",
          });
          return (
            <div key={month} style={{ marginBottom: 20 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 10,
                  padding: "0 4px",
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: theme.textSecondary,
                    textTransform: "uppercase",
                    letterSpacing: 0.8,
                  }}
                >
                  {label}
                </div>
                <div
                  style={{
                    fontFamily: "'Syne',sans-serif",
                    fontWeight: 800,
                    color: "#22d3a0",
                    fontSize: 15,
                  }}
                >
                  {fmt(monthTotal)}
                </div>
              </div>
              {byMonth[month].map((entry) => (
                <div
                  key={entry.id}
                  style={{
                    background: theme.cardBg,
                    border: `1px solid ${theme.border}`,
                    borderRadius: 12,
                    padding: "14px 18px",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 8,
                    transition: "border-color .2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.borderColor = "#22d3a040")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.borderColor = theme.border)
                  }
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: "#22d3a015",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 18,
                      flexShrink: 0,
                    }}
                  >
                    💰
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        color: theme.text,
                        fontSize: 14,
                      }}
                    >
                      {entry.source}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: theme.textSecondary,
                        marginTop: 2,
                      }}
                    >
                      {label}
                    </div>
                  </div>
                  <div
                    style={{
                      fontFamily: "'Syne',sans-serif",
                      fontWeight: 800,
                      color: "#22d3a0",
                      fontSize: 15,
                      flexShrink: 0,
                    }}
                  >
                    {fmt(entry.amount)}
                  </div>
                  <button
                    onClick={() => onDelete(entry.id)}
                    style={{
                      background: "none",
                      border: "none",
                      color: theme.textTertiary,
                      cursor: "pointer",
                      fontSize: 16,
                      padding: 4,
                      lineHeight: 1,
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "#f43f5e")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = theme.textTertiary)
                    }
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          );
        })
      )}
    </div>
  );
}

// ── RECEIVABLES PAGE ──────────────────────────────────────────────────────────
function ReceivablesPage({ receivables, onAdd, onUpdate, onDelete, theme }) {
  const [form, setForm] = useState({
    person: "",
    amount: "",
    description: "",
    date: today(),
  });
  const [error, setError] = useState("");

  const totalToReceive = receivables
    .filter((r) => !r.received)
    .reduce((sum, r) => sum + (r.amount - r.amountReceived), 0);

  const totalReceived = receivables.reduce(
    (sum, r) => sum + r.amountReceived,
    0
  );

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.person.trim()) {
      setError("Enter person/source name");
      return;
    }
    if (
      !form.amount ||
      isNaN(Number(form.amount)) ||
      Number(form.amount) <= 0
    ) {
      setError("Enter a valid positive amount");
      return;
    }
    onAdd({
      id: Date.now().toString(),
      person: form.person.trim(),
      amount: Number(form.amount),
      amountReceived: 0,
      description: form.description.trim(),
      date: form.date,
      received: false,
    });
    setForm({ person: "", amount: "", description: "", date: today() });
    setError("");
  }

  function handlePayment(receivable, paymentAmount) {
    const newAmountReceived = receivable.amountReceived + paymentAmount;
    const isFullyPaid = newAmountReceived >= receivable.amount;
    onUpdate({
      ...receivable,
      amountReceived: Math.min(newAmountReceived, receivable.amount),
      received: isFullyPaid,
    });
  }

  return (
    <div style={{ padding: "32px 36px", maxWidth: 900, margin: "0 auto" }}>
      <div
        style={{
          fontFamily: "'Syne',sans-serif",
          fontSize: 28,
          fontWeight: 800,
          color: theme.text,
          marginBottom: 8,
        }}
      >
        💵 Receive Money
      </div>
      <div style={{ color: theme.textSecondary, marginBottom: 28 }}>
        Track money you're expecting to receive
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2,1fr)",
          gap: 16,
          marginBottom: 28,
        }}
      >
        <div
          style={{
            background: theme.cardBg,
            border: `1px solid ${theme.border}`,
            borderRadius: 16,
            padding: "20px 24px",
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: theme.textSecondary,
              textTransform: "uppercase",
              letterSpacing: 0.8,
              marginBottom: 8,
            }}
          >
            To Receive
          </div>
          <div
            style={{
              fontFamily: "'Syne',sans-serif",
              fontWeight: 800,
              fontSize: 28,
              color: "#f59e0b",
            }}
          >
            {fmt(totalToReceive)}
          </div>
        </div>
        <div
          style={{
            background: theme.cardBg,
            border: `1px solid ${theme.border}`,
            borderRadius: 16,
            padding: "20px 24px",
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: theme.textSecondary,
              textTransform: "uppercase",
              letterSpacing: 0.8,
              marginBottom: 8,
            }}
          >
            Already Received
          </div>
          <div
            style={{
              fontFamily: "'Syne',sans-serif",
              fontWeight: 800,
              fontSize: 28,
              color: theme.accent,
            }}
          >
            {fmt(totalReceived)}
          </div>
        </div>
      </div>

      {/* Add Form */}
      <div
        style={{
          background: theme.cardBg,
          border: `1px solid ${theme.border}`,
          borderRadius: 16,
          padding: "24px 28px",
          marginBottom: 28,
        }}
      >
        <div
          style={{
            fontFamily: "'Syne',sans-serif",
            fontSize: 16,
            fontWeight: 700,
            color: theme.text,
            marginBottom: 16,
          }}
        >
          + Add Receivable Entry
        </div>
        <form
          onSubmit={handleSubmit}
          style={{
            display: "grid",
            gridTemplateColumns: "1.5fr 1fr 2fr 1fr auto",
            gap: 12,
            alignItems: "end",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                color: theme.textSecondary,
                fontWeight: 600,
                marginBottom: 6,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Person / Source
            </div>
            <input
              type="text"
              placeholder="John Doe"
              value={form.person}
              onChange={(e) => setForm((f) => ({ ...f, person: e.target.value }))}
              style={{
                width: "100%",
                padding: "10px 12px",
                background: theme.inputBg,
                border: `1px solid ${theme.border}`,
                borderRadius: 10,
                color: theme.text,
                fontSize: 13,
                fontFamily: "inherit",
                outline: "none",
              }}
            />
          </div>
          <div>
            <div
              style={{
                fontSize: 11,
                color: theme.textSecondary,
                fontWeight: 600,
                marginBottom: 6,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Amount (₹)
            </div>
            <input
              type="number"
              placeholder="0"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              style={{
                width: "100%",
                padding: "10px 12px",
                background: theme.inputBg,
                border: `1px solid ${theme.border}`,
                borderRadius: 10,
                color: theme.text,
                fontSize: 13,
                fontFamily: "inherit",
                outline: "none",
              }}
            />
          </div>
          <div>
            <div
              style={{
                fontSize: 11,
                color: theme.textSecondary,
                fontWeight: 600,
                marginBottom: 6,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Description
            </div>
            <input
              type="text"
              placeholder="Payment for services..."
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              style={{
                width: "100%",
                padding: "10px 12px",
                background: theme.inputBg,
                border: `1px solid ${theme.border}`,
                borderRadius: 10,
                color: theme.text,
                fontSize: 13,
                fontFamily: "inherit",
                outline: "none",
              }}
            />
          </div>
          <div>
            <div
              style={{
                fontSize: 11,
                color: theme.textSecondary,
                fontWeight: 600,
                marginBottom: 6,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Date
            </div>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              style={{
                width: "100%",
                padding: "10px 12px",
                background: theme.inputBg,
                border: `1px solid ${theme.border}`,
                borderRadius: 10,
                color: theme.text,
                fontSize: 13,
                fontFamily: "inherit",
                outline: "none",
              }}
            />
          </div>
          <button
            type="submit"
            style={{
              padding: "10px 24px",
              background: "linear-gradient(135deg,#22d3a0,#14b8a6)",
              border: "none",
              borderRadius: 10,
              color: "#0a0f1e",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Add
          </button>
        </form>
        {error && (
          <div style={{ color: "#f43f5e", fontSize: 12, marginTop: 10 }}>
            {error}
          </div>
        )}
      </div>

      {/* Receivables List */}
      <div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: theme.textSecondary,
            textTransform: "uppercase",
            letterSpacing: 0.8,
            marginBottom: 14,
          }}
        >
          Pending Receivables ({receivables.filter((r) => !r.received).length})
        </div>
        {receivables.filter((r) => !r.received).length === 0 ? (
          <div
            style={{
              color: theme.textSecondary,
              fontSize: 14,
              textAlign: "center",
              padding: "40px 0",
            }}
          >
            No pending receivables
          </div>
        ) : (
          receivables
            .filter((r) => !r.received)
            .map((r) => (
              <ReceivableRow
                key={r.id}
                receivable={r}
                onPayment={handlePayment}
                onDelete={onDelete}
                theme={theme}
              />
            ))
        )}

        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: theme.textSecondary,
            textTransform: "uppercase",
            letterSpacing: 0.8,
            marginTop: 32,
            marginBottom: 14,
          }}
        >
          Completed ({receivables.filter((r) => r.received).length})
        </div>
        {receivables
          .filter((r) => r.received)
          .map((r) => (
            <ReceivableRow
              key={r.id}
              receivable={r}
              onPayment={handlePayment}
              onDelete={onDelete}
              theme={theme}
            />
          ))}
      </div>
    </div>
  );
}

function ReceivableRow({ receivable, onPayment, onDelete, theme }) {
  const [showPayment, setShowPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  
  const remaining = receivable.amount - receivable.amountReceived;
  const progress = (receivable.amountReceived / receivable.amount) * 100;

  function handlePayment() {
    const amount = Number(paymentAmount);
    if (amount > 0 && amount <= remaining) {
      onPayment(receivable, amount);
      setPaymentAmount("");
      setShowPayment(false);
    }
  }

  return (
    <div
      style={{
        background: theme.cardBg,
        border: `1px solid ${theme.border}`,
        borderRadius: 14,
        padding: "18px 22px",
        marginBottom: 12,
        opacity: receivable.received ? 0.6 : 1,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        <input
          type="checkbox"
          checked={receivable.received}
          onChange={() => {
            if (!receivable.received && remaining > 0) {
              onPayment(receivable, remaining);
            }
          }}
          style={{
            width: 20,
            height: 20,
            cursor: "pointer",
            marginTop: 2,
            accentColor: theme.accent,
          }}
        />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <div>
              <div
                style={{
                  fontWeight: 700,
                  color: theme.text,
                  fontSize: 15,
                  marginBottom: 4,
                }}
              >
                {receivable.person}
              </div>
              <div style={{ fontSize: 12, color: theme.textSecondary }}>
                {receivable.description} · {dayLabel(receivable.date)}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontFamily: "'Syne',sans-serif",
                  fontWeight: 800,
                  fontSize: 18,
                  color: receivable.received ? theme.accent : "#f59e0b",
                }}
              >
                {fmt(remaining)}
              </div>
              <div style={{ fontSize: 11, color: theme.textSecondary, marginTop: 2 }}>
                of {fmt(receivable.amount)}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          {receivable.amountReceived > 0 && (
            <div
              style={{
                height: 6,
                background: theme.inputBg,
                borderRadius: 3,
                overflow: "hidden",
                marginTop: 10,
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${progress}%`,
                  background: `linear-gradient(90deg, ${theme.accent}, #14b8a6)`,
                  transition: "width 0.3s",
                }}
              />
            </div>
          )}

          {/* Payment Actions */}
          {!receivable.received && (
            <div style={{ marginTop: 10 }}>
              {!showPayment ? (
                <button
                  onClick={() => setShowPayment(true)}
                  style={{
                    padding: "6px 14px",
                    background: "none",
                    border: `1px solid ${theme.accent}`,
                    borderRadius: 8,
                    color: theme.accent,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Record Payment
                </button>
              ) : (
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    type="number"
                    placeholder={`Max: ${remaining}`}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    style={{
                      width: 150,
                      padding: "6px 10px",
                      background: theme.inputBg,
                      border: `1px solid ${theme.border}`,
                      borderRadius: 8,
                      color: theme.text,
                      fontSize: 12,
                      fontFamily: "inherit",
                      outline: "none",
                    }}
                  />
                  <button
                    onClick={handlePayment}
                    style={{
                      padding: "6px 14px",
                      background: theme.accent,
                      border: "none",
                      borderRadius: 8,
                      color: "#0a0f1e",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setShowPayment(false);
                      setPaymentAmount("");
                    }}
                    style={{
                      padding: "6px 14px",
                      background: "none",
                      border: `1px solid ${theme.border}`,
                      borderRadius: 8,
                      color: theme.textSecondary,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        <button
          onClick={() => onDelete(receivable.id)}
          style={{
            background: "none",
            border: "none",
            color: theme.textTertiary,
            cursor: "pointer",
            fontSize: 16,
            padding: 4,
            lineHeight: 1,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#f43f5e")}
          onMouseLeave={(e) => (e.currentTarget.style.color = theme.textTertiary)}
        >
          ✕
        </button>
      </div>
    </div>
  );
}



// ── VISUALISE PAGE ────────────────────────────────────────────────────────────
function VisualisePage({ expenses, categories, incomes, theme }) {
  const [dayView, setDayView] = useState("week");
  const [selectedMonth, setSelectedMonth] = useState("all");

  // Get list of unique months from expenses
  const availableMonths = ["all", ...new Set(expenses.map(e => e.date.slice(0, 7)))].sort().reverse();

  // Filter expenses by selected month
  const filteredExpenses = selectedMonth === "all"
    ? expenses
    : expenses.filter(e => e.date.startsWith(selectedMonth));

  // Category totals with subcategory breakdown
  const catTotals = {};
  const catSubcatTotals = {};
  filteredExpenses.forEach((e) => {
    catTotals[e.category] = (catTotals[e.category] || 0) + e.amount;
    if (!catSubcatTotals[e.category]) {
      catSubcatTotals[e.category] = {};
    }
    // Handle empty/undefined subcategory - label as "Uncategorized"
    const subcatKey = e.subcategory && e.subcategory.trim() ? e.subcategory : "Uncategorized";
    catSubcatTotals[e.category][subcatKey] =
      (catSubcatTotals[e.category][subcatKey] || 0) + e.amount;
  });
  const total = Object.values(catTotals).reduce((s, v) => s + v, 0);

  const piePercent = Object.entries(catTotals).map(([name, value], i) => ({
    name: name.split(" ").slice(1).join(" "),
    fullName: name,
    value: Math.round((value / total) * 100),
    absoluteValue: value,
    color: CAT_COLORS[i % CAT_COLORS.length],
    subcategories: catSubcatTotals[name],
  }));

  const pieAbs = Object.entries(catTotals).map(([name, value], i) => ({
    name: name.split(" ").slice(1).join(" "),
    fullName: name,
    value,
    color: CAT_COLORS[i % CAT_COLORS.length],
    subcategories: catSubcatTotals[name],
  }));

  // Day-wise bar
  const dayMap = {};
  filteredExpenses.forEach((e) => {
    dayMap[e.date] = (dayMap[e.date] || 0) + e.amount;
  });
  const allDates = Object.keys(dayMap).sort();
  const weekDates = allDates.slice(-7);
  const dayData = (dayView === "week" ? weekDates : allDates).map((d) => ({
    name: new Date(d).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    }),
    value: dayMap[d],
  }));

  // Month-wise bar
  const monthMap = {};
  filteredExpenses.forEach((e) => {
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

  // Income vs Expense monthly comparison
  const incomeMonthMap = {};
  (incomes || []).forEach((inc) => {
    incomeMonthMap[inc.month] = (incomeMonthMap[inc.month] || 0) + inc.amount;
  });
  const incVsExpMonths = [
    ...new Set([...Object.keys(monthMap), ...Object.keys(incomeMonthMap)]),
  ].sort();
  const incVsExpData = incVsExpMonths.map((m) => ({
    name: new Date(m + "-01").toLocaleDateString("en-IN", {
      month: "short",
      year: "2-digit",
    }),
    Income: incomeMonthMap[m] || 0,
    Expenses: monthMap[m] || 0,
  }));

  const INCOME_EXP_TOOLTIP = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div
        style={{
          background: theme.cardBg,
          border: `1px solid ${theme.border}`,
          borderRadius: 10,
          padding: "10px 14px",
          fontFamily: "'DM Sans',sans-serif",
          fontSize: 13,
          color: theme.text,
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 6 }}>{label}</div>
        {payload.map((p) => (
          <div key={p.name} style={{ color: p.fill, fontWeight: 600 }}>
            {p.name}: {fmt(p.value)}
          </div>
        ))}
      </div>
    );
  };

  const CUSTOM_TOOLTIP = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const data = payload[0].payload;
    
    // Get the full category name to look up subcategories
    // Try multiple approaches to find the right key
    let subcats = {};
    
    // First try with fullName if it exists
    if (data.fullName && catSubcatTotals[data.fullName]) {
      subcats = catSubcatTotals[data.fullName];
    } else {
      // Try to find by matching the display name
      const displayName = data.name || payload[0].name;
      // Look for a category that contains this display name
      for (const [catKey, subObj] of Object.entries(catSubcatTotals)) {
        if (catKey.includes(displayName)) {
          subcats = subObj;
          break;
        }
      }
    }
    
    // Filter out any invalid subcategory keys and sort by amount
    const subcatEntries = Object.entries(subcats)
      .filter(([key]) => key && key !== "undefined" && key !== "null")
      .sort((a, b) => b[1] - a[1]);
    
    // Calculate total for percentages
    const subcatTotal = subcatEntries.reduce((sum, [, val]) => sum + val, 0);
    
    return (
      <div
        style={{
          background: theme.cardBg,
          border: `1px solid ${theme.border}`,
          borderRadius: 12,
          padding: "12px 16px",
          fontFamily: "'DM Sans',sans-serif",
          fontSize: 13,
          color: theme.text,
          maxWidth: 280,
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 14 }}>
          {payload[0].name}
        </div>
        <div style={{ color: theme.accent, fontWeight: 700, fontSize: 16, marginBottom: 8 }}>
          {typeof payload[0].value === "number" && payload[0].value > 100
            ? fmt(payload[0].value)
            : `${payload[0].value}${typeof payload[0].value === "number" && payload[0].value < 100 ? "%" : ""}`}
        </div>
        
        {subcatEntries.length > 0 && (
          <>
            <div
              style={{
                borderTop: `1px solid ${theme.border}`,
                marginTop: 8,
                paddingTop: 8,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: theme.textSecondary,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  marginBottom: 6,
                }}
              >
                Breakdown
              </div>
              {subcatEntries.map(([subcat, amount]) => (
                <div
                  key={subcat}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "4px 0",
                    fontSize: 12,
                  }}
                >
                  <span style={{ color: theme.textSecondary }}>{subcat}</span>
                  <span style={{ fontWeight: 600, color: theme.text, marginLeft: 12 }}>
                    {fmt(amount)} <span style={{ color: theme.accent, fontSize: 11 }}>({Math.round((amount / subcatTotal) * 100)}%)</span>
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div style={{ padding: "32px 36px", maxWidth: 900, margin: "0 auto" }}>
      <div
        style={{
          fontFamily: "'Syne',sans-serif",
          fontSize: 28,
          fontWeight: 800,
          color: theme.text,
          marginBottom: 8,
        }}
      >
        Visualise
      </div>
      <div style={{ color: theme.textSecondary, marginBottom: 20 }}>
        Charts & spending patterns
      </div>

      {/* Month Selector */}
      <div style={{ marginBottom: 32 }}>
        <label
          style={{
            display: "block",
            fontSize: 12,
            fontWeight: 600,
            color: theme.textSecondary,
            textTransform: "uppercase",
            letterSpacing: 0.5,
            marginBottom: 8,
          }}
        >
          Filter by Month
        </label>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          style={{
            padding: "10px 14px",
            background: theme.cardBg,
            border: `1px solid ${theme.border}`,
            borderRadius: 10,
            color: theme.text,
            fontSize: 14,
            fontWeight: 500,
            fontFamily: "inherit",
            cursor: "pointer",
            outline: "none",
            minWidth: 200,
          }}
        >
          <option value="all">All Time</option>
          {availableMonths.filter(m => m !== "all").map((month) => (
            <option key={month} value={month}>
              {new Date(month + "-01").toLocaleDateString("en-IN", {
                month: "long",
                year: "numeric",
              })}
            </option>
          ))}
        </select>
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
            background: theme.cardBg,
            border: `1px solid ${theme.border}`,
            borderRadius: 18,
            padding: "24px",
          }}
        >
          <div
            style={{
              fontFamily: "'Syne',sans-serif",
              fontSize: 16,
              fontWeight: 700,
              color: theme.text,
              marginBottom: 4,
            }}
          >
            Category Split
          </div>
          <div style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 16 }}>
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
              >
                {piePercent.map((e, i) => (
                  <Cell key={i} fill={e.color} />
                ))}
              </Pie>
              <Tooltip content={<CUSTOM_TOOLTIP />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div
          style={{
            background: theme.cardBg,
            border: `1px solid ${theme.border}`,
            borderRadius: 18,
            padding: "24px",
          }}
        >
          <div
            style={{
              fontFamily: "'Syne',sans-serif",
              fontSize: 16,
              fontWeight: 700,
              color: theme.text,
              marginBottom: 4,
            }}
          >
            Amounts by Category
          </div>
          <div style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 16 }}>
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
        </div>
      </div>

      {/* Day-wise bar */}
      <div
        style={{
          background: theme.cardBg,
          border: `1px solid ${theme.border}`,
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
                color: theme.text,
              }}
            >
              Daily Spend
            </div>
            <div style={{ fontSize: 13, color: theme.textSecondary, marginTop: 2 }}>
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
                  borderColor: dayView === v ? "#22d3a0" : theme.border,
                  background: dayView === v ? "#22d3a022" : "transparent",
                  color: dayView === v ? "#22d3a0" : theme.textSecondary,
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
              stroke={theme.border}
              vertical={false}
            />
            <XAxis
              dataKey="name"
              tick={{ fill: theme.textSecondary, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: theme.textSecondary, fontSize: 11 }}
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
          background: theme.cardBg,
          border: `1px solid ${theme.border}`,
          borderRadius: 18,
          padding: "24px 28px",
        }}
      >
        <div
          style={{
            fontFamily: "'Syne',sans-serif",
            fontSize: 18,
            fontWeight: 700,
            color: theme.text,
            marginBottom: 4,
          }}
        >
          Monthly Overview
        </div>
        <div style={{ fontSize: 13, color: theme.textSecondary, marginBottom: 20 }}>
          Total spend per calendar month
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={monthData} barSize={36}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={theme.border}
              vertical={false}
            />
            <XAxis
              dataKey="name"
              tick={{ fill: theme.textSecondary, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: theme.textSecondary, fontSize: 11 }}
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

      {/* Income vs Expenses */}
      {(incomes || []).length > 0 && incVsExpData.length > 0 && (
        <div
          style={{
            background: theme.cardBg,
            border: `1px solid ${theme.border}`,
            borderRadius: 18,
            padding: "24px 28px",
            marginTop: 24,
          }}
        >
          <div
            style={{
              fontFamily: "'Syne',sans-serif",
              fontSize: 18,
              fontWeight: 700,
              color: theme.text,
              marginBottom: 4,
            }}
          >
            Income vs Expenses
          </div>
          <div style={{ fontSize: 13, color: theme.textSecondary, marginBottom: 20 }}>
            Monthly income compared to spending
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={incVsExpData} barSize={18} barGap={4}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={theme.border}
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ fill: theme.textSecondary, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: theme.textSecondary, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) =>
                  `₹${v >= 1000 ? (v / 1000).toFixed(0) + "k" : v}`
                }
              />
              <Tooltip
                content={<INCOME_EXP_TOOLTIP />}
                cursor={{ fill: "#ffffff06" }}
              />
              <Legend
                wrapperStyle={{ paddingTop: 12 }}
                formatter={(value) => (
                  <span
                    style={{
                      color: value === "Income" ? "#22d3a0" : "#f43f5e",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    {value}
                  </span>
                )}
              />
              <Bar dataKey="Income" fill="#22d3a0" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// ── SIDEBAR ───────────────────────────────────────────────────────────────────
function Sidebar({
  page,
  setPage,
  user,
  onSignOut,
  onAdd,
  theme,
  onToggleTheme,
}) {
  const nav = [
    { id: "home", icon: "🏠", label: "Homepage" },
    { id: "expenses", icon: "📋", label: "Expenses" },
    { id: "income", icon: "💰", label: "Income" },
    { id: "receivables", icon: "💵", label: "Receive Money" },
    { id: "visualise", icon: "📊", label: "Visualize" },
  ];
  return (
    <div
      style={{
        width: 230,
        background: theme.sidebarBg,
        borderRight: `1px solid ${theme.border}`,
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
        onClick={() => setPage("home")}
        style={{
          padding: "28px 24px 20px",
          borderBottom: `1px solid ${theme.borderLight}`,
          cursor: "pointer",
        }}
      >
        <div
          style={{
            fontFamily: "'Syne',sans-serif",
            fontSize: 22,
            fontWeight: 800,
            color: theme.text,
          }}
        >
          💸 Spendly
        </div>
        <div
          style={{
            fontSize: 11,
            color: theme.textSecondary,
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
            color: theme.textTertiary,
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
              background: page === id ? `${theme.accent}15` : "transparent",
              color: page === id ? theme.accent : theme.textSecondary,
              fontSize: 14,
              fontWeight: page === id ? 700 : 500,
              marginBottom: 4,
              fontFamily: "inherit",
              borderLeft:
                page === id
                  ? `3px solid ${theme.accent}`
                  : "3px solid transparent",
              transition: "all .15s",
            }}
            onMouseEnter={(e) => {
              if (page !== id)
                e.currentTarget.style.background = theme.cardBgHover;
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
          borderTop: `1px solid ${theme.borderLight}`,
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
              color: theme.text,
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
              color: theme.textTertiary,
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
            color: theme.textTertiary,
            cursor: "pointer",
            fontSize: 16,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#f43f5e")}
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = theme.textTertiary)
          }
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
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [modal, setModal] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    thisMonth: 0,
    topCategory: "",
  });
  const [incomes, setIncomes] = useState(() => {
    try {
      const saved = localStorage.getItem("spendly_incomes");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [receivables, setReceivables] = useState(() => {
    try {
      const saved = localStorage.getItem("spendly_receivables");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [themeMode, setThemeMode] = useState(() => {
    try {
      const saved = localStorage.getItem("spendly_theme");
      return saved || "dark";
    } catch {
      return "dark";
    }
  });

  const theme = THEMES[themeMode];

  function toggleTheme() {
    setThemeMode((prev) => {
      const newMode = prev === "dark" ? "light" : "dark";
      localStorage.setItem("spendly_theme", newMode);
      return newMode;
    });
  }

  useEffect(() => {
    // Check for saved token and restore session if valid
    const token = localStorage.getItem("expense_tracker_token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        // Check expiration
        if (decoded.exp * 1000 > Date.now()) {
          setUser({
            id: decoded.sub,
            name: decoded.name,
            email: decoded.email,
            avatar: decoded.name
              ? decoded.name.substring(0, 2).toUpperCase()
              : "U",
          });
        } else {
          localStorage.removeItem("expense_tracker_token");
        }
      } catch (e) {
        localStorage.removeItem("expense_tracker_token");
      }
    }

    // Fetch categories
    apiCall("/categories")
      .then((data) => {
        const formatted = data.map((c) => ({
          name: c.name,
          emoji: c.emoji,
          subcategories: c.subcategories,
        }));
        setCategories(formatted);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (user) refreshExpenses();
  }, [user]);

  useEffect(() => {
    localStorage.setItem("spendly_incomes", JSON.stringify(incomes));
  }, [incomes]);

  useEffect(() => {
    localStorage.setItem("spendly_receivables", JSON.stringify(receivables));
  }, [receivables]);

  function refreshExpenses() {
    if (!user) return;
    apiCall("/expenses").then(setExpenses).catch(console.error);
    apiCall("/stats").then(setStats).catch(console.error);
  }

  function deleteExpense(id) {
    apiCall("/expenses/delete", {
      method: "DELETE",
      body: JSON.stringify({ id }),
    })
      .then(() => refreshExpenses())
      .catch(console.error);
  }

  function addIncome(entry) {
    setIncomes((prev) => [...prev, entry]);
  }

  function deleteIncome(id) {
    setIncomes((prev) => prev.filter((i) => i.id !== id));
  }

  function addReceivable(entry) {
    setReceivables((prev) => [...prev, entry]);
  }

  function updateReceivable(updated) {
    setReceivables((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  }

  function deleteReceivable(id) {
    setReceivables((prev) => prev.filter((r) => r.id !== id));
  }

  function signOut() {
    setUser(null);
    setExpenses([]);
    localStorage.removeItem("expense_tracker_token");
  }

  if (!user) return <AuthPage onAuth={setUser} />;

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: theme.bg,
        fontFamily: "'DM Sans',sans-serif",
        color: theme.text,
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Syne:wght@700;800&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { width:6px; }
        ::-webkit-scrollbar-track { background:${theme.bg}; }
        ::-webkit-scrollbar-thumb { background:${theme.border}; border-radius:3px; }
      `}</style>

      <Sidebar
        page={page}
        setPage={setPage}
        user={user}
        onSignOut={signOut}
        onAdd={() => setModal(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <main
        style={{
          flex: 1,
          overflowY: "auto",
          minHeight: "100vh",
          background: theme.bg,
          position: "relative",
        }}
      >
        {/* Theme toggle — upper right */}
        <button
          onClick={toggleTheme}
          title={
            theme.mode === "dark"
              ? "Switch to light mode"
              : "Switch to dark mode"
          }
          style={{
            position: "fixed",
            top: 18,
            right: 24,
            zIndex: 900,
            background: theme.cardBg,
            border: `1px solid ${theme.border}`,
            borderRadius: 12,
            width: 42,
            height: 42,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            fontSize: 20,
            boxShadow: `0 4px 16px ${theme.mode === "dark" ? "rgba(0,0,0,.4)" : "rgba(0,0,0,.1)"}`,
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = theme.cardBgHover;
            e.currentTarget.style.transform = "scale(1.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = theme.cardBg;
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          {theme.mode === "dark" ? "☀️" : "🌙"}
        </button>
        {page === "home" && (
          <HomePage
            expenses={expenses}
            onAdd={() => setModal(true)}
            onDelete={deleteExpense}
            categories={categories}
            stats={stats}
            theme={theme}
          />
        )}
        {page === "expenses" && (
          <ExpensesPage
            expenses={expenses}
            onDelete={deleteExpense}
            categories={categories}
            theme={theme}
          />
        )}
        {page === "income" && (
          <IncomePage
            incomes={incomes}
            onAdd={addIncome}
            onDelete={deleteIncome}
            theme={theme}
          />
        )}
        {page === "receivables" && (
          <ReceivablesPage
            receivables={receivables}
            onAdd={addReceivable}
            onUpdate={updateReceivable}
            onDelete={deleteReceivable}
            theme={theme}
          />
        )}
        {page === "visualise" && (
          <VisualisePage
            expenses={expenses}
            categories={categories}
            incomes={incomes}
            theme={theme}
          />
        )}
      </main>

      {modal && (
        <AddExpenseModal
          onClose={() => setModal(false)}
          onAdd={refreshExpenses}
          categories={categories}
        />
      )}
    </div>
  );
}
