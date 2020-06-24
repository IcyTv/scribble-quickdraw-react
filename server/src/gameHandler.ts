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

interface Game {
	currentPlayer: string;
	currentWord: string;
	players: string[];
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
			picture: socket.decoded_token.picture
		}
		console.log(socket.decoded_token)
		const room = `room-${userData.roomNr}`;

		console.log(userData.roomNr);

		socket.join(room);
		socket.send("connected");

		socket.broadcast.to(room).emit("new_user", userData);

		if(!games[userData.roomNr]) {
				games[userData.roomNr] = {
					currentPlayer: userData.id,
					currentWord: "test",
					lines: [],
					players: [userData.id]
				}
		} else {
			games[userData.roomNr].players.push(userData.id);
		}

		socket.on("draw_start", (event) => {
			socket.broadcast.to(room).emit("draw_start", {...event, currentPlayer: userData.id});
		});
		
		socket.on("draw_update", (event) => {
			socket.broadcast.to(room).emit("draw_update", {...event, currentPlayer: userData.id});
		})

		socket.on("draw_end", (event) => {
			socket.broadcast.to(room).emit("draw_end", {...event, currentPlayer: userData.id});
		})

		socket.on('line_delete', (ev) => {
			socket.broadcast.to(room).emit('line_delete', {line: ev, currentPlayer: userData.id});
		})

		socket.on("delete_all", () => {
			socket.broadcast.to(room).emit('delete_all')
		})

		socket.on("chat_msg", (msg) => {
			socket.broadcast.to(room).emit("chat_msg", {
				user: {
					id: userData.id,
					name: userData.name,
					picture: userData.picture
				},
				message: msg
			});
		})
		

		socket.on("disconnect", () => {
			console.log("User disconnected")
			games[userData.roomNr].players = games[userData.roomNr].players.filter(v => v !== userData.id);
			socket.broadcast.to(room).emit("user_disconnect", userData.id)
		})
		

	})
}