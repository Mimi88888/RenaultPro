import { drizzle } from 'drizzle-orm/neon-serverless';
import { neon } from '@neondatabase/serverless';
import * as schema from '../shared/schema';

// Create a Neon connection
const sql = neon(process.env.DATABASE_URL!);

// Create a Drizzle ORM instance
export const db = drizzle(sql, { schema });