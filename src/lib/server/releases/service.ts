import { getDb } from '$lib/server/database/service';

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
	return {
		id: newDocument._id,
		...document
	};
}

export { type NewRelease, type Release, createRelease };
