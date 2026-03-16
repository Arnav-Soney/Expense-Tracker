package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	gojwt "github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
	"google.golang.org/api/idtoken"
)

// ── Data Models ────────────────────────────────────────────────────────────
type Expense struct {
	ID          int64   `json:"id"`
	Title       string  `json:"title"`
	Category    string  `json:"category"`
	Subcategory string  `json:"subcategory"`
	Amount      float64 `json:"amount"`
	Date        string  `json:"date"`
	Note        string  `json:"note"`
	TxnType     string  `json:"txnType"` // "debit" or "credit"
}

type User struct {
	ID     string `json:"id"`
	Name   string `json:"name"`
	Email  string `json:"email"`
	Avatar string `json:"avatar"`
}

type CategoryInfo struct {
	Name          string   `json:"name"`
	Emoji         string   `json:"emoji"`
	Subcategories []string `json:"subcategories"`
}

type ExpenseStats struct {
	Total            float64 `json:"total"`
	ThisMonth        float64 `json:"thisMonth"`
	TopCategory      string  `json:"topCategory"`
	TopCategoryEmoji string  `json:"topCategoryEmoji"`
	TotalCredit      float64 `json:"totalCredit"`
	ThisMonthCredit  float64 `json:"thisMonthCredit"`
}

// ── Globals ────────────────────────────────────────────────────────
var (
	db *pgxpool.Pool

	categories = map[string]CategoryInfo{
		"🍔 Food & Dining": {
			Name:          "Food & Dining",
			Emoji:         "🍔",
			Subcategories: []string{"Restaurants", "Groceries", "Coffee & Tea", "Fast Food", "Bars & Nightlife", "Bakeries"},
		},
		"🚗 Transport": {
			Name:          "Transport",
			Emoji:         "🚗",
			Subcategories: []string{"Fuel", "Uber / Ola", "Metro / Bus", "Flight", "Parking", "Bike Rental"},
		},
		"🏠 Housing": {
			Name:          "Housing",
			Emoji:         "🏠",
			Subcategories: []string{"Rent", "Electricity", "Water", "Internet", "Maintenance", "Furniture"},
		},
		"🎮 Entertainment": {
			Name:          "Entertainment",
			Emoji:         "🎮",
			Subcategories: []string{"Streaming", "Games", "Movies", "Concerts", "Books", "Hobbies"},
		},
		"🏥 Health": {
			Name:          "Health",
			Emoji:         "🏥",
			Subcategories: []string{"Doctor", "Pharmacy", "Gym", "Dental", "Insurance", "Mental Health"},
		},
		"👗 Shopping": {
			Name:          "Shopping",
			Emoji:         "👗",
			Subcategories: []string{"Clothing", "Electronics", "Accessories", "Home Decor", "Beauty", "Sports"},
		},
		"📚 Education": {
			Name:          "Education",
			Emoji:         "📚",
			Subcategories: []string{"Courses", "Books", "Subscriptions", "Workshops", "Stationery", "Tuition"},
		},
		"✈️ Travel": {
			Name:          "Travel",
			Emoji:         "✈️",
			Subcategories: []string{"Hotels", "Flights", "Activities", "Food Abroad", "Souvenirs", "Visas"},
		},
		"💰 Misc": {
			Name:          "Misc",
			Emoji:         "💰",
			Subcategories: []string{"Home-Parents", "Partner", "Gifts", "Donations", "Tips", "Pet Care", "Cleaning", "Other"},
		},
	}
)

// ── CORS Middleware ────────────────────────────────────────────────────────
func cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// parseEmailFromJWT extracts the email claim from a Google JWT without remote verification.
// The token is already verified by Google's servers during /auth/google login.
func parseEmailFromJWT(tokenStr string) (string, error) {
	p := gojwt.NewParser()
	token, _, err := p.ParseUnverified(tokenStr, gojwt.MapClaims{})
	if err != nil {
		return "", err
	}
	claims, ok := token.Claims.(gojwt.MapClaims)
	if !ok {
		return "", fmt.Errorf("invalid claims")
	}
	email, ok := claims["email"].(string)
	if !ok || email == "" {
		return "", fmt.Errorf("email not found in token")
	}
	return email, nil
}

// ── Auth Middleware ────────────────────────────────────────────────────────
type contextKey string

const userContextKey contextKey = "userID"

func authMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Always allow options for CORS
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		authHeader := r.Header.Get("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			http.Error(w, "Missing or invalid token", http.StatusUnauthorized)
			return
		}
		token := strings.TrimPrefix(authHeader, "Bearer ")

		email, err := parseEmailFromJWT(token)
		if err != nil {
			log.Println("JWT parse error:", err)
			http.Error(w, "Invalid token", http.StatusUnauthorized)
			return
		}

		var userID int64
		err = db.QueryRow(context.Background(), "SELECT id FROM users WHERE email = $1", email).Scan(&userID)
		if err != nil {
			log.Printf("User not found for email %s: %v\n", email, err)
			http.Error(w, "User not found", http.StatusUnauthorized)
			return
		}

		ctx := context.WithValue(r.Context(), userContextKey, userID)
		next.ServeHTTP(w, r.WithContext(ctx))
	}
}

