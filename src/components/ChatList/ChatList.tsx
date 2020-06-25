import React, { useEffect, useState } from 'react';
import { Drawer, Button, Avatar } from '@material-ui/core';
import './ChatList.scss';

interface User {
	id: string;
	name: string;
	picture: string;
	points: number;
}

interface ChatListProps {
	socket: SocketIOClient.Socket;
	// uid: string;
	user: User;
	defUsers?: User[];
}

interface Message {
	user: {
		id: string;
		name: string;
		picture: string;
	};
	message: string;
	isSolution?: boolean;
}

const ChatList: React.FC<ChatListProps> = ({ socket, user, defUsers }: ChatListProps) => {
	const [messages, setMessages] = useState<Message[]>([]);

	const [users, setUsers] = useState<User[]>([user]);

	const uid = user.id;

	useEffect(() => {
		socket.on('chat_msg', (ev: Message) => {
			setMessages((m) => m.concat([ev]));
		});
		socket.on('user_disconnect', (id: string) => {
			setUsers((u) => u.filter((v) => v.id !== id));
		});

		socket.on('new_user', (us: any) => {
			setUsers((u) => u.concat([us as any]));
		});

		socket.on('word_guessed', (id: string, points: number) => {
			setUsers((u) => {
				const ind = u.findIndex((us) => us.id === id);
				// eslint-disable-next-line no-param-reassign
				u[ind].points += points;
				return u;
			});
		});
	}, [socket]);

	useEffect(() => {
		if (defUsers) {
			setUsers(defUsers);
		}
	}, [defUsers]);

	const onSubmit = (ev: React.FormEvent<HTMLFormElement>) => {
		ev.preventDefault();
		const inp = (ev.target as HTMLFormElement).querySelector('input[name=msg]') as HTMLInputElement;
		const msg = inp.value;
		if (msg) {
			socket.emit('chat_msg', msg);
			inp.value = '';
		}
	};

	return (
		<Drawer variant="permanent" anchor="right">
			<div className="user-list-container">
				{users.map((u) => {
					return (
						<div className="av" key={`avatar-${u.id}`}>
							<Avatar src={u.picture} imgProps={{ referrerPolicy: 'no-referrer' }} />
							<p>{u.points}</p>
						</div>
					);
				})}
			</div>
			<div className="message-list-container">
				{messages.map((v) => {
					// eslint-disable-next-line no-nested-ternary
					const color = v.isSolution ? 'green' : v.user.id === uid ? 'blue' : 'black';
					return (
						<div key={v.message + v.user.id + Math.floor(Math.random() * 1000)} style={{ color }} className="msg">
							<p>{v.user.name}</p>
							<p>{v.message}</p>
						</div>
					);
				})}
			</div>
			<form className="msg-input" onSubmit={onSubmit}>
				<input type="text" name="msg" />
				<Button type="submit">OK</Button>
			</form>
		</Drawer>
	);
};

export default ChatList;
