import socketIO from 'socket.io';

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

export const setupGame = (app: Express.Application, players: string[], wordlist: string[] = defaultWordlist) => {
	const io = socketIO(app);

	io.on("connection", (socket) => {
		const userData = socket.request._query as {id: string, name: string, roomNr: number};
		const room = `room-${userData.roomNr}`;

		console.log(userData.roomNr);

		socket.join(room);
		socket.send("connected");

		socket.broadcast.to(room).emit("Connected user", {name: userData.name, id: userData.id});

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
			console.log("draw_start event", event)
			socket.broadcast.to(room).emit("draw_start", {...event, currentPlayer: userData.id});
		});
		
		socket.on("draw_update", (event) => {
			console.log("draw_update", event);
			socket.broadcast.to(room).emit("draw_update", {...event, currentPlayer: userData.id});
		})

		socket.on("draw_end", (event) => {
			console.log("draw_end", event);
			socket.broadcast.to(room).emit("draw_end", {...event, currentPlayer: userData.id});
		})
		

		socket.on("disconnected", () => {
			console.log("User disconnected");
			games[userData.roomNr].players = games[userData.roomNr].players.filter(v => v !== userData.id);
			socket.broadcast.to(room).emit("user_disconnect", userData.id)
		})
		

	})
}