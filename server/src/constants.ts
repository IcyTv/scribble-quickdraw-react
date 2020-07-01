/* eslint-disable import/prefer-default-export */
import jwks from 'jwks-rsa';
import dotenv from 'dotenv';
import { getWordlistFromFile } from './utils';

const result = dotenv.config();

if (result.error) {
	throw result.error;
}

console.log(result.parsed, process.env);

export interface User {
	id: string;
	name: string;
	picture: string;
	points: number;
}

export interface Line {
	points: {
		x: number;
		y: number;
	}[];
	strokeWidth: number;
	color: string;
}

export interface Game {
	currentPlayer: string;
	admin: string;
	currentWord: string;
	players: User[];
	wordlist: string[];
	time: number;
	lines: Line[];
	started?: boolean;
}

export interface IdToken {
	iss: string;
	sub: string;
	aud: string;
	exp: number;
	iat: number;
	email: string;
	nickname: string;
	picture: string;
}

export const secret = jwks.expressJwtSecret({
	cache: true,
	rateLimit: true,
	jwksRequestsPerMinute: 5,
	jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
});

export const games: { [roomId: string]: Game } = {};

// export const DEFAULT_WORDLIST = ['tree', 'image', 'sonic', 'apple'];
export const DEFAULT_WORDLIST = getWordlistFromFile();

export const DEFAULT_TIME = 60000;
export const DEFAULT_TIMEOUT = 1500;
