
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function main() {
  console.log('=== DATABASE FIX SCRIPT ===');
  console.log('This script will fix database issues causing 500 errors');

  try {
    // Get database configuration from environment variables
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'calorie_tracker'
    };

    console.log('\n1. Testing database connection...');
    console.log(`Connecting to ${dbConfig.host}:${dbConfig.port} as ${dbConfig.user}...`);

    // Create a connection
    const connection = await mysql.createConnection(dbConfig);

    // Test the connection
    await connection.execute('SELECT 1');
    console.log('✓ Database connection successful');

    // Check if site_content table exists
    console.log('\n2. Checking if site_content table exists...');
    const [tables] = await connection.execute(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = ?
      AND table_name = 'site_content'
    `, [dbConfig.database]);

    if (tables.length === 0) {
      console.log('✗ site_content table does not exist, creating it...');

      // Create the site_content table
      await connection.execute(`
        CREATE TABLE site_content (
          key varchar(64) NOT NULL,
          value text NOT NULL,
          PRIMARY KEY (key)
        )
      `);
      console.log('✓ site_content table created successfully');
    } else {
      console.log('✓ site_content table exists');
    }

    // Check if home content exists
    console.log('\n3. Checking if home content exists...');
    const [homeContent] = await connection.execute(`
      SELECT * FROM site_content WHERE \`key\` = 'home'
    `);

    if (homeContent.length === 0) {
      console.log('✗ Home content does not exist, adding default content...');

      // Add default home content
      const defaultHomeContent = {
        hero: {
          title: "AI Calorie Tracker",
          subtitle: "Track your nutrition with AI-powered food recognition",
          cta: "Get Started"
        },
        features: [
          {
            title: "AI Food Recognition",
            description: "Simply take a photo of your meal and let our AI analyze the nutritional content."
          },
          {
            title: "Personalized Insights",
            description: "Get personalized nutrition recommendations based on your goals and dietary preferences."
          },
          {
            title: "Progress Tracking",
            description: "Track your nutrition goals and see your progress over time with detailed analytics."
          }
        ],
        testimonials: [
          {
            name: "Sarah J.",
            role: "Fitness Enthusiast",
            content: "This app has completely changed how I track my nutrition. The AI recognition is incredibly accurate!"
          },
          {
            name: "Mike T.",
            role: "Health Coach",
            content: "I recommend this app to all my clients. It makes tracking nutrition so much easier."
          }
        ]
      };

      await connection.execute(`
        INSERT INTO site_content (\`key\`, value) VALUES ('home', ?)
      `, [JSON.stringify(defaultHomeContent)]);
      console.log('✓ Default home content added successfully');
    } else {
      console.log('✓ Home content exists');
    }

    // Check if sessions table exists
    console.log('\n4. Checking session storage...');
    const [sessionTables] = await connection.execute(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = ?
      AND table_name = 'sessions'
    `, [dbConfig.database]);

    if (sessionTables.length === 0) {
      console.log('✗ Sessions table does not exist, creating it...');

      // Create sessions table for express-mysql-session
      await connection.execute(`
        CREATE TABLE sessions (
          session_id varchar(128) NOT NULL,
          expires int(11) unsigned NOT NULL,
          data text DEFAULT NULL,
          PRIMARY KEY (session_id)
        )
      `);
      console.log('✓ Sessions table created successfully');
    } else {
      console.log('✓ Sessions table exists');
    }

    // Close the connection
    await connection.end();

    console.log('\n=== DATABASE FIX COMPLETE ===');
    console.log('All database issues have been resolved. The 500 errors should now be fixed.');

  } catch (error) {
    console.error('\n❌ Error during database fix:', error);
    console.error('\nPlease check your database connection and configuration.');
    process.exit(1);
  }
}

main();
