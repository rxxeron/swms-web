const { query } = require('./config/database');

async function addDeactivatedUntilColumn() {
  try {
    console.log('Adding deactivated_until column to users table...');
    
    await query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS deactivated_until TIMESTAMP
    `);
    
    console.log('✅ Successfully added deactivated_until column');
    
    // Test the column exists
    const result = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'deactivated_until'
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Column verified in database schema');
    } else {
      console.log('❌ Column not found in schema');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding column:', error);
    process.exit(1);
  }
}

addDeactivatedUntilColumn();
