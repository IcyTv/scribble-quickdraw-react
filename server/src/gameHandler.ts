/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
/* eslint-disable import/prefer-default-export */
import socketIO from 'socket.io';
import socketioJWT from '@ssnxd/socketio-jwt';
import { games, DEFAULT_TIMEOUT, User } from './constants';
import { deleteIfEmpty, nextPlayer as changeToNextPlayer, handleErrors } from './utils';

// const games: { [roomId: string]: Game } = {};

export const setupGame = (app: SocketIO.Server, secret: any): void => {
	const io = app.of('/games');

	const nextPlayer = (roomId: string): void => {
		console.log('Next player');
		deleteIfEmpty(roomId);

		const cP = changeToNextPlayer(roomId);

		const room = games[roomId];

		io.to(`room-${roomId}`).emit('initialize', {
			lines: [],
			currentPlayer: cP,
			time: room.time,
			users: room.players,
		});
		if (room.wordlist.length <= 0) {
			io.to(`room-${roomId}`).emit('game_done', {
				scores: room.players.map((v) => ({ id: v.id, points: v.points })).sort((a, b) => a.points - b.points),
			});
		}
	};

	io.on(
		'connection',
		socketioJWT.authorize({
			secret,
			timeout: 1500,
			required: true,
		}),
	).on('authenticated', (socket: socketIO.Socket & { decoded_token: any }) => {
		// eslint-disable-next-line no-underscore-dangle
		const query = socket.request._query as { id: string; name: string; roomId: string };
		const userData: User & { roomNr: string } = {
			roomNr: query.roomId,
			name: socket.decoded_token.nickname,
			id: socket.decoded_token.sub,
			picture: socket.decoded_token.picture,
			points: 0,
		};
		const room = `room-${userData.roomNr}`;
		let timer: NodeJS.Timeout;
		let disconnectTimeout: NodeJS.Timeout;
		let hasGuessed = false;

		socket.join(room);
		socket.send('connected');

		socket.broadcast.to(room).emit('new_user', userData);

		if (!games[userData.roomNr]) {
			socket.emit('redirect_room', userData.roomNr);
			socket.disconnect();
			return;
			// socket.emit('initialize', {
			// 	lines: games[userData.roomNr].lines,
			// 	currentPlayer: games[userData.roomNr].currentPlayer,
			// 	time: games[userData.roomNr].time,
			// 	users: games[userData.roomNr].players,
			// });
		}
		// games[userData.roomNr].players.push(userData);
		socket.emit('initialize', {
			lines: games[userData.roomNr].lines,
			currentPlayer: games[userData.roomNr].currentPlayer,
			time: games[userData.roomNr].time,
			users: games[userData.roomNr].players,
		});

		const game = games[userData.roomNr];
		let currentTime = game.time;

		socket.on('request_wordlist', () => {
			hasGuessed = false;
			if (game.currentPlayer === userData.id) {
				socket.emit('word_list', game.wordlist);
				console.log('requested wordlist', game.wordlist, userData.id, game.currentPlayer);
			}
		});

		socket.on('word_select', (word: string) => {
			console.log('word select');
			if (game.wordlist.indexOf(word) < 0) {
				socket.emit('invalid_word');
			} else {
				games[userData.roomNr].currentWord = word;
				games[userData.roomNr].wordlist.splice(game.wordlist.indexOf(game.currentWord), 1);
				timer = setInterval(() => {
					io.in(room).emit('time_step', currentTime);
					currentTime -= 1000;
					if (currentTime < 0) {
						currentTime = game.time;
						clearInterval(timer);
						nextPlayer(userData.roomNr);
					}
				}, 1000);
			}
		});

		socket.on('draw_start', (event) => {
			if (game.currentPlayer === userData.id) {
				socket.broadcast.to(room).emit('draw_start', { ...event, currentPlayer: userData.id });
				games[userData.roomNr].lines.push(event);
			}
		});

		socket.on('draw_update', (event) => {
			if (game.currentPlayer === userData.id) {
				socket.broadcast.to(room).emit('draw_update', { ...event, currentPlayer: userData.id });
				const ind = games[userData.roomNr].lines.length - 1;
				games[userData.roomNr].lines[ind].points.push(...event.points);
			}
		});

		socket.on('draw_end', (event) => {
			if (game.currentPlayer === userData.id) {
				socket.broadcast.to(room).emit('draw_end', { ...event, currentPlayer: userData.id });
				const ind = games[userData.roomNr].lines.length - 1;
				games[userData.roomNr].lines[ind].points.push(...event.points);
			}
		});

		socket.on('line_delete', (ev) => {
			if (game.currentPlayer === userData.id) {
				socket.broadcast.to(room).emit('line_delete', { line: ev, currentPlayer: userData.id });
				games[userData.roomNr].lines.splice(ev, 1);
			}
		});

		socket.on('delete_all', () => {
			if (game.currentPlayer === userData.id) {
				socket.broadcast.to(room).emit('delete_all');
				games[userData.roomNr].lines = [];
			}
		});

		socket.on('chat_msg', (msg: string) => {
			if (msg.toLowerCase() === games[userData.roomNr].currentWord) {
				console.log('Word guessed', games[userData.roomNr].currentWord);
				if (!hasGuessed) {
					io.to(room).emit('word_guessed', userData.id, currentTime / 1000);
					userData.points += currentTime / 1000;
					hasGuessed = true;
				}
			}
			io.to(room).emit('chat_msg', {
				user: {
					id: userData.id,
					name: userData.name,
					picture: userData.picture,
				},
				message: msg.toLowerCase() === games[userData.roomNr].currentWord ? 'Guessed it' : msg,
				isSolution: msg.toLowerCase() === game.currentWord,
			});
		});

		socket.on('disconnect', () => {
			disconnectTimeout = setTimeout(() => {
				// (games[userData.roomNr] || { players: [] }).players = ((games[userData.roomNr] || {}).players || []).filter((v) => v.id !== userData.id);
				socket.broadcast.to(room).emit('user_disconnect', userData.id);
				clearInterval(timer);
				nextPlayer(userData.roomNr);
			}, DEFAULT_TIMEOUT);
		});

		socket.on('reconnect', () => {
			clearTimeout(disconnectTimeout);
		});

		handleErrors(socket);
	});
};
