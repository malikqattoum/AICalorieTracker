import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function setupAIProvider() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'calorie_tracker',
    port: process.env.DB_PORT || 3306
  });

  try {
    console.log('Setting up AI provider configuration...');
    
    // First, deactivate all existing configs
    await connection.execute('UPDATE ai_config SET is_active = FALSE');
    
    // Check if OpenAI config exists
    const [existing] = await connection.execute(
      'SELECT id FROM ai_config WHERE provider = ?', 
      ['openai']
    );
    
    if (existing.length > 0) {
      // Update existing OpenAI config to be active
      await connection.execute(
        'UPDATE ai_config SET is_active = TRUE, updated_at = NOW() WHERE provider = ?',
        ['openai']
      );
      console.log('✅ Activated existing OpenAI configuration');
    } else {
      // Insert new OpenAI config
      await connection.execute(`
        INSERT INTO ai_config (provider, model_name, prompt_template, is_active, created_at, updated_at)
        VALUES (?, ?, ?, TRUE, NOW(), NOW())
      `, [
        'openai',
        'gpt-4-vision-preview',
        'Analyze this food image and provide detailed nutritional information including calories, macronutrients, and portion size.'
      ]);
      console.log('✅ Created and activated new OpenAI configuration');
    }
    
    console.log('AI provider setup complete!');
    
  } catch (error) {
    console.error('Error setting up AI provider:', error);
  } finally {
    await connection.end();
  }
}

setupAIProvider();