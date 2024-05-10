import { connect } from '$lib/server/database/service';

console.log('Connecting to database...');

await connect();
console.log('Connection to database established!');
