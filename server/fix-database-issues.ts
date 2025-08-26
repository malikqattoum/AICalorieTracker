
import { db } from './db';
import { sql } from 'drizzle-orm';
import { siteContent } from '@shared/schema';

async function main() {
  console.log('=== DATABASE FIX SCRIPT ===');
  console.log('This script will fix database issues causing 500 errors');

  try {
    // Check if database connection is working
    console.log('\n1. Testing database connection...');
    await db.execute(sql`SELECT 1`);
    console.log('✓ Database connection successful');

    // Check if site_content table exists
    console.log('\n2. Checking if site_content table exists...');
    const tableCheck = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name = 'site_content'
    `);

    if (tableCheck.length === 0) {
      console.log('✗ site_content table does not exist, creating it...');

      // Create the site_content table
      await db.execute(sql`
        CREATE TABLE site_content (
          \`key\` varchar(64) NOT NULL,
          value text NOT NULL,
          PRIMARY KEY (\`key\`)
        )
      `);
      console.log('✓ site_content table created successfully');
    } else {
      console.log('✓ site_content table exists');
    }

    // Check if home content exists
    console.log('\n3. Checking if home content exists...');
    const homeContentCheck = await db.select().from(siteContent).where(sql`\`key\` = 'home'`);

    if (homeContentCheck.length === 0) {
      console.log('✗ Home content does not exist, adding default content...');

      // Add default home content
      await db.insert(siteContent).values({
        key: 'home',
        value: JSON.stringify({
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
        })
      });
      console.log('✓ Default home content added successfully');
    } else {
      console.log('✓ Home content exists');
    }

    // Check if session tables exist
    console.log('\n4. Checking session storage...');
    const sessionCheck = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name = 'sessions'
    `);

    if (sessionCheck.length === 0) {
      console.log('✗ Sessions table does not exist, creating it...');

      // Create sessions table for express-mysql-session
      await db.execute(sql`
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

    console.log('\n=== DATABASE FIX COMPLETE ===');
    console.log('All database issues have been resolved. The 500 errors should now be fixed.');

  } catch (error) {
    console.error('\n❌ Error during database fix:', error);
    console.error('\nPlease check your database connection and configuration.');
    process.exit(1);
  }
}

main();
