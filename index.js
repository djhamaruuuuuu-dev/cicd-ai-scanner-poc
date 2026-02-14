import { setupDatabase } from './src/setup-db.js';

async function main() {
  try {
    console.log('🚀 Setting up AI-Powered CI/CD Security Scanner...\n');

    // Initialize database
    await setupDatabase();
    console.log('✅ Database initialized\n');

    console.log('📋 Project structure:');
    console.log('   src/');
    console.log('     ├── server.js (Main server)');
    console.log('     ├── setup-db.js (Database setup)');
    console.log('     ├── ai-service.js (AI analysis)');
    console.log('     ├── report-generator.js (PDF/HTML reports)');
    console.log('     └── routes/');
    console.log('         ├── webhooks.js (Webhook handlers)');
    console.log('         └── api.js (REST API)');
    console.log('   tests/');
    console.log('     └── scan-repo.js (Test script)\n');

    console.log('📝 To run the server:');
    console.log('   npm install');
    console.log('   npm start\n');

    console.log('🎯 Quick start:');
    console.log('   1. Create PostgreSQL database');
    console.log('   2. Update .env with database credentials');
    console.log('   3. Run: npm start');
    console.log('   4. Send webhook: POST /api/webhooks/{tool}\n');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

main();
