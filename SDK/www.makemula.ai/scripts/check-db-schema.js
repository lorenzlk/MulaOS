const { sequelize } = require('../models');

async function checkDatabaseSchema() {
  try {
    console.log('Checking database schema...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection successful');
    
    // Get table information
    const [results] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'searches' 
      ORDER BY ordinal_position;
    `);
    
    console.log('\nSearches table schema:');
    results.forEach(col => {
      console.log(`${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default})`);
    });
    
    // Check constraints
    const [constraints] = await sequelize.query(`
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints 
      WHERE table_name = 'searches';
    `);
    
    console.log('\nTable constraints:');
    constraints.forEach(constraint => {
      console.log(`${constraint.constraint_name}: ${constraint.constraint_type}`);
    });
    
    // Check indexes
    const [indexes] = await sequelize.query(`
      SELECT indexname, indexdef
      FROM pg_indexes 
      WHERE tablename = 'searches';
    `);
    
    console.log('\nTable indexes:');
    indexes.forEach(index => {
      console.log(`${index.indexname}: ${index.indexdef}`);
    });
    
  } catch (error) {
    console.error('Error checking database schema:', error);
    console.error('Error details:', error.message);
  }
}

// Run the check
checkDatabaseSchema().then(() => {
  console.log('\nSchema check completed');
  process.exit(0);
}).catch(error => {
  console.error('Schema check failed:', error);
  process.exit(1);
}); 