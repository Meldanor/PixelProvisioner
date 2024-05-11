import { getPathToRelease, getRelease } from '$lib/server/releases/service';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createReadableStream } from '@sveltejs/kit/node';

export const GET: RequestHandler = async ({ params, request }) => {
	// The ids are 32 chars long
	if (params.id && params.id.length !== 32) {
		error(404, { message: `No release with id '${params.id}' found` });
	}
	const release = await getRelease(params.id);
	if (!release) {
		error(404, { message: `No release with id '${params.id}' found` });
	}

	const ifNoneMatch = request.headers.get('if-none-match');
	if (ifNoneMatch && ifNoneMatch === release.sha1) {
		return new Response(null, { status: 304 });
	}

	const fileStream = createReadableStream(getPathToRelease(release));

	return new Response(fileStream, {
		status: 200,
		headers: {
			'Content-Type': 'application/octet-stream',
			'Cache-Control': 'max-age=0',
			'Content-Disposition': 'attachment;filename='+release.file.name,
			'Content-Length': release.file.size.toString(),
			Etag: release.sha1
		}
	});
};
