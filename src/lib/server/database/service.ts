import { env } from '$env/dynamic/private';
import Nedb from '@seald-io/nedb';
import { join } from 'path';

let db: Nedb;

async function connect() {
	db = new Nedb({ filename: join(env.DATA_DIR, 'data.db') });
	// It seems that the types are a bit older and there is no loadDatabaseAsync exported, but it exists
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore ts 2551
	await db.loadDatabaseAsync();
}

function getDb() {
	if (!db) {
		throw 'Database is not initialized!';
	}
	return db;
}

export { connect, getDb };
