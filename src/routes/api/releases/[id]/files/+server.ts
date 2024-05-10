import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	return new Response('Hello World - This is ' + params.id);
};
