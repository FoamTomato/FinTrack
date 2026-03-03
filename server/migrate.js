const pool = require('./config/db');
const fs = require('fs');
const path = require('path');

async function migrate() {
  console.log('🚀 Starting Database Migration...');
  
  const sqlFiles = [
    'v2_feature_support.sql',
    'v3_user_profile.sql',
    'v4_category_stats.sql',
    'v5_soft_delete_support.sql'
  ];

  for (const fileName of sqlFiles) {
    const filePath = path.join(__dirname, 'sql', fileName);
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️  File not found: ${fileName}, skipping.`);
      continue;
    }

    console.log(`\n📄 Processing ${fileName}...`);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Split by semicolon, but be careful with IF/PREPARE blocks
    // Since our scripts use PREPARE/EXECUTE for ALTER, we can't just split by ;
    // However, mysql2 supports multiple statements if enabled, but it's risky.
    // Better: Split by ; and filter empty, but our scripts have complex blocks.
    // Special handling for the scripts provided:
    
    const statements = content.split(/;\s*$/m).filter(s => s.trim().length > 0);

    for (let statement of statements) {
      try {
        await pool.query(statement);
        console.log(`✅ Success: ${statement.trim().substring(0, 50)}...`);
      } catch (err) {
        // Ignore "Duplicate column name" or "Table already exists" errors
        if (err.code === 'ER_DUP_FIELDNAME' || err.code === 'ER_TABLE_EXISTS_ERROR') {
          console.log(`ℹ️  Skipped (Already exists): ${err.message}`);
        } else {
          console.error(`❌ Error in ${fileName}:`, err.message);
        }
      }
    }
  }

  console.log('\n✨ Migration finished!');
  process.exit(0);
}

migrate().catch(err => {
  console.error('🔥 Migration failed:', err);
  process.exit(1);
});
