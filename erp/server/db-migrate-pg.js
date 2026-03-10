/**
 * db-migrate-pg.js  –  Fallback migration using pg directly (no Prisma CLI needed)
 * Run with: node db-migrate-pg.js
 *
 * Creates SalaryStructure and Payroll tables for the HR/Payroll module.
 * Safe to run multiple times (uses IF NOT EXISTS).
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
    const client = await pool.connect();
    try {
        console.log('🔄 Connecting to database...');
        await client.query('SELECT 1'); // test connection
        console.log('✅ Connected\n');

        // 1. PayrollStatus enum
        await client.query(`
      DO $$ BEGIN
        CREATE TYPE "PayrollStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED');
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);
        console.log('✅ PayrollStatus enum');

        // 2. SalaryStructure table
        await client.query(`
      CREATE TABLE IF NOT EXISTS "SalaryStructure" (
        "id"            TEXT NOT NULL,
        "employeeId"    TEXT NOT NULL,
        "basicSalary"   DOUBLE PRECISION NOT NULL,
        "allowances"    DOUBLE PRECISION NOT NULL DEFAULT 0,
        "deductions"    DOUBLE PRECISION NOT NULL DEFAULT 0,
        "grossSalary"   DOUBLE PRECISION NOT NULL,
        "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "SalaryStructure_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "SalaryStructure_employeeId_key" UNIQUE ("employeeId"),
        CONSTRAINT "SalaryStructure_employeeId_fkey"
          FOREIGN KEY ("employeeId") REFERENCES "User"("id")
          ON DELETE RESTRICT ON UPDATE CASCADE
      );
    `);
        console.log('✅ SalaryStructure table');

        // 3. Payroll table
        await client.query(`
      CREATE TABLE IF NOT EXISTS "Payroll" (
        "id"           TEXT NOT NULL,
        "structureId"  TEXT NOT NULL,
        "employeeId"   TEXT NOT NULL,
        "month"        INTEGER NOT NULL,
        "year"         INTEGER NOT NULL,
        "presentDays"  INTEGER NOT NULL DEFAULT 0,
        "absentDays"   INTEGER NOT NULL DEFAULT 0,
        "basicSalary"  DOUBLE PRECISION NOT NULL,
        "allowances"   DOUBLE PRECISION NOT NULL,
        "deductions"   DOUBLE PRECISION NOT NULL,
        "netSalary"    DOUBLE PRECISION NOT NULL,
        "status"       "PayrollStatus" NOT NULL DEFAULT 'PENDING',
        "paidAt"       TIMESTAMP(3),
        "paidBy"       TEXT,
        "remarks"      TEXT,
        "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "Payroll_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "Payroll_employeeId_month_year_key"
          UNIQUE ("employeeId", "month", "year"),
        CONSTRAINT "Payroll_structureId_fkey"
          FOREIGN KEY ("structureId") REFERENCES "SalaryStructure"("id")
          ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT "Payroll_employeeId_fkey"
          FOREIGN KEY ("employeeId") REFERENCES "User"("id")
          ON DELETE RESTRICT ON UPDATE CASCADE
      );
    `);
        console.log('✅ Payroll table');

        // 4. Indexes
        await client.query(`CREATE INDEX IF NOT EXISTS "Payroll_month_year_idx" ON "Payroll"("month", "year");`);
        await client.query(`CREATE INDEX IF NOT EXISTS "Payroll_status_idx" ON "Payroll"("status");`);
        console.log('✅ Indexes');

        // 5. Also regenerate Prisma client
        console.log('\n🔄 Regenerating Prisma client...');
        const { execSync } = require('child_process');
        try {
            execSync('npx prisma generate', { stdio: 'inherit', cwd: __dirname });
            console.log('✅ Prisma client regenerated');
        } catch (e) {
            console.warn('⚠️  Could not auto-run prisma generate. Run it manually if needed.');
        }

        console.log('\n🎉 Migration complete! Restart npm run dev in the server folder.\n');
    } finally {
        client.release();
        await pool.end();
    }
}

run().catch((e) => {
    console.error('❌ Migration failed:', e.message);
    process.exit(1);
});
