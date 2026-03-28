package main

import (
	"context"
	"encoding/json"
	"expense-tracker/backend/model"
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

// ── Globals ────────────────────────────────────────────────────────
var (
	db *pgxpool.Pool

	categories = map[string]model.CategoryInfo{
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

// parseUserFromJWT extracts email/name claims from a Google JWT without remote verification.
// The token is already verified by Google's servers during /auth/google login.
func parseUserFromJWT(tokenStr string) (string, string, error) {
	p := gojwt.NewParser()
	token, _, err := p.ParseUnverified(tokenStr, gojwt.MapClaims{})
	if err != nil {
		return "", "", err
	}
	claims, ok := token.Claims.(gojwt.MapClaims)
	if !ok {
		return "", "", fmt.Errorf("invalid claims")
	}
	email, ok := claims["email"].(string)
	if !ok || email == "" {
		return "", "", fmt.Errorf("email not found in token")
	}
	name, _ := claims["name"].(string)
	return email, name, nil
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

		email, name, err := parseUserFromJWT(token)
		if err != nil {
			log.Println("JWT parse error:", err)
			http.Error(w, "Invalid token", http.StatusUnauthorized)
			return
		}

		var userID int64
		err = db.QueryRow(context.Background(), "SELECT id FROM users WHERE email = $1", email).Scan(&userID)
		if err != nil {
			if err == pgx.ErrNoRows {
				if strings.TrimSpace(name) == "" {
					name = strings.Split(email, "@")[0]
				}

				err = db.QueryRow(context.Background(), `
					INSERT INTO users (name, email)
					VALUES ($1, $2)
					ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
					RETURNING id
				`, name, email).Scan(&userID)
				if err != nil {
					log.Printf("Failed to auto-create user %s: %v\n", email, err)
					http.Error(w, "User sync failed", http.StatusUnauthorized)
					return
				}
			} else {
				log.Printf("User lookup failed for email %s: %v\n", email, err)
				http.Error(w, "User lookup failed", http.StatusUnauthorized)
				return
			}
		}
		ctx := context.WithValue(r.Context(), userContextKey, userID)
		next.ServeHTTP(w, r.WithContext(ctx))
	}
}

// ── API Handlers ───────────────────────────────────────────────────────────

// Get categories
func getCategoriesHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	var cats []model.CategoryInfo
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

	// Seed starter data for this user only if they have no expenses yet.
	seedData(userID)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(model.User{
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

	var exps []*model.Expense
	for rows.Next() {
		var exp model.Expense
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
		exps = []*model.Expense{}
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

	var exp model.Expense
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

	stats := model.ExpenseStats{
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

	user := model.User{
		ID:     "1",
		Name:   "Alex Rivera",
		Email:  "alex@gmail.com",
		Avatar: "AR",
	}

	json.NewEncoder(w).Encode(user)
}

// Get current authenticated session user from DB
func getSessionHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	userID := r.Context().Value(userContextKey).(int64)

	var name, email string
	err := db.QueryRow(context.Background(), "SELECT name, email FROM users WHERE id = $1", userID).Scan(&name, &email)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	avatar := "U"
	parts := strings.Fields(name)
	if len(parts) >= 2 {
		avatar = strings.ToUpper(string(parts[0][0]) + string(parts[1][0]))
	} else if len(parts) == 1 && len(parts[0]) > 0 {
		avatar = strings.ToUpper(string(parts[0][0]))
	}

	json.NewEncoder(w).Encode(model.User{
		ID:     fmt.Sprintf("%d", userID),
		Name:   name,
		Email:  email,
		Avatar: avatar,
	})
}

// ── Income Handlers ────────────────────────────────────────────────────────

func getIncomesHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	userID := r.Context().Value(userContextKey).(int64)

	rows, err := db.Query(context.Background(),
		"SELECT id, month, source, amount FROM incomes WHERE user_id=$1 ORDER BY month DESC", userID)
	if err != nil {
		http.Error(w, "Failed to fetch incomes", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var incomes []model.Income
	for rows.Next() {
		var inc model.Income
		if err := rows.Scan(&inc.ID, &inc.Month, &inc.Source, &inc.Amount); err != nil {
			log.Println("Income scan error:", err)
			continue
		}
		incomes = append(incomes, inc)
	}

	if incomes == nil {
		incomes = []model.Income{}
	}
	json.NewEncoder(w).Encode(incomes)
}

func addIncomeHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	userID := r.Context().Value(userContextKey).(int64)

	var inc model.Income
	if err := json.NewDecoder(r.Body).Decode(&inc); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	err := db.QueryRow(context.Background(), `
		INSERT INTO incomes (user_id, month, source, amount)
		VALUES ($1, $2, $3, $4)
		RETURNING id
	`, userID, inc.Month, inc.Source, inc.Amount).Scan(&inc.ID)

	if err != nil {
		log.Println("Income insert error:", err)
		http.Error(w, "Failed to add income", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(inc)
}

func deleteIncomeHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	userID := r.Context().Value(userContextKey).(int64)

	var req struct {
		ID int64 `json:"id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	res, err := db.Exec(context.Background(),
		"DELETE FROM incomes WHERE id = $1 AND user_id = $2", req.ID, userID)
	if err != nil {
		http.Error(w, "Failed to delete income", http.StatusInternalServerError)
		return
	}

	if res.RowsAffected() == 0 {
		http.Error(w, "Not found", http.StatusNotFound)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{"status": "deleted"})
}

// ── Receivable Handlers ────────────────────────────────────────────────────

func getReceivablesHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	userID := r.Context().Value(userContextKey).(int64)

	rows, err := db.Query(context.Background(), `
		SELECT id, person, amount, amount_received, description, date, received 
		FROM receivables WHERE user_id=$1 ORDER BY date DESC
	`, userID)
	if err != nil {
		http.Error(w, "Failed to fetch receivables", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var receivables []model.Receivable
	for rows.Next() {
		var rec model.Receivable
		var dateVal time.Time
		var desc *string
		if err := rows.Scan(&rec.ID, &rec.Person, &rec.Amount, &rec.AmountReceived, &desc, &dateVal, &rec.Received); err != nil {
			log.Println("Receivable scan error:", err)
			continue
		}
		rec.Date = dateVal.Format("2006-01-02")
		if desc != nil {
			rec.Description = *desc
		}
		receivables = append(receivables, rec)
	}

	if receivables == nil {
		receivables = []model.Receivable{}
	}
	json.NewEncoder(w).Encode(receivables)
}

func addReceivableHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	userID := r.Context().Value(userContextKey).(int64)

	var rec model.Receivable
	if err := json.NewDecoder(r.Body).Decode(&rec); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	err := db.QueryRow(context.Background(), `
		INSERT INTO receivables (user_id, person, amount, amount_received, description, date, received)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id
	`, userID, rec.Person, rec.Amount, rec.AmountReceived, rec.Description, rec.Date, rec.Received).Scan(&rec.ID)

	if err != nil {
		log.Println("Receivable insert error:", err)
		http.Error(w, "Failed to add receivable", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(rec)
}

func updateReceivableHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut && r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	userID := r.Context().Value(userContextKey).(int64)

	var rec model.Receivable
	if err := json.NewDecoder(r.Body).Decode(&rec); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	res, err := db.Exec(context.Background(), `
		UPDATE receivables 
		SET person=$1, amount=$2, amount_received=$3, description=$4, date=$5, received=$6
		WHERE id=$7 AND user_id=$8
	`, rec.Person, rec.Amount, rec.AmountReceived, rec.Description, rec.Date, rec.Received, rec.ID, userID)

	if err != nil {
		log.Println("Receivable update error:", err)
		http.Error(w, "Failed to update receivable", http.StatusInternalServerError)
		return
	}

	if res.RowsAffected() == 0 {
		http.Error(w, "Not found", http.StatusNotFound)
		return
	}

	json.NewEncoder(w).Encode(rec)
}

func deleteReceivableHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	userID := r.Context().Value(userContextKey).(int64)

	var req struct {
		ID int64 `json:"id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	res, err := db.Exec(context.Background(),
		"DELETE FROM receivables WHERE id = $1 AND user_id = $2", req.ID, userID)
	if err != nil {
		http.Error(w, "Failed to delete receivable", http.StatusInternalServerError)
		return
	}

	if res.RowsAffected() == 0 {
		http.Error(w, "Not found", http.StatusNotFound)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{"status": "deleted"})
}

func seedData(seedUserID int64) {
	// Check if user was already seeded (using a flag column)
	var seeded bool
	err := db.QueryRow(context.Background(), "SELECT COALESCE(seeded, false) FROM users WHERE id = $1", seedUserID).Scan(&seeded)
	if err != nil || seeded {
		return // Already seeded or error
	}

	fmt.Printf("Seeding initial expenses for user %d...\\n", seedUserID)
	seeds := []model.Expense{
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
	// Seed for the provided user id.
	for _, s := range seeds {
		db.Exec(context.Background(), `
			INSERT INTO expenses (user_id, title, amount, category, expense_date)
			VALUES ($1, $2, $3, $4, $5)
		`, seedUserID, s.Title, s.Amount, s.Category, s.Date)
	}

	// Mark user as seeded
	db.Exec(context.Background(), "UPDATE users SET seeded = true WHERE id = $1", seedUserID)
}

func main() {
	if err := godotenv.Load(); err != nil {
		if err2 := godotenv.Load("backend/configs/.env"); err2 != nil {
			log.Println("No .env file found")
		} else {
			log.Println("Loaded env from backend/configs/.env")
		}
	}

	// db connection
	var err error
	databaseURL := strings.TrimSpace(os.Getenv("DATABASE_URL"))
	if databaseURL == "" {
		log.Fatal("DATABASE_URL is empty. Add it to .env")
	}

	db, err = pgxpool.New(context.Background(), databaseURL)
	if err != nil {
		log.Fatal("Connection failed:", err)
	}

	if err = db.Ping(context.Background()); err != nil {
		log.Fatal("Database ping failed:", err)
	}

	defer db.Close()
	fmt.Println("Connected to expense_tracker!")

	// Keep SERIAL sequences in sync with existing rows (important after manual id inserts)
	_, err = db.Exec(context.Background(), `
		SELECT setval(
			pg_get_serial_sequence('users', 'id'),
			COALESCE((SELECT MAX(id) FROM users), 1),
			true
		)
	`)
	if err != nil {
		log.Printf("Warning: could not sync users id sequence: %v\n", err)
	}

	_, err = db.Exec(context.Background(), `
		SELECT setval(
			pg_get_serial_sequence('expenses', 'id'),
			COALESCE((SELECT MAX(id) FROM expenses), 1),
			true
		)
	`)
	if err != nil {
		log.Printf("Warning: could not sync expenses id sequence: %v\n", err)
	}

	// Auto-migrate: add txn_type column if missing
	_, err = db.Exec(context.Background(), `
		ALTER TABLE expenses ADD COLUMN IF NOT EXISTS txn_type TEXT NOT NULL DEFAULT 'debit'
	`)
	if err != nil {
		log.Printf("Warning: could not add txn_type column: %v\n", err)
	}

	// Auto-migrate: add seeded column to users table
	_, err = db.Exec(context.Background(), `
		ALTER TABLE users ADD COLUMN IF NOT EXISTS seeded BOOLEAN DEFAULT FALSE
	`)
	if err != nil {
		log.Printf("Warning: could not add seeded column: %v\n", err)
	}

	// Mark existing users as already seeded (so they don't get re-seeded)
	_, err = db.Exec(context.Background(), `
		UPDATE users SET seeded = true WHERE seeded IS NULL OR seeded = false
	`)
	if err != nil {
		log.Printf("Warning: could not update existing users seeded flag: %v\n", err)
	}

	// Create incomes table if not exists
	_, err = db.Exec(context.Background(), `
		CREATE TABLE IF NOT EXISTS incomes (
			id SERIAL PRIMARY KEY,
			user_id INTEGER NOT NULL REFERENCES users(id),
			month VARCHAR(7) NOT NULL,
			source VARCHAR(200) NOT NULL,
			amount NUMERIC(12,2) NOT NULL,
			created_at TIMESTAMP DEFAULT NOW()
		)
	`)
	if err != nil {
		log.Printf("Warning: could not create incomes table: %v\n", err)
	}

	// Create receivables table if not exists
	_, err = db.Exec(context.Background(), `
		CREATE TABLE IF NOT EXISTS receivables (
			id SERIAL PRIMARY KEY,
			user_id INTEGER NOT NULL REFERENCES users(id),
			person VARCHAR(200) NOT NULL,
			amount NUMERIC(12,2) NOT NULL,
			amount_received NUMERIC(12,2) DEFAULT 0,
			description TEXT,
			date DATE NOT NULL,
			received BOOLEAN DEFAULT FALSE,
			created_at TIMESTAMP DEFAULT NOW()
		)
	`)
	if err != nil {
		log.Printf("Warning: could not create receivables table: %v\n", err)
	}

	// Ensure a seed user exists and get its id (no hardcoded primary key)
	var seedUserID int64
	err = db.QueryRow(context.Background(), `
		INSERT INTO users (name, email)
		VALUES ('Alex Rivera', 'alex@gmail.com')
		ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
		RETURNING id
	`).Scan(&seedUserID)
	if err != nil {
		log.Printf("Failed to seed user: %v\n", err)
	}

	if seedUserID > 0 {
		seedData(seedUserID)
	}

	mux := http.NewServeMux()

	// Public Routes
	mux.HandleFunc("/api/auth/google", authGoogleHandler)
	mux.HandleFunc("/api/user", getUserHandler)
	mux.HandleFunc("/api/categories", getCategoriesHandler)

	// Protected API Routes require Token
	mux.HandleFunc("/api/session", authMiddleware(getSessionHandler))
	mux.HandleFunc("/api/expenses", authMiddleware(getExpensesHandler))
	mux.HandleFunc("/api/expenses/add", authMiddleware(addExpenseHandler))
	mux.HandleFunc("/api/expenses/delete", authMiddleware(deleteExpenseHandler))
	mux.HandleFunc("/api/stats", authMiddleware(getStatsHandler))

	// Income routes
	mux.HandleFunc("/api/incomes", authMiddleware(getIncomesHandler))
	mux.HandleFunc("/api/incomes/add", authMiddleware(addIncomeHandler))
	mux.HandleFunc("/api/incomes/delete", authMiddleware(deleteIncomeHandler))

	// Receivable routes
	mux.HandleFunc("/api/receivables", authMiddleware(getReceivablesHandler))
	mux.HandleFunc("/api/receivables/add", authMiddleware(addReceivableHandler))
	mux.HandleFunc("/api/receivables/update", authMiddleware(updateReceivableHandler))
	mux.HandleFunc("/api/receivables/delete", authMiddleware(deleteReceivableHandler))

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
