/* eslint-disable import/prefer-default-export */
import { readFile, readFileSync } from 'fs';
import { promisify } from 'util';
import { games, User, DEFAULT_TIME } from './constants';

const getId = (player: User | string): string => {
	if (typeof player === 'string') {
		return player;
	}
	return player.id;
};

export const addRoom = (roomId: string, player: User): void => {
	games[roomId] = {
		currentPlayer: player.id,
		admin: player.id,
		currentWord: '',
		lines: [],
		players: [],
		time: DEFAULT_TIME,
		wordlist: [],
	};
};

export const changeWordlist = (roomId: string, wordlist: string[]): void => {
	games[roomId].wordlist = wordlist.slice();
};

export const addToWordlist = (roomId: string, word: string): void => {
	games[roomId].wordlist.push(word);
};

export const removeFromWordlist = (roomId: string, word: number | string): void => {
	if (typeof word === 'string') {
		const ind = games[roomId].wordlist.indexOf(word);
		if (ind < 0) {
			return;
		}
		games[roomId].wordlist.splice(ind, 1);
	} else {
		games[roomId].wordlist.splice(word, 1);
	}
};

export const addPlayer = (roomId: string, player: User): void => {
	games[roomId].players.push(player);
};

export const removePlayer = (roomId: string, player: User | string): void => {
	const id = getId(player);
	const ind = games[roomId].players.findIndex((v) => v.id === id);
	if (ind < 0) {
		throw new Error('No player with that id');
	} else {
		games[roomId].players.splice(ind, 1);
	}
};

export const changeAdmin = (roomId: string, admin: User | string): void => {
	const id = getId(admin);
	games[roomId].admin = id;
};

export const nextPlayer = (roomId: string): string => {
	const { currentPlayer, players } = games[roomId];
	const ind = games[roomId].players.findIndex((v) => v.id === currentPlayer);

	if (ind < 0) {
		games[roomId].currentPlayer = players[0].id;
		throw new Error('Current player not found, setting to player 1!');
	}

	const next = (ind + 1) % players.length;
	games[roomId].currentPlayer = players[next].id;
	return players[next].id;
};

export const setTime = (roomId: string, time: number): void => {
	games[roomId].time = time;
};

export const setCurrentWord = (roomId: string, word: string): void => {
	games[roomId].currentWord = word;
};

export const deleteGame = (roomId: string): void => {
	delete games[roomId];
};

export const deleteIfEmpty = (roomId: string): void => {
	if (!games[roomId]) {
		return;
	}
	const players = games[roomId].players.length;
	if (players === 0) {
		deleteGame(roomId);
	}
};

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const getPlayerSafeGame = (roomId: string) => {
	const game = games[roomId];

	return {
		currentPlayer: game.currentPlayer,
		admin: game.admin,
		lines: game.lines,
		players: game.players,
		time: game.time,
	};
};

export const setStarted = (roomId: string, started?: boolean): void => {
	games[roomId].started = started;
};

export const getWordlistFromFileAsync = async (file = './server/nounlist.txt') => {
	const fileContent = await promisify(readFile)(file);
	return fileContent.toString('utf-8').split('\n');
};

export const getWordlistFromFile = (file = './server/nounlist.txt') => {
	const fC = readFileSync(file);
	return fC.toString('utf-8').split('\n');
};

export const handleErrors = (socket: SocketIO.Socket) => {
	socket.on('connect_error', (err) => console.error(err));
	socket.on('connect_failed', (err) => console.error(err));
};

export const clearScreen = (roomId: string) => {
	games[roomId].lines = [];
};
