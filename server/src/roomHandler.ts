/* eslint-disable no-console */
import socketioJWT from '@ssnxd/socketio-jwt';
import SocketIO from 'socket.io';
import { v4 as uuid } from 'uuid';
import { games, User, IdToken, DEFAULT_TIMEOUT } from './constants';
import { addRoom, deleteIfEmpty, removePlayer, setStarted, changeWordlist, addToWordlist, removeFromWordlist, setTime, addPlayer, handleErrors } from './utils';

const generateRoomId = (admin: User): string => {
	const roomIdInUse = Object.keys(games);
	let gen = encodeURIComponent(uuid());
	// eslint-disable-next-line no-loop-func
	while (roomIdInUse.indexOf(gen) >= 0) {
		gen = encodeURIComponent(uuid());
	}

	addRoom(gen, admin);
	return gen;
};

export const getRoomAdmin = (rid: string): string => {
	return games[rid].admin;
};

export default (app: SocketIO.Server, secret: unknown): void => {
	const io = app.of('/rooms');

	io.on(
		'connection',
		socketioJWT.authorize({
			secret: secret as string,
			timeout: 1500,
			required: true,
		}),
	).on('authenticated', (socket: SocketIO.Socket & { decoded_token: IdToken }) => {
		const user = socket.decoded_token;
		const converted: User = {
			id: user.sub,
			name: user.nickname,
			picture: user.picture,
			points: 0,
		};
		console.log(user);
		// eslint-disable-next-line no-underscore-dangle
		let { roomId } = socket.request._query;
		let disconnectTimeout: NodeJS.Timeout;

		if (!roomId || roomId === 'undefined') {
			const ret = generateRoomId(converted);
			roomId = ret;
			console.log('New Room', roomId);
			socket.emit('room_id', roomId);
		} else if (Object.keys(games).indexOf(roomId) < 0) {
			socket.emit('error', { msg: 'invalid room!' });
			socket.disconnect();
			return;
		}

		const admin = getRoomAdmin(roomId);

		const room = `wait-${roomId}`;
		socket.join(room);
		socket.emit('set_wordlist', games[roomId].wordlist);
		socket.broadcast.to(room).emit('new_player', {
			name: user.nickname,
			id: user.sub,
			picture: user.picture,
		});
		addPlayer(roomId, converted);

		socket.emit('set_players', games[roomId].players);

		socket.on('room_start', () => {
			console.log('room_start', user.sub, admin);
			if (user.sub === admin) {
				io.to(room).emit('room_start', roomId);
				// roomIdInUse[roomIndex].started = true;
				setStarted(roomId, true);
			} else {
				socket.emit('error', { msg: 'insufficient permissions' });
			}
		});

		socket.on('set_wordlist', (wordlist: string[]) => {
			changeWordlist(roomId, wordlist);
			socket.broadcast.to(room).emit('set_wordlist', wordlist);
		});

		socket.on('wordlist_add', (word: string) => {
			if (user.sub === admin) {
				addToWordlist(roomId, word);
				socket.broadcast.to(room).emit('wordlist_add', word);
			}
		});

		socket.on('wordlist_delete', (index: number) => {
			if (user.sub === admin) {
				removeFromWordlist(roomId, index);
				socket.broadcast.to(room).emit('wordlist_delete', index);
			}
		});

		socket.on('set_time', (ev: number) => {
			console.log(`Setting time to ${ev}`);
			setTime(roomId, ev * 1000);
			socket.broadcast.emit('set_time', ev);
		});

		socket.on('disconnect', () => {
			disconnectTimeout = setTimeout(() => {
				console.log('User disconnected from rooms');
				if (!games[roomId].started) {
					removePlayer(roomId, user.sub);
					deleteIfEmpty(roomId);
				}
			}, DEFAULT_TIMEOUT);
		});
		socket.on('reconnect', () => {
			clearTimeout(disconnectTimeout);
		});

		handleErrors(socket);
	});
};
