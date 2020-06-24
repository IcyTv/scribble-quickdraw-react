import React, { useEffect, useState } from 'react';
import { Drawer, Button } from '@material-ui/core';
import './ChatList.scss';

interface ChatListProps {
	socket: SocketIOClient.Socket;
	uid: string;
}

interface Message {
	user: {
		id: string;
		name: string;
		picture: string;
	};
	message: string;
	isMe: boolean;
}

const ChatList: React.FC<ChatListProps> = ({ socket, uid }) => {
	const [messages, setMessages] = useState<Message[]>([]);

	useEffect(() => {
		socket.on('chat_msg', (ev: Message) => {
			console.log(ev);
			setMessages((m) => m.concat([ev]));
		});
	}, [socket]);

	const onSubmit = (ev: React.FormEvent<HTMLFormElement>) => {
		ev.preventDefault();
		const inp = (ev.target as HTMLFormElement).querySelector('input[name=msg]') as HTMLInputElement;
		const msg = inp.value;
		if (msg) {
			socket.emit('chat_msg', msg);
			setMessages((msgs) =>
				msgs.concat([
					{
						isMe: true,
						message: msg,
						user: {
							id: uid,
							name: 'Me',
							picture: 'test',
						},
					},
				]),
			);
			inp.value = '';
		}
	};

	return (
		<Drawer variant="permanent" anchor="right">
			<div className="message-list-container">
				{messages.map((v) => {
					return (
						<div key={v.message + v.user.id + Math.floor(Math.random() * 1000)} style={{ color: v.isMe ? 'green' : 'black' }} className="msg">
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
