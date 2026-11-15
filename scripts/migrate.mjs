import { database, migrate } from '../backend/database.mjs';
const db = database();
try { await migrate(db); console.log('Authentication schema ready'); }
finally { await db.end(); }
