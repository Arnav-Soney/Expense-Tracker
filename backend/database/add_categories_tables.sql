
-- Migration: Add categories and subcategories tables
-- This migration makes categories configurable from the database

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    emoji VARCHAR(10) NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create subcategories table
CREATE TABLE IF NOT EXISTS subcategories (
    id SERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(category_id, name)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_subcategories_category_id ON subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active) WHERE is_active = true;

-- Insert default categories
INSERT INTO categories (name, emoji, display_order) VALUES
('Food & Dining', '🍔', 1),
('Transport', '🚗', 2),
('Housing', '🏠', 3),
('Entertainment', '🎮', 4),
('Health', '🏥', 5),
('Shopping', '👗', 6),
('Education', '📚', 7),
('Travel', '✈️', 8),
('Misc', '💰', 9)
ON CONFLICT (name) DO NOTHING;

-- Insert subcategories for Food & Dining
INSERT INTO subcategories (category_id, name, display_order)
SELECT id, subcategory, display_order
FROM categories, 
     unnest(ARRAY['Restaurants', 'Groceries', 'Coffee & Tea', 'Fast Food', 'Bars & Nightlife', 'Bakeries']) 
     WITH ORDINALITY AS t(subcategory, display_order)
WHERE categories.name = 'Food & Dining'
ON CONFLICT (category_id, name) DO NOTHING;

-- Insert subcategories for Transport
INSERT INTO subcategories (category_id, name, display_order)
SELECT id, subcategory, display_order
FROM categories, 
     unnest(ARRAY['Fuel', 'Uber / Ola', 'Metro / Bus', 'Flight', 'Parking', 'Bike Rental']) 
     WITH ORDINALITY AS t(subcategory, display_order)
WHERE categories.name = 'Transport'
ON CONFLICT (category_id, name) DO NOTHING;

-- Insert subcategories for Housing
INSERT INTO subcategories (category_id, name, display_order)
SELECT id, subcategory, display_order
FROM categories, 
     unnest(ARRAY['Rent', 'Electricity', 'Water', 'Internet', 'Maintenance', 'Furniture']) 
     WITH ORDINALITY AS t(subcategory, display_order)
WHERE categories.name = 'Housing'
ON CONFLICT (category_id, name) DO NOTHING;

-- Insert subcategories for Entertainment
INSERT INTO subcategories (category_id, name, display_order)
SELECT id, subcategory, display_order
FROM categories, 
     unnest(ARRAY['Streaming', 'Games', 'Movies', 'Concerts', 'Books', 'Hobbies']) 
     WITH ORDINALITY AS t(subcategory, display_order)
WHERE categories.name = 'Entertainment'
ON CONFLICT (category_id, name) DO NOTHING;

-- Insert subcategories for Health
INSERT INTO subcategories (category_id, name, display_order)
SELECT id, subcategory, display_order
FROM categories, 
     unnest(ARRAY['Doctor', 'Pharmacy', 'Gym', 'Dental', 'Insurance', 'Mental Health']) 
     WITH ORDINALITY AS t(subcategory, display_order)
WHERE categories.name = 'Health'
ON CONFLICT (category_id, name) DO NOTHING;

-- Insert subcategories for Shopping
INSERT INTO subcategories (category_id, name, display_order)
SELECT id, subcategory, display_order
FROM categories, 
     unnest(ARRAY['Clothing', 'Electronics', 'Accessories', 'Home Decor', 'Beauty', 'Sports']) 
     WITH ORDINALITY AS t(subcategory, display_order)
WHERE categories.name = 'Shopping'
ON CONFLICT (category_id, name) DO NOTHING;

-- Insert subcategories for Education
INSERT INTO subcategories (category_id, name, display_order)
SELECT id, subcategory, display_order
FROM categories, 
     unnest(ARRAY['Courses', 'Books', 'Subscriptions', 'Workshops', 'Stationery', 'Tuition']) 
     WITH ORDINALITY AS t(subcategory, display_order)
WHERE categories.name = 'Education'
ON CONFLICT (category_id, name) DO NOTHING;

-- Insert subcategories for Travel
INSERT INTO subcategories (category_id, name, display_order)
SELECT id, subcategory, display_order
FROM categories, 
     unnest(ARRAY['Hotels', 'Flights', 'Activities', 'Food Abroad', 'Souvenirs', 'Visas']) 
     WITH ORDINALITY AS t(subcategory, display_order)
WHERE categories.name = 'Travel'
ON CONFLICT (category_id, name) DO NOTHING;

-- Insert subcategories for Misc
INSERT INTO subcategories (category_id, name, display_order)
SELECT id, subcategory, display_order
FROM categories, 
     unnest(ARRAY['Home-Parents', 'Partner', 'Gifts', 'Donations', 'Tips', 'Pet Care', 'Cleaning', 'Other']) 
     WITH ORDINALITY AS t(subcategory, display_order)
WHERE categories.name = 'Misc'
ON CONFLICT (category_id, name) DO NOTHING;
