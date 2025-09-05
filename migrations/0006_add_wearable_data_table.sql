-- Create wearable data table for storing fitness tracker information
CREATE TABLE IF NOT EXISTS wearable_data (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  device_type VARCHAR(100) NOT NULL,
  data_type VARCHAR(100) NOT NULL,
  value DECIMAL(10,2) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX idx_wearable_data_user_id ON wearable_data(user_id);
CREATE INDEX idx_wearable_data_recorded_at ON wearable_data(recorded_at);
CREATE INDEX idx_wearable_data_device_type ON wearable_data(device_type);