import { drizzle } from 'drizzle-orm/neon-serverless';
import { neon } from '@neondatabase/serverless';
import * as schema from '../shared/schema.ts';

const sql = neon(process.env.DATABASE_URL!);

export const db = drizzle(sql as any, { schema }); // temporary workaround
