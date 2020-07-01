/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
import { Avatar, Button, Grid, IconButton, Input, InputLabel, List, ListItem, ListItemAvatar } from '@material-ui/core';
import copy from 'clipboard-copy';
import { parse } from 'query-string';
import React, { useEffect, useMemo, useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { Redirect, useLocation } from 'react-router';
import socketIo from 'socket.io-client';
import { useAuth0 } from '../../utils/auth0Hooks';
import { get } from '../../utils/requests';
import './RoomPage.scss';

interface User {
	name: string;
	id: string;
	picture: string;
}

const RoomPage: React.FC = () => {
	const location = useLocation();
	const auth0 = useAuth0();
	const [recievedRoomId, setRecievedRoomId] = useState<string>();
	const roomId = useMemo(() => parse(location.search).id, [location.search]);
	const [room, setRoom] = useState<{ users: User[] }>({
		users: [],
	});
	const [error, setError] = useState<string>();
	const [redirectTo, setRedirectTo] = useState('');

	const [defaultTime, setDefaultTime] = useState<number>();
	const [defaultWordlist, setDefaultWordlist] = useState<string[]>([]);
	const [customWordlist, setCustomWordlist] = useState<string[]>([]);
	const [addWordError, setAddWordError] = useState<string>();
	const [isAdmin, setIsAdmin] = useState(false);

	const socket = useMemo(() => {
		console.log('Memo');
		const query: { roomId?: string } = {};
		if (roomId) {
			query.roomId = roomId as string;
		}
		return socketIo('/rooms', {
			query,
		});
		// eslint-disable-next-line
	}, []);

	useEffect(() => {
		if (!roomId && !recievedRoomId) {
			return;
		}
		const func = async (): Promise<void> => {
			const { data } = await get(`/api/room/isAdmin?roomId=${roomId || recievedRoomId}`, {}, auth0);
			setIsAdmin(data.isAdmin);
		};
		func();
	}, [auth0, recievedRoomId, roomId]);

	useEffect(() => {
		if (!isAdmin) {
			return;
		}
		const tProm = get('/api/room/defaultTime', {}, auth0);
		const wProm = get('/api/room/defaultWordlist', {}, auth0);
		Promise.all([tProm, wProm]).then((v) => {
			const t = v[0].data;
			const w = v[1].data;

			setDefaultTime(t.defaultTime / 1000);
			setDefaultWordlist(w.wordlist);

			// Doing this, because maybe later store preferred times/wordlists etc...
			socket.emit('set_wordlist', w.wordlist);
			// socket.emit('set_time', t.defaultTime); // But sending this sets the time to 40 minutes!
		});
	}, [auth0, isAdmin, socket]);

	useEffect(() => {
		const func = async (): Promise<void> => {
			const token = await auth0.getIdTokenClaims!();
			setRoom((r) => {
				console.log('Token sub?', token.sub);
				if (r.users.findIndex((v) => v.id === token.sub) >= 0) {
					return {
						...r,
						users: r.users.concat([
							{
								id: 'me',
								name: token.nickname!,
								picture: token.picture!,
							},
						]),
					};
				}

				return r;
			});
		};
		func();
	}, [auth0.getIdTokenClaims]);

	useEffect(() => {
		auth0.getIdTokenClaims!().then((idToken) => {
			// eslint-disable-next-line no-underscore-dangle
			socket.emit('authenticate', { token: idToken.__raw });
		});
		socket.on('room_id', (id: string) => {
			setRecievedRoomId(id);
		});
		socket.on('error', (err: { msg: string }) => {
			setError(err.msg);
		});
		socket.on('new_player', (user: User) => {
			console.log('new user', user);
			setRoom((r) => ({ ...r, users: r.users.concat([user]) }));
		});
		socket.on('room_start', (id: string) => {
			setRedirectTo(`/game?id=${id}`);
		});
		socket.on('set_wordlist', (wordlist: string[]) => {
			setDefaultWordlist(wordlist);
		});
		socket.on('wordlist_add', (word: string) => {
			setCustomWordlist((wl) => {
				wl.push(word);
				return [...wl];
			});
		});
		socket.on('set_time', (t: number) => {
			setDefaultTime(t);
		});
		socket.on('set_players', (players: User[]) => {
			console.log('set_players', players);
			setRoom((r) => {
				const tmp = r;
				tmp.users = players;
				return { ...tmp };
			});
		});
		socket.on('wordlist_remove', (index: number) => {
			setCustomWordlist((wl) => {
				wl.splice(index, 1);
				return [...wl];
			});
		});
	}, [auth0.getIdTokenClaims, socket]);

	if (redirectTo !== '') {
		return <Redirect to={redirectTo} />;
	}

	if (error) {
		return (
			<div className="room-page">
				<div className="error">
					<h1>{error}</h1>
				</div>
			</div>
		);
	}

	if (room.users.length <= 0 && !defaultTime && !defaultWordlist) {
		return (
			<div className="room-page">
				<p>Loading room...</p>
			</div>
		);
	}

	const grid = (
		<Grid container spacing={1} className="wordlist-container">
			{customWordlist.map((v) => {
				const remove = () => {
					setCustomWordlist((wl) => {
						const ind = wl!.indexOf(v);
						socket.emit('wordlist_delete', ind);
						wl!.splice(ind, 1);
						return [...wl!];
					});
				};
				return (
					<Grid item xs key={`li-${v}`} className="grid-item">
						<p>{v}</p>
						{isAdmin && (
							<IconButton onClick={remove} size="small">
								<FaTimes color="red" />
							</IconButton>
						)}
					</Grid>
				);
			})}
		</Grid>
	);

	const adminHTML =
		isAdmin && defaultTime && defaultWordlist ? (
			<div className="admin">
				<InputLabel htmlFor="time-input">Time</InputLabel>
				<Input
					type="number"
					id="time-input"
					defaultValue={defaultTime}
					endAdornment="s"
					onChange={(ev) => {
						const time = ev.currentTarget.value;
						console.log(`setting time to ${time}`);
						socket.emit('set_time', time);
					}}
				/>
				{grid}
				<form
					className="add-words-form"
					onSubmit={(ev) => {
						ev.preventDefault();
						const inp = document.getElementById('add-words') as HTMLInputElement;
						if (inp.value === '') {
							return;
						}

						setCustomWordlist((wl) => {
							const isNotInDefault = defaultWordlist.indexOf(inp.value) < 0;
							if (wl!.indexOf(inp.value) < 0 && isNotInDefault) {
								socket.emit('wordlist_add', inp.value);
								wl!.push(inp.value);
								setAddWordError(undefined);
								return [...wl!];
							}
							setAddWordError(`This word is already in the${isNotInDefault ? '' : ' default'} list!`);

							return wl;
						});
						inp.value = '';
					}}>
					<InputLabel htmlFor="add-words">Add word</InputLabel>
					<Input error={!!addWordError} id="add-words" type="text" />
					<InputLabel htmlFor="add-words" hidden={!addWordError} className="add-word-error-label">
						{addWordError}
					</InputLabel>
					<Button type="submit">Ok</Button>
				</form>
			</div>
		) : (
			<>
				{defaultTime && <p>Time to draw {defaultTime}s</p>}
				{grid}
			</>
		);

	return (
		<div className="room-page">
			<h2>Room</h2>
			<List>
				{room.users.map((v) => {
					return (
						<ListItem key={`user-${v.name}`}>
							<ListItemAvatar>
								<Avatar src={v.picture} alt={v.name} imgProps={{ referrerPolicy: 'no-referrer' }} />
							</ListItemAvatar>
							<p>{v.name}</p>
						</ListItem>
					);
				})}
			</List>
			{adminHTML}
			<div className="bottom">
				{(roomId || recievedRoomId) && (
					<p onClick={() => copy(`${window.location.protocol}//${window.location.host}/room?id=${roomId || recievedRoomId}`)}>
						{window.location.protocol}//{window.location.host}/room?id={roomId || recievedRoomId}
					</p>
				)}
				<Button
					onClick={() => {
						if (isAdmin) {
							socket.emit('set_wordlist', defaultWordlist.concat(customWordlist));
						}
						socket.emit('room_start');
						// setRedirectTo(`/game?roomId=${roomId}`);
					}}>
					Start
				</Button>
			</div>
		</div>
	);
};

export default RoomPage;
