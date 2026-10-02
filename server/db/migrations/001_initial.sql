CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  goal_weight REAL DEFAULT 160 CHECK (goal_weight IS NULL OR goal_weight > 0),
  calorie_goal REAL DEFAULT 2000,
  protein_goal REAL DEFAULT 160,
  carbs_goal REAL DEFAULT 200,
  fat_goal REAL DEFAULT 65,
  timezone TEXT NOT NULL DEFAULT 'America/Los_Angeles',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO settings (id) VALUES (1);

CREATE TABLE IF NOT EXISTS weight_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_date TEXT NOT NULL UNIQUE,
  pounds REAL NOT NULL CHECK (pounds > 0),
  note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quick_foods (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  calories REAL NOT NULL CHECK (calories >= 0),
  protein_grams REAL NOT NULL CHECK (protein_grams >= 0),
  carbs_grams REAL NOT NULL CHECK (carbs_grams >= 0),
  fat_grams REAL NOT NULL CHECK (fat_grams >= 0),
  ai_metadata TEXT,
  archived_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS meal_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  local_date TEXT NOT NULL,
  logged_at TEXT NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  quick_food_id INTEGER REFERENCES quick_foods(id),
  inherits_quick_food INTEGER NOT NULL DEFAULT 0 CHECK (inherits_quick_food IN (0, 1)),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  calories REAL NOT NULL CHECK (calories >= 0),
  protein_grams REAL NOT NULL CHECK (protein_grams >= 0),
  carbs_grams REAL NOT NULL CHECK (carbs_grams >= 0),
  fat_grams REAL NOT NULL CHECK (fat_grams >= 0),
  ai_metadata TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_weight_entries_date ON weight_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_meal_entries_date ON meal_entries(local_date);
CREATE INDEX IF NOT EXISTS idx_meal_entries_quick_food ON meal_entries(quick_food_id);
