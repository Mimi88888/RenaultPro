import 'dotenv/config';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from '../shared/schema.ts';
import * as dotenv from "dotenv";

dotenv.config();

console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);
console.log("DATABASE_URL starts with:", process.env.DATABASE_URL?.substring(0, 20));

const sql = neon(process.env.DATABASE_URL!);

export const db = drizzle(sql, { schema });
