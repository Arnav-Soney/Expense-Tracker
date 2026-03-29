package model

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

type Income struct {
	ID     int64   `json:"id"`
	Month  string  `json:"month"` // e.g. "2026-03"
	Source string  `json:"source"`
	Amount float64 `json:"amount"`
}

type Receivable struct {
	ID             int64   `json:"id"`
	Person         string  `json:"person"`
	Amount         float64 `json:"amount"`
	AmountReceived float64 `json:"amountReceived"`
	Description    string  `json:"description"`
	Date           string  `json:"date"`
	Received       bool    `json:"received"`
}
