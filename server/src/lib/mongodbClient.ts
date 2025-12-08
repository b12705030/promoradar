import { MongoClient, Db } from 'mongodb';
import { config } from '../config/env';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function getMongoDb(): Promise<Db> {
	if (db) return db;

	if (!config.MONGODB_URI) {
		throw new Error('MONGODB_URI is not configured');
	}

	client = new MongoClient(config.MONGODB_URI);
	await client.connect();
	db = client.db(config.MONGODB_DB_NAME);

	console.log(`[MongoDB] Connected to database: ${config.MONGODB_DB_NAME}`);
	return db;
}

export async function closeMongoConnection(): Promise<void> {
	if (client) {
		await client.close();
		client = null;
		db = null;
	}
}

