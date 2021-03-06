/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable no-restricted-syntax */
import p5Instance from 'p5';
import { parse } from 'query-string';
import React, { useEffect, useMemo, useState } from 'react';
import Sketch from 'react-p5';
import { useLocation, Redirect } from 'react-router';
import simplify from 'simplify-js';
import socketIO from 'socket.io-client';
import ChatList from '../../components/ChatList/ChatList';
import Timer from '../../components/Timer';
import Toolbar from '../../components/Toolbar';
import WordSelection from '../../components/WordSelection/WordSelection';
import { intersects } from '../../utils';
import { useAuth0 } from '../../utils/auth0Hooks';
import './MainGame.scss';

interface User {
	id: string;
	name: string;
	picture: string;
	points: number;
}
interface Line {
	points: {
		x: number;
		y: number;
	}[];
	originalSize: number;
	color?: string;
	strokeWeight?: number;
}

let lines: Line[] = [];

let last: [number, number];

const resized = (p5: p5Instance) => {
	const body = document.querySelector('body');
	const width = body?.clientWidth || p5.windowWidth;
	const height = body?.clientHeight || p5.windowHeight;
	const vMin = Math.min(width, height);
	p5.resizeCanvas(vMin, vMin);
};

const MainGame: React.FC = () => {
	const [currentColor, setCurrentColor] = useState('white');
	const [isPopover, setIsPopover] = useState(false);
	const [strokeWidth, setStrokeWidth] = useState(4);
	const [currentPlayer, setCurrentPlayer] = useState('');
	const [initialTime, setInitialTime] = useState(0);
	const [users, setUsers] = useState<User[]>([]);
	const [word, setWord] = useState('');
	const [redirectTo, setRedirectTo] = useState<string>();
	const location = useLocation();
	const auth0 = useAuth0();

	const userId = useMemo(() => auth0.user.sub, [auth0.user]);
	const userName = useMemo(() => auth0.user.nickname, [auth0.user]);
	const picture = useMemo(() => auth0.user.picture, [auth0]);

	const roomId = useMemo(() => parse(location.search).id, [location.search]);

	const socket = useMemo(
		() =>
			socketIO('/games', {
				query: {
					roomId,
				},
			}),
		[roomId],
	);

	const isFirefox = typeof ((window as unknown) as { InstallTrigger: unknown }).InstallTrigger !== 'undefined';

	useEffect(() => {
		if (isFirefox) {
			console.log('Running firefox workaround');
		}
	});

	let drawInterv: NodeJS.Timeout;
	const buffer: { x: number; y: number }[] = [];

	useEffect(() => {
		// eslint-disable-next-line no-underscore-dangle
		auth0.getIdTokenClaims!().then((id_token) => {
			// eslint-disable-next-line no-underscore-dangle
			socket.emit('authenticate', { token: id_token.__raw });
		});

		socket.on('initialize', (data: { lines: Line[]; currentPlayer: string; time: number; users: User[] }) => {
			lines = data.lines;
			setCurrentPlayer(data.currentPlayer);
			setInitialTime(data.time);
			setUsers(data.users);
			setWord('');
			socket.emit('request_wordlist');
		});

		socket.on('draw_start', (ev: { currentPlayer: string } & Line) => {
			// Probably unnecessary
			if (ev.currentPlayer !== userId) {
				lines.push({
					...ev,
				});
			}
		});

		socket.on('draw_update', (ev: { currentPlayer: string; points: Line['points'] }) => {
			if (ev.currentPlayer !== userId) {
				// lines[lines.length - 1].points = lines[lines.length - 1].points.concat(ev.points);
				lines[lines.length - 1].points.push(...ev.points);
			}
		});

		socket.on('draw_end', (ev: { currentPlayer: string; points: Line['points'] }) => {
			if (ev.currentPlayer !== userId) {
				// lines[lines.length - 1].points = simplify(lines[lines.length - 1].points.concat(ev.points));
				lines[lines.length - 1].points.push(...ev.points);
			}
		});

		socket.on('line_delete', (ev: { index: number; currentPlayer: string }) => {
			if (ev.currentPlayer !== userId) {
				lines.splice(ev.index, 1);
			}
		});

		socket.on('delete_all', () => {
			lines.splice(0, lines.length);
		});

		socket.on('redirect_room', (rid?: string) => {
			if (rid) {
				setRedirectTo('/room');
			} else {
				setRedirectTo(`/room?id=${rid}`);
			}
		});
	}, [auth0.getIdTokenClaims, socket, userId]);

	const touchStarted = (p5: p5Instance) => {
		if (currentPlayer !== userId) {
			return;
		}
		if (!isPopover && currentColor !== 'magic-eraser') {
			lines.push({ points: [{ x: p5.mouseX, y: p5.mouseY }], color: currentColor, strokeWeight: strokeWidth, originalSize: p5.width });
			socket.emit('draw_start', { points: [{ x: p5.mouseX, y: p5.mouseY }], color: currentColor, strokeWeight: strokeWidth, originalSize: p5.width });
			drawInterv = setInterval(() => {
				if (buffer.length > 0) {
					socket.emit('draw_update', { points: simplify(buffer) });
					buffer.splice(0, buffer.length);
				}
			}, 25);
		}
		last = [p5.mouseX, p5.mouseY];
	};

	const setup = (p5: p5Instance) => {
		const body = document.querySelector('body');
		const width = body?.clientWidth || p5.windowWidth;
		const height = body?.clientHeight || p5.windowHeight;
		const vMin = Math.min(width, height);
		p5.createCanvas(vMin, vMin);
	};

	const touchMoved = (p5: p5Instance) => {
		if (currentPlayer !== userId) {
			return;
		}
		if (!isPopover && currentColor !== 'magic-eraser') {
			lines[lines.length - 1].points.push({ x: p5.mouseX, y: p5.mouseY });
			buffer.push({ x: p5.mouseX, y: p5.mouseY });
		} else if (currentColor === 'magic-eraser' && last) {
			for (let i = 0; i < lines.length; i++) {
				const l = lines[i];
				if (intersects(l.points, last[0], last[1], p5.mouseX, p5.mouseY)) {
					lines.splice(i, 1);
					socket.emit('line_delete', i);
				}
			}
		}
		last = [p5.mouseX, p5.mouseY];
	};

	const touchEnded = () => {
		if (currentPlayer !== userId) {
			return;
		}
		if (!isPopover && currentColor !== 'magic-eraser') {
			const line = lines[lines.length - 1].points;
			const simplified = simplify(line);
			lines[lines.length - 1].points = simplified;
			clearInterval(drawInterv);
			// if (buffer.length > 0) {
			socket.emit('draw_end', { points: simplify(buffer) });
			buffer.splice(0, buffer.length);
			// }
		}
	};

	const draw = useMemo(
		() => (p5: p5Instance) => {
			p5.background('#333333');
			p5.fill(255);
			if (word) {
				p5.noStroke();
				p5.textSize(20);
				p5.textAlign(p5.CENTER);
				p5.text(word.toUpperCase(), p5.width / 2, 20);
			}
			p5.noFill();
			for (const f of lines) {
				p5.stroke(f.color !== 'eraser' ? f.color || 'white' : '#333333');
				p5.strokeWeight(f.strokeWeight || 4);
				p5.scale(p5.width / f.originalSize);
				p5.beginShape();
				p5.vertex(f.points[0].x, f.points[0].y);
				for (const p of f.points) {
					p5.curveVertex(p.x, p.y);
				}
				p5.vertex(f.points[f.points.length - 1].x, f.points[f.points.length - 1].y);
				p5.endShape();
				p5.scale(f.originalSize / p5.width);
			}
		},
		[word],
	);

	const onWordSelect = (w: string) => {
		lines = [];
		setWord(w);
	};

	if (redirectTo) {
		return <Redirect to={redirectTo} />;
	}

	return (
		<div className="main-game">
			<ChatList socket={socket} user={{ id: userId, name: userName, picture, points: 0 }} defUsers={users} />
			<Timer socket={socket} initialTime={initialTime} />
			<WordSelection socket={socket} onWordSelect={onWordSelect} defWord={word} />
			{!isFirefox ? (
				<Sketch setup={setup} draw={draw} touchStarted={touchStarted} touchMoved={touchMoved} windowResized={resized} touchEnded={touchEnded} />
			) : (
				<Sketch setup={setup} draw={draw} mousePressed={touchStarted} mouseDragged={touchMoved} windowResized={resized} mouseReleased={touchEnded} />
			)}
			<Toolbar
				currentlyActive={currentColor}
				colors={['white', 'black', 'green', 'red', 'blue', 'yellow']}
				onPopoverStateChange={(open) => setIsPopover(open)}
				onColorChange={(color) => {
					setCurrentColor(color);
				}}
				onStrokeWidthChanged={(sw) => setStrokeWidth(sw)}
				onDeleteAll={() => {
					lines.splice(0, lines.length);
					socket.emit('delete_all');
				}}
				disabled={currentPlayer !== userId}
			/>
		</div>
	);
};

export default MainGame;
