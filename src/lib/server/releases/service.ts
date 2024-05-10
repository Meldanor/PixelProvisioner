import { randomUUID } from 'crypto';

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
	return {
		id: randomUUID(),
		date: new Date(),
		environment: newRelease.environment,
		type: newRelease.type
	};
}

export { type NewRelease, type Release, createRelease };
