-- Add food density column to meal_analyses
ALTER TABLE meal_analyses ADD COLUMN IF NOT EXISTS density REAL;

-- Create reference objects table
CREATE TABLE IF NOT EXISTS reference_objects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  width_cm REAL NOT NULL,
  height_cm REAL NOT NULL,
  shape VARCHAR(50) NOT NULL
);

-- Prepopulate common reference objects
INSERT INTO reference_objects (name, width_cm, height_cm, shape) VALUES
  ('Credit Card', 8.56, 5.398, 'credit_card'),
  ('US Quarter', 2.426, 2.426, 'coin'),
  ('AA Battery', 5.0, 1.4, 'rectangle'),
  ('Standard Business Card', 9.0, 5.0, 'rectangle');