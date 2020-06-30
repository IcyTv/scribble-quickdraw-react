/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import express from 'express';
import helmet from 'helmet';
import jwt from 'express-jwt';
import dotenv from 'dotenv';
import cors from 'cors'; // Development
import bodyParser from 'body-parser';
import pino from 'express-pino-logger';
import SocketIO from 'socket.io';
import errorhandler from 'errorhandler';
import http from 'http';
import { setupGame } from './gameHandler';
import setupRooms from './roomHandler';
import setupAPI from './api';
import setupStatics from './statics';
import { secret } from './constants';

dotenv.config();

const checkJwt = jwt({
	secret,
	audience: process.env.AUTH0_CLIENT_ID,
	issuer: `https://${process.env.AUTH0_DOMAIN}/`,
	algorithms: ['RS256'],
});

const app = express();

app.use(helmet());

if (process.env.NODE_ENV === 'development') {
	app.use(cors());
	app.use(errorhandler());
}

app.use(bodyParser.urlencoded({ extended: false }));
app.use(pino());

setupAPI(app, checkJwt);
setupStatics(app);

app.use((err: any, req: any, res: any, next: any) => {
	if (err.constructor.name === 'UnauthorizedError') {
		console.warn('Tried to access route without authorization');
		res.status(401).send('invalid token...');
	} else {
		console.error(err);
		next();
	}
});

// const server = app.listen(8080, () => console.log('listening'));
const server = http.createServer(app);

const io = SocketIO(server);

setupGame(io, secret);
setupRooms(io, secret);

server.listen(8080, () => console.log('Started server'));