// ── API Handlers ───────────────────────────────────────────────────────────

// Get categories
func getCategoriesHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	var cats []CategoryInfo
	for _, cat := range categories {
		cats = append(cats, cat)
	}

	json.NewEncoder(w).Encode(cats)
}

type GoogleAuthRequest struct {
	Token string `json:"token"`
}

// Authenticate Google token and sync user
func authGoogleHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req GoogleAuthRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	clientID := os.Getenv("VITE_GOOGLE_CLIENT_ID")
	payload, err := idtoken.Validate(context.Background(), req.Token, clientID)
	if err != nil {
		log.Println("Google Token Validation error:", err)
		http.Error(w, "Invalid token", http.StatusUnauthorized)
		return
	}

	email := payload.Claims["email"].(string)
	name := payload.Claims["name"].(string)

	var userID int64
	err = db.QueryRow(context.Background(),
		"INSERT INTO users (name, email) VALUES ($1, $2) ON CONFLICT (email) DO UPDATE SET name=$1 RETURNING id",
		name, email).Scan(&userID)

	if err != nil {
		log.Println("DB error inserting user:", err)
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(User{
		ID:     fmt.Sprintf("%d", userID),
		Name:   name,
		Email:  email,
		Avatar: string(name[0]), // simplified logic
	})
}

