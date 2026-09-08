/**
 * Jest global test setup.
 * Sets required environment variables so config modules can be imported in tests
 * without needing a real .env file.
 */

process.env['NODE_ENV'] = 'test';
process.env['PORT'] = '4000';
process.env['MONGODB_URI'] = 'mongodb://localhost:27017/among_test';
process.env['FIREBASE_PROJECT_ID'] = 'test-project';
process.env['FIREBASE_CLIENT_EMAIL'] = 'test@test-project.iam.gserviceaccount.com';
process.env['FIREBASE_PRIVATE_KEY'] = '-----BEGIN RSA PRIVATE KEY-----\ntest\n-----END RSA PRIVATE KEY-----\n';
process.env['ALLOWED_ORIGINS'] = 'http://localhost:3000';
process.env['JWT_SECRET'] = 'test-jwt-secret-must-be-at-least-32-chars';
process.env['RATE_LIMIT_WINDOW_MS'] = '900000';
process.env['RATE_LIMIT_MAX_REQUESTS'] = '100';
