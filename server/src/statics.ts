import express, { Express } from 'express';
import path from 'path';

export default (app: Express): void => {
	if (process.argv.indexOf('--folder') >= 0) {
		const folder = process.argv[process.argv.indexOf('--folder') + 1];
		console.log(`serving ${process.cwd()}${folder}`);
		app.get('/static/*', express.static(path.join(process.cwd(), 'build'), { fallthrough: true }));
		app.get(['/', '/*'], (req, res) => {
			res.sendFile(path.join(process.cwd(), 'build', 'index.html'));
		});
	}
};
