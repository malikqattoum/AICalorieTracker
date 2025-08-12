-- Add food density column
ALTER TABLE foods ADD COLUMN density REAL;

-- Create reference objects table
CREATE TABLE reference_objects (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  width_cm REAL NOT NULL,
  height_cm REAL NOT NULL,
  shape TEXT NOT NULL CHECK (shape IN ('rectangle', 'circle', 'credit_card', 'coin'))
);

-- Prepopulate common reference objects
INSERT INTO reference_objects (name, width_cm, height_cm, shape) VALUES
  ('Credit Card', 8.56, 5.398, 'credit_card'),
  ('US Quarter', 2.426, 2.426, 'coin'),
  ('AA Battery', 5.0, 1.4, 'rectangle'),
  ('Standard Business Card', 9.0, 5.0, 'rectangle');