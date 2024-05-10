import { env } from '$env/dynamic/private';
import { getDb } from '$lib/server/database/service';
import { createHash, randomUUID } from 'crypto';
import { createWriteStream } from 'fs';
import { mkdir } from 'fs/promises';
import { pipeline } from 'stream/promises';
import { dirname, join, resolve } from 'path';
import { Readable } from 'stream';

interface NewRelease {
	environment: {
		operatingSystem: string;
		architecture: string;
	};
	type: string;
	file: File;
}

interface Release {
	_id: string;
	sha1: string;
	date: Date;
	environment: {
		operatingSystem: string;
		architecture: string;
	};
	type: string;
}

interface ReleaseFilter {
	operatingSystem: string | null;
	architecture: string | null;
	type: string | null;
	dateAfter: string | null;
	dateBefore: string | null;
}

async function createRelease(newRelease: NewRelease): Promise<Release> {
	const id = randomUUID().replaceAll('-', '');

	const date = new Date();
	const hash = await storeAndHashFile(id, date, newRelease.file);

	const release: Release = {
		_id: id,
		date: new Date(),
		environment: newRelease.environment,
		type: newRelease.type,
		sha1: hash
	};

	await getDb().insertAsync(release);
	return release;
}

async function listReleases(filter: ReleaseFilter): Promise<Release[]> {
	console.log('filter', filter);
	const query = buildQuery(filter);
	console.log('query', query);

	const result = await getDb().findAsync(query).sort({ date: 1 }).limit(1000);

	return result as unknown as Release[];
}

function buildQuery(filter: ReleaseFilter): unknown {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const filterObj: any = {};
	if (filter.type) {
		filterObj['type'] = filter.type;
	}
	if (filter.operatingSystem) {
		filterObj['environment.operatingSystem'] = filter.operatingSystem;
	}
	if (filter.architecture) {
		filterObj['environment.architecture'] = filter.architecture;
	}
	if (filter.dateAfter || filter.dateBefore) {
		filterObj['date'] = {};
	}
	if (filter.dateAfter) {
		filterObj['date']['$gte'] = new Date(filter.dateAfter);
	}
	if (filter.dateBefore) {
		filterObj['date']['$lte'] = new Date(filter.dateBefore);
	}
	return filterObj;
}

async function storeAndHashFile(id: string, date: Date, file: File): Promise<string> {
	const targetPath = getPathToFile(id, date);
	await mkdir(dirname(targetPath), { recursive: true });

	const targetStream = createWriteStream(targetPath);

	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	const readable = Readable.fromWeb(file.stream());

	// Create the hash of the file at the same time as copying the file
	// This should avoid reading the file twice
	let hash: string = '';
	const hashPromise = pipeline(
		readable,
		createHash('sha1').setEncoding('hex'),
		async (source: AsyncIterable<string>) => {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			hash = (await source.toArray())[0];
		}
	);

	const copyPromise = pipeline(readable, targetStream);
	await Promise.all([hashPromise, copyPromise]);
	return hash;
}

function getPathToFile(id: string, date: Date) {
	const datePath = date.toISOString().split('T', 2)[0];
	return resolve(join(env.DATA_DIR, 'repository', datePath, `${id}.zip`));
}

export { type NewRelease, type Release, type ReleaseFilter, createRelease, listReleases };
