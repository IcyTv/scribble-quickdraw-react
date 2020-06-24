import express from 'express';
import helmet from 'helmet';
import jwt from 'express-jwt';
import jwks from 'jwks-rsa';
import dotenv from 'dotenv';
import cors from 'cors'; //Development
import bodyParser from 'body-parser';
import pino from 'express-pino-logger';
import { setupGame } from './gameHandler';
import path from 'path';

dotenv.config();


interface User {
	id: string;
	name: string;
	picture?: string;
}

interface Room {
	users: User[];
	createdAt: number;
	isPlaying: boolean;
}

interface RoomList {
	[nr: number]:  Room;
}

const rooms: RoomList = {};

const secret = jwks.expressJwtSecret({
		cache: true,
		rateLimit: true,
		jwksRequestsPerMinute: 5,
		jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`
	});

const checkJwt = jwt({
	secret,
	audience: process.env.AUTH0_CLIENT_ID,
	issuer: `https://${process.env.AUTH0_DOMAIN}/`,
	algorithms: ['RS256']
})

const app = express();

app.use(helmet());
if(process.env.NODE_ENV === 'development') {
	app.use(cors());
}

app.use(bodyParser.urlencoded({ extended: false }));
app.use(pino())

app.get("/api/room/:nr", checkJwt, (req, res) => {
	const user = (req.user as any).sub;
	const name = (req.user as any).nickname;
	const picture = (req.user as any).picture;
	const roomNr = parseInt(req.params.nr);

	if(rooms[roomNr]) {
		const ret: any = {};
		if(rooms[roomNr].users.filter(v => v.id === user).length === 0) {
			rooms[roomNr].users.push({
				id: user,
				name,
				picture
			});
			ret.message = "Added user to room";
		} else {
			ret.message = "User already in room";
		}
		res.status(200).setHeader("content-type", "application/json");
		res.end(JSON.stringify({
			...ret,
			room: rooms[roomNr]
		}))
	} else {
		rooms[roomNr] = {
			users: [],
			createdAt: Date.now(),
			isPlaying: false
		}
		rooms[roomNr].users.push({
			id: user,
			name,
			picture
		});
		res.status(200).setHeader("content-type", "application/json");
		res.end(JSON.stringify({
			message: 'Created new room',
			room: rooms[roomNr]
		}))
	}
})

app.get("/api/room/:nr/play", checkJwt, (req, res) => {
	const user = (req.user as any).sub;
	const roomNr = parseInt(req.params.nr);
	const setTo = !!req.query.isPlaying;

	if(rooms[roomNr].users[0].id === user) {
		rooms[roomNr].isPlaying = setTo || true;
		res.status(200).end("Success");
	} else {
		res.status(401).end("You are not the room administrator!");
	}

})

app.use((err: any, req: any, res: any, next: any) => {
	if(err.constructor.name === 'UnauthorizedError') {
		res.status(401).send("invalid token...");
	} else {
		console.error(err);
		next();
	}
})

if (process.argv.indexOf("--folder") >= 0) {
	const folder = process.argv[process.argv.indexOf('--folder') + 1];
	console.log("Test, folder?")
	console.log("serving " + process.cwd() + folder);
	console.log(path.join(process.cwd(), "build", "static"))
	app.get("/static/*", express.static(path.join(process.cwd(), 'build'), {fallthrough: true}))
	app.get(["/", "/*"], (req, res) => {
		res.sendFile(path.join(process.cwd(), 'build', 'index.html'))
	})
	// app.use("/*", express.static(process.argv[process.argv.indexOf('--folder') + 1]));
} else  {
	console.log("argv", process.argv)
}

// app.listen(8080, () => {
// 	console.log("Started server");
// })

const server = app.listen(8080, () => console.log("listening"));

setupGame(server, secret)

// http.createServer(http).listen(8080, () => console.log("Started"))