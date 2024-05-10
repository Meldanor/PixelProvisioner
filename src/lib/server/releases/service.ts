import { env } from '$env/dynamic/private';
import { getDb } from '$lib/server/database/service';
import { createWriteStream } from 'fs';
import { mkdir } from 'fs/promises';
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
	id: string;
	date: Date;
	environment: {
		operatingSystem: string;
		architecture: string;
	};
	type: string;
}

async function createRelease(newRelease: NewRelease): Promise<Release> {
	const document = {
		date: new Date(),
		environment: newRelease.environment,
		type: newRelease.type
	};
	const newDocument = await getDb().insertAsync(document);
	const release = {
		id: newDocument._id,
		...document
	};
	await storeFile(release, newRelease.file);
	return release;
}

async function storeFile(release: Release, file: File) {
	const targetPath = getPathToFile(release);
	await mkdir(dirname(targetPath), { recursive: true });

	// The typing is wrong because it does not support generics in its typing - the function is working
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore ts 2551
	const readable = Readable.fromWeb(file.stream());
	readable.pipe(createWriteStream(targetPath));
}

function getPathToFile(release: Release) {
	const datePath = release.date.toISOString().split('T', 2)[0];
	return resolve(join(env.DATA_DIR, 'repository', datePath, `${release.id}.zip`));
}

export { type NewRelease, type Release, createRelease };
