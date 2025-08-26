import 'dotenv/config';
import { db } from './db';
import { sql } from 'drizzle-orm';

async function addMissingColumns() {
  console.log('Adding missing columns to users table...');

  try {
    // First, check if columns exist
    const columns = await db.execute(sql`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'calorie_tracker'
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME IN ('referred_by', 'referral_code')
    `);

    const existingColumns = (columns as any[]).map(row => row.COLUMN_NAME);
    console.log('Existing columns:', existingColumns);

    // Add referred_by column if it doesn't exist
    if (!existingColumns.includes('referred_by')) {
      await db.execute(sql`
        ALTER TABLE users
        ADD COLUMN referred_by INT
      `);
      console.log('- referred_by column added');
    } else {
      console.log('- referred_by column already exists');
    }

    // Add referral_code column if it doesn't exist
    if (!existingColumns.includes('referral_code')) {
      await db.execute(sql`
        ALTER TABLE users
        ADD COLUMN referral_code VARCHAR(255)
      `);
      console.log('- referral_code column added');
    } else {
      console.log('- referral_code column already exists');
    }

    // Add foreign key constraint if it doesn't exist
    try {
      await db.execute(sql`
        ALTER TABLE users
        ADD CONSTRAINT fk_referred_by
        FOREIGN KEY (referred_by) REFERENCES users(id)
      `);
      console.log('- Foreign key constraint added');
    } catch (fkError: any) {
      if (fkError.message.includes('Duplicate key name') || fkError.message.includes('Duplicate entry')) {
        console.log('- Foreign key constraint already exists');
      } else {
        throw fkError;
      }
    }

    console.log('Successfully updated users table schema');
  } catch (error) {
    console.error('Error adding missing columns:', error);
    throw error;
  }
}

// Run the script
addMissingColumns().then(() => {
  console.log('Script completed');
  process.exit(0);
});