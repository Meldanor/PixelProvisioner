import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createRelease } from '$lib/server/releases/service';

const allowedOperatingSystems = new Set<string>(['windows', 'linux', 'osx']);
const allowedArchitectures = new Set<string>(['x86', 'arm']);
const allowedTypes = new Set<string>(['nightly', 'feature', 'release']);

export const GET: RequestHandler = async () => {
	return new Response('Hello World');
};

export const POST: RequestHandler = async ({ request }) => {
	if (!request.headers.get('content-type')?.includes('multipart/form-data')) {
		error(400, { message: 'only multipart/form-data is supported' });
	}
	const formData = await request.formData();
	const { operatingSystem, architecture, type, file } = validateFormData(formData);

	const createdRelease = await createRelease({
		type,
		file,
		environment: {
			architecture,
			operatingSystem
		}
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

	return { operatingSystem, architecture, type, file };
};
