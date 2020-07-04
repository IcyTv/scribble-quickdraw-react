import { Express } from 'express';
import jwt from 'express-jwt';
import { games, DEFAULT_WORDLIST, DEFAULT_TIME, IdToken } from './constants';

export default (app: Express, checkJwt: jwt.RequestHandler): void => {
	// app.get('/api/room/:nr', checkJwt, (req, res) => {
	// 	const user = (req.user as any).sub;
	// 	const name = (req.user as any).nickname;
	// 	const { picture } = req.user as any;
	// 	const roomNr = parseInt(req.params.nr, 10);

	// 	if (rooms[roomNr]) {
	// 		const ret: any = {};
	// 		if (rooms[roomNr].users.filter((v) => v.id === user).length === 0) {
	// 			rooms[roomNr].users.push({
	// 				id: user,
	// 				name,
	// 				picture,
	// 			});
	// 			ret.message = 'Added user to room';
	// 		} else {
	// 			ret.message = 'User already in room';
	// 		}
	// 		res.status(200).setHeader('content-type', 'application/json');
	// 		res.end(
	// 			JSON.stringify({
	// 				...ret,
	// 				room: rooms[roomNr],
	// 			}),
	// 		);
	// 	} else {
	// 		rooms[roomNr] = {
	// 			users: [],
	// 			createdAt: Date.now(),
	// 			isPlaying: false,
	// 		};
	// 		rooms[roomNr].users.push({
	// 			id: user,
	// 			name,
	// 			picture,
	// 		});
	// 		res.status(200).setHeader('content-type', 'application/json');
	// 		res.end(
	// 			JSON.stringify({
	// 				message: 'Created new room',
	// 				room: rooms[roomNr],
	// 			}),
	// 		);
	// 	}
	// });

	// app.get('/api/room/:nr/play', checkJwt, (req, res) => {
	// 	const user = (req.user as any).sub;
	// 	const roomNr = parseInt(req.params.nr, 10);
	// 	const setTo = !!req.query.isPlaying;

	// 	if (rooms[roomNr].users[0].id === user) {
	// 		rooms[roomNr].isPlaying = setTo || true;
	// 		res.status(200).end('Success');
	// 	} else {
	// 		res.status(401).end('You are not the room administrator!');
	// 	}
	// });

	app.get('/api/room/defaultWordlist', checkJwt, (_, res) => {
		console.log(DEFAULT_WORDLIST);
		res.setHeader('content-type', 'application/json');
		res.end(JSON.stringify({ wordlist: DEFAULT_WORDLIST }));
	});

	app.get('/api/room/defaultTime', checkJwt, (_, res) => {
		res.setHeader('content-type', 'application/json');
		res.end(JSON.stringify({ defaultTime: DEFAULT_TIME }));
	});

	app.get('/api/room/isAdmin', checkJwt, (req, res) => {
		const { roomId } = req.query;
		if (!roomId) {
			res.status(400).end('No roomId specified');
			return;
		}

		if (!games[roomId as string]) {
			res.status(400).end('Room does not exist');
			return;
		}

		const { admin } = games[roomId as string];

		res.setHeader('content-type', 'application/json');
		console.log('isAdmin', admin === ((req.user as unknown) as IdToken).sub);
		res.end(JSON.stringify({ isAdmin: admin === ((req.user as unknown) as IdToken).sub }));
	});

	app.get('/api/room/:nr', checkJwt, (req, res) => {
		const roomId = req.params.nr;

		if (games[roomId] && !games[roomId].started) {
			res.end({ started: false });
		} else {
			res.end({ started: true });
		}
	});
};
