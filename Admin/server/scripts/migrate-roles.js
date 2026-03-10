require('dotenv').config({ path: '.env' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrateSupportRole() {
  try {
    console.log('Starting migration: Update AdminRole enum...');
    
    // Step 1: Add SUPPORT_ADMIN to the enum if it doesn't exist
    try {
      await pool.query(
        `ALTER TYPE "AdminRole" ADD VALUE 'SUPPORT_ADMIN' BEFORE 'SUPPORT'`
      );
      console.log('✓ Added SUPPORT_ADMIN to AdminRole enum');
    } catch (e) {
      if (e.code === '42710') {
        console.log('✓ SUPPORT_ADMIN already exists in AdminRole enum');
      } else {
        throw e;
      }
    }
    
    // Step 2: Update any existing SUPPORT roles to SUPPORT_ADMIN
    const result = await pool.query(
      `UPDATE "AdminUser" SET role = 'SUPPORT_ADMIN' WHERE role = 'SUPPORT'`
    );
    console.log(`✓ Updated ${result.rowCount} records from SUPPORT to SUPPORT_ADMIN`);
    
    // Step 3: Remove old enum values we don't need (optional, requires migration)
    // For now, we'll just leave old values in case they're still referenced
    
    console.log('✓ Migration completed successfully');
  } catch (error) {
    console.error('Migration error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrateSupportRole();
