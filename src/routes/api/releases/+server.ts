import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	createRelease,
	listReleases,
	type ReleaseFilter,
	type ReleaseMetadata
} from '$lib/server/releases/service';
import { env } from '$env/dynamic/private';

const allowedOperatingSystems = new Set<string>(['windows', 'linux', 'osx']);
const allowedArchitectures = new Set<string>(['x86', 'arm64']);
const allowedTypes = new Set<string>(['nightly', 'feature', 'release']);

export const GET: RequestHandler = async ({ url: { searchParams } }) => {
	const filter: ReleaseFilter = {
		architecture: searchParams.get('architecture'),
		type: searchParams.get('type'),
		operatingSystem: searchParams.get('operatingSystem'),
		dateAfter: searchParams.get('dateAfter'),
		dateBefore: searchParams.get('dateBefore')
	};
	const releases = await listReleases(filter);
	return json({
		entries: releases
	});
};

export const POST: RequestHandler = async ({ request }) => {
	if (request.headers.get('x-upload-token') !== env.X_UPLOAD_TOKEN) {
		error(401, { message: 'Missing or invalid upload token' });
	}
	if (!request.headers.get('content-type')?.includes('multipart/form-data')) {
		error(400, { message: 'only multipart/form-data is supported' });
	}
	const formData = await request.formData();
	const { operatingSystem, architecture, type, file, metadata } = validateFormData(formData);

	const createdRelease = await createRelease({
		type,
		file,
		environment: {
			architecture,
			operatingSystem
		},
		metadata
	});
	return json(createdRelease, { status: 201 });
};

const validateFormData = (data: FormData) => {
	const operatingSystem = data.get('operatingSystem') as string;
	if (!operatingSystem || !allowedOperatingSystems.has(operatingSystem)) {
		error(400, { message: 'Operating system must be one of ' + [...allowedOperatingSystems] });
	}

	const architecture = data.get('architecture') as string;
	if (!architecture || !allowedArchitectures.has(architecture)) {
		error(400, { message: 'Architecture must be one of ' + [...allowedArchitectures] });
	}

	const type = data.get('type') as string;
	if (!type || !allowedTypes.has(type)) {
		error(400, { message: 'Type must be one of ' + [...allowedTypes] });
	}

	const file = data.get('file') as File;
	if (!file || !file.name || file.name === '') {
		error(400, { message: 'File is empty or missing' });
	}

	if (file.type !== 'application/zip') {
		error(400, { message: 'File content-type is not application/zip' });
	}

	const metadata: ReleaseMetadata = {};

	if (data.get('metadata.version')) {
		metadata.version = data.get('metadata.version') as string;
	}
	if (data.get('metadata.name')) {
		metadata.name = data.get('metadata.name') as string;
	}
	if (data.get('metadata.commitSha')) {
		metadata.commitSha = data.get('metadata.commitSha') as string;
	}
	const buildDateString = data.get('metadata.buildDate') as string;
	if (buildDateString) {
		metadata.buildDate = new Date(buildDateString);
		if (Number.isNaN(metadata.buildDate.valueOf())) {
			error(400, `Invalid buildDate string: '${buildDateString}'`);
		}
		if (metadata.buildDate.getTime() > new Date().getTime()) {
			error(
				400,
				`Invalid buildDate '${buildDateString}'. It is after now '${new Date().toISOString()}'`
			);
		}
	}

	const changelogString = data.get('metadata.changelog') as string;
	if (changelogString) {
		try {
			metadata.changelog = JSON.parse(changelogString);
		} catch (err) {
			error(400, 'Invalid changelog. Must be a JSON array');
		}
		if (!Array.isArray(metadata.changelog)) {
			error(400, 'Invalid changelog. Must be a JSON array');
		}
	}

	return { operatingSystem, architecture, type, file, metadata };
};