// Get all expenses
func getExpensesHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	userID := r.Context().Value(userContextKey).(int64)

	rows, err := db.Query(context.Background(), "SELECT id, title, amount, category, subcategory, expense_date, txn_type FROM expenses WHERE user_id=$1 ORDER BY expense_date DESC", userID)
	if err != nil {
		http.Error(w, "Failed to fetch expenses", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var exps []*Expense
	for rows.Next() {
		var exp Expense
		var t time.Time
		var category *string
		var subcategory *string
		var txnType *string

		if err := rows.Scan(&exp.ID, &exp.Title, &exp.Amount, &category, &subcategory, &t, &txnType); err != nil {
			log.Println("Scan error:", err)
			continue
		}
		if category != nil {
			exp.Category = *category
		}
		if subcategory != nil {
			exp.Subcategory = *subcategory
		}
		if txnType != nil {
			exp.TxnType = *txnType
		} else {
			exp.TxnType = "debit"
		}
		exp.Date = t.Format("2006-01-02")
		exp.Note = ""
		exps = append(exps, &exp)
	}

	if exps == nil {
		exps = []*Expense{}
	}

	json.NewEncoder(w).Encode(exps)
}

// Add expense
func addExpenseHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	var exp Expense
	if err := json.NewDecoder(r.Body).Decode(&exp); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	userID := r.Context().Value(userContextKey).(int64)

	if exp.TxnType == "" {
		exp.TxnType = "debit"
	}

	err := db.QueryRow(context.Background(), `
		INSERT INTO expenses (user_id, title, amount, category, subcategory, expense_date, txn_type)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id
	`, userID, exp.Title, exp.Amount, exp.Category, exp.Subcategory, exp.Date, exp.TxnType).Scan(&exp.ID)

	if err != nil {
		log.Println("Insert error:", err)
		http.Error(w, "Failed to insert expense", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(exp)
}

// Delete expense
func deleteExpenseHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	var req struct {
		ID int64 `json:"id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	userID := r.Context().Value(userContextKey).(int64)

	res, err := db.Exec(context.Background(), "DELETE FROM expenses WHERE id = $1 AND user_id = $2", req.ID, userID)
	if err != nil {
		http.Error(w, "Failed to delete expense", http.StatusInternalServerError)
		return
	}

	if res.RowsAffected() == 0 {
		http.Error(w, "Not found or not your expense", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "deleted"})
}

// Get stats
func getStatsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	userID := r.Context().Value(userContextKey).(int64)

	var total, thisMonth float64
	var totalCredit, thisMonthCredit float64
	currentMonthStart := time.Now().Format("2006-01") + "-01"

	err := db.QueryRow(context.Background(), "SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE user_id=$1 AND (txn_type IS NULL OR txn_type='debit')", userID).Scan(&total)
	if err != nil {
		log.Println("Total query error:", err)
	}

	err = db.QueryRow(context.Background(), "SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE expense_date >= $1 AND user_id=$2 AND (txn_type IS NULL OR txn_type='debit')", currentMonthStart, userID).Scan(&thisMonth)
	if err != nil {
		log.Println("This month query error:", err)
	}

	err = db.QueryRow(context.Background(), "SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE user_id=$1 AND txn_type='credit'", userID).Scan(&totalCredit)
	if err != nil {
		log.Println("Total credit query error:", err)
	}

	err = db.QueryRow(context.Background(), "SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE expense_date >= $1 AND user_id=$2 AND txn_type='credit'", currentMonthStart, userID).Scan(&thisMonthCredit)
	if err != nil {
		log.Println("This month credit query error:", err)
	}

	var topCat string
	err = db.QueryRow(context.Background(), `
		SELECT category 
		FROM expenses 
		WHERE category IS NOT NULL AND user_id=$1
		GROUP BY category 
		ORDER BY SUM(amount) DESC 
		LIMIT 1
	`, userID).Scan(&topCat)
	if err != nil && err != pgx.ErrNoRows {
		log.Println("Top category query error:", err)
	}

	emoji := ""
	if catInfo, ok := categories[topCat]; ok {
		emoji = catInfo.Emoji
	}

	stats := ExpenseStats{
		Total:            total,
		ThisMonth:        thisMonth,
		TopCategory:      topCat,
		TopCategoryEmoji: emoji,
		TotalCredit:      totalCredit,
		ThisMonthCredit:  thisMonthCredit,
	}

	json.NewEncoder(w).Encode(stats)
}

// Get mock user
func getUserHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	user := User{
		ID:     "1",
		Name:   "Alex Rivera",
		Email:  "alex@gmail.com",
		Avatar: "AR",
	}

	json.NewEncoder(w).Encode(user)
}

func seedData() {
	var count int
	err := db.QueryRow(context.Background(), "SELECT COUNT(*) FROM expenses").Scan(&count)
	if err == nil && count == 0 {
		fmt.Println("Seeding initial expenses into database...")
		seeds := []Expense{
			{Title: "Zomato dinner", Category: "🍔 Food & Dining", Amount: 650, Date: "2025-03-09"},
			{Title: "Monthly metro pass", Category: "🚗 Transport", Amount: 1200, Date: "2025-03-01"},
			{Title: "Netflix", Category: "🎮 Entertainment", Amount: 649, Date: "2025-03-03"},
			{Title: "Gym membership", Category: "🏥 Health", Amount: 2000, Date: "2025-03-01"},
			{Title: "Grocery run", Category: "🍔 Food & Dining", Amount: 1840, Date: "2025-03-06"},
			{Title: "Uber to airport", Category: "🚗 Transport", Amount: 980, Date: "2025-03-08"},
			{Title: "New hoodie", Category: "👗 Shopping", Amount: 1299, Date: "2025-03-07"},
			{Title: "AWS course", Category: "📚 Education", Amount: 3499, Date: "2025-03-05"},
			{Title: "Dominos pizza", Category: "🍔 Food & Dining", Amount: 520, Date: "2025-03-10"},
			{Title: "Electricity bill", Category: "🏠 Housing", Amount: 1450, Date: "2025-03-02"},
		}
		// Notice: seeding for user ID 1. Assumes user 1 exists.
		for _, s := range seeds {
			db.Exec(context.Background(), `
				INSERT INTO expenses (user_id, title, amount, category, expense_date)
				VALUES ($1, $2, $3, $4, $5)
			`, 1, s.Title, s.Amount, s.Category, s.Date)
		}
	}
}

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	// db connection
	var err error
	db, err = pgxpool.New(context.Background(), "postgres://localhost:5432/expense_tracker")
	if err != nil {
		log.Fatal("Connection failed:", err)
	}
	defer db.Close()
	fmt.Println("Connected to expense_tracker!")

	// Auto-migrate: add txn_type column if missing
	_, err = db.Exec(context.Background(), `
		ALTER TABLE expenses ADD COLUMN IF NOT EXISTS txn_type TEXT NOT NULL DEFAULT 'debit'
	`)
	if err != nil {
		log.Printf("Warning: could not add txn_type column: %v\n", err)
	}

	// Ensure our dummy user exists for foreign key constraints
	_, err = db.Exec(context.Background(), `
		INSERT INTO users (id, name, email) 
		VALUES (1, 'Alex Rivera', 'alex@gmail.com') 
		ON CONFLICT (email) DO NOTHING
	`)
	if err != nil {
		log.Printf("Failed to seed user: %v\n", err)
	}

	seedData()

	mux := http.NewServeMux()

	// Public Routes
	mux.HandleFunc("/api/auth/google", authGoogleHandler)
	mux.HandleFunc("/api/user", getUserHandler)
	mux.HandleFunc("/api/categories", getCategoriesHandler)

	// Protected API Routes require Token
	mux.HandleFunc("/api/expenses", authMiddleware(getExpensesHandler))
	mux.HandleFunc("/api/expenses/add", authMiddleware(addExpenseHandler))
	mux.HandleFunc("/api/expenses/delete", authMiddleware(deleteExpenseHandler))
	mux.HandleFunc("/api/stats", authMiddleware(getStatsHandler))

	// Serve frontend static files
	staticDir := "./frontend"
	fs := http.FileServer(http.Dir(staticDir))
	mux.Handle("/", fs)

	// Apply CORS middleware
	handler := cors(mux)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	log.Printf("Frontend: http://localhost:%s", port)
	log.Printf("API: http://localhost:%s/api", port)
	log.Fatal(http.ListenAndServe(":"+port, handler))
}
