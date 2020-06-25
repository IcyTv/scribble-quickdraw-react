import socketIO from 'socket.io';
import socketioJWT from '@ssnxd/socketio-jwt'
import jwks from 'jwks-rsa'
import jwt from 'express-jwt';

const defaultWordlist = [
	"tree",
	"image",
	"sonic",
	"apple"
]

const DEFAULT_TIME = 60000;
const DEFAULT_TIMEOUT = 200;

interface User {
	id: string;
	name: string;
	picture: string;
	points: number;
}

interface Game {
	currentPlayer: string;
	currentWord: string;
	players: User[];
	wordlist: string[];
	time: number;
	lines: {
		points: {
			x: number;
			y: number;
		}[];
		strokeWidth: number;
		color: string;
	}[];
}

const games: {[roomNr: number]: Game} = {};

export const setupGame = (app: Express.Application, secret:	any, wordlist: string[] = defaultWordlist) => {
	const io = socketIO(app);

	const nextPlayer = (roomNr: number) => {
		console.log("Next player")
		const room = games[roomNr];
		if(room.players.length <= 0) {
			delete games[roomNr];
		} else {
			const cP = room.players.findIndex((v) => v.id === room.currentPlayer);
			const next = (cP + 1) % room.players.length;
			console.log(next);
			games[roomNr].currentPlayer = room.players[next].id;
			io.to(`room-${roomNr}`).emit("initialize", {
				lines: [], currentPlayer: room.players[next].id, time: room.time, users: room.players
			})
			if(room.wordlist.length <= 0) {
				io.to(`room-${roomNr}`).emit("game_done")
			}
		}

	}

	io.on("connection", socketioJWT.authorize({
		secret,
		timeout: 1500
		// audience: process.env.AUTH0_CLIENT_ID,
		// issuer: `https://${process.env.AUTH0_DOMAIN}/`,
		// algorithms: ['RS256']
	})).on("authenticated", (socket: socketIO.Socket & {decoded_token: any}) => {
		const query = socket.request._query as {id: string, name: string, roomNr: number};
		const userData = {
			roomNr: query.roomNr,
			name: socket.decoded_token.nickname,
			id: socket.decoded_token.sub,
			picture: socket.decoded_token.picture,
			points: 0
		}
		console.log(socket.decoded_token)
		const room = `room-${userData.roomNr}`;
		let timer: NodeJS.Timeout;
		let disconnectTimeout: NodeJS.Timeout;
		let hasGuessed = false;

		console.log(userData.roomNr);

		socket.join(room);
		socket.send("connected");

		socket.broadcast.to(room).emit("new_user", userData);

		if(!games[userData.roomNr]) {
			games[userData.roomNr] = {
				currentPlayer: userData.id,
				currentWord: "test",
				lines: [],
				players: [userData],
				time: DEFAULT_TIME,
				wordlist
			}
			socket.emit("initialize", {lines: games[userData.roomNr].lines, currentPlayer: games[userData.roomNr].currentPlayer, time: games[userData.roomNr].time, users: games[userData.roomNr].players})
		} else {
			games[userData.roomNr].players.push(userData);
			socket.emit("initialize", {lines: games[userData.roomNr].lines, currentPlayer: games[userData.roomNr].currentPlayer, time: games[userData.roomNr].time, users: games[userData.roomNr].players})
		}

		const game = games[userData.roomNr];
		let currentTime = game.time;

		socket.on("request_wordlist", () => {
			hasGuessed = false;
			if(game.currentPlayer === userData.id) {
				socket.emit("word_list", game.wordlist)
				console.log("requested wordlist", game.wordlist, userData.id, game.currentPlayer);
			} 
		})

		socket.on("word_select", (word: string) => {
			console.log("word select")
			if(game.wordlist.indexOf(word) < 0) {
				socket.emit("invalid_word");
			} else {
				games[userData.roomNr].currentWord = word;
				games[userData.roomNr].wordlist.splice(game.wordlist.indexOf(game.currentWord), 1);
				timer = setInterval(() => {
					io.in(room).emit("time_step", currentTime);
					currentTime -= 1000;
					if(currentTime < 0) {
						currentTime = game.time;
						clearInterval(timer);
						nextPlayer(userData.roomNr);
					}
				}, 1000)
			}
		})

		socket.on("draw_start", (event) => {
			if(game.currentPlayer === userData.id) {
				socket.broadcast.to(room).emit("draw_start", {...event, currentPlayer: userData.id});
				games[userData.roomNr].lines.push(event);
			}
		});
		
		socket.on("draw_update", (event) => {
			if(game.currentPlayer === userData.id) {
				socket.broadcast.to(room).emit("draw_update", {...event, currentPlayer: userData.id});
				const ind = games[userData.roomNr].lines.length - 1;
				games[userData.roomNr].lines[ind].points.push(...event.points);
			}
		})

		socket.on("draw_end", (event) => {
			if(game.currentPlayer === userData.id) {
				socket.broadcast.to(room).emit("draw_end", {...event, currentPlayer: userData.id});
				const ind = games[userData.roomNr].lines.length - 1;
				games[userData.roomNr].lines[ind].points.push(...event.points);
			}
		})

		socket.on('line_delete', (ev) => {
			if(game.currentPlayer === userData.id) {
				socket.broadcast.to(room).emit('line_delete', {line: ev, currentPlayer: userData.id});
				games[userData.roomNr].lines.splice(ev, 1);
			}
		})

		socket.on("delete_all", () => {
			if(game.currentPlayer === userData.id) {
				socket.broadcast.to(room).emit('delete_all')
				games[userData.roomNr].lines = [];
			}
		})

		socket.on("chat_msg", (msg: string) => {
			if(msg.toLowerCase() === games[userData.roomNr].currentWord) {
				console.log("Word guessed", games[userData.roomNr].currentWord)
				if(!hasGuessed) {
					io.to(room).emit("word_guessed", userData.id, currentTime / 1000);
					userData.points += currentTime / 1000;
					hasGuessed = true;
				}
			}
			io.to(room).emit("chat_msg", {
				user: {
					id: userData.id,
					name: userData.name,
					picture: userData.picture
				},
				message: msg.toLowerCase() === games[userData.roomNr].currentWord? "Guessed it": msg,
				isSolution: msg.toLowerCase() === game.currentWord
			});
		})
		

		socket.on("disconnect", () => {
			disconnectTimeout = setTimeout(() => {
				(games[userData.roomNr] ||{players: []}).players = ((games[userData.roomNr] ||{}).players ||[]).filter(v => v.id !== userData.id);
				socket.broadcast.to(room).emit("user_disconnect", userData.id)
				clearInterval(timer);
				nextPlayer(userData.roomNr);
			}, DEFAULT_TIMEOUT);
		})

		socket.on("reconnect", () => {
			clearTimeout(disconnectTimeout)
		})
		

	})
}