import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	return new Response('Hello World');
};

export const POST: RequestHandler = async () => {
	return new Response('Hello World - This is Post', {
		status: 201
	});
};
