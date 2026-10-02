ALTER TABLE settings ADD COLUMN goal_weight REAL CHECK (goal_weight IS NULL OR goal_weight > 0);

UPDATE settings
SET goal_weight = COALESCE(goal_weight, 160),
    calorie_goal = COALESCE(calorie_goal, 2000),
    protein_goal = COALESCE(protein_goal, 160),
    carbs_goal = COALESCE(carbs_goal, 200),
    fat_goal = COALESCE(fat_goal, 65),
    updated_at = CURRENT_TIMESTAMP
WHERE id = 1;
