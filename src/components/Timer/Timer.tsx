import React, { useState, useEffect } from 'react';
import './Timer.scss';

interface TimerProps {
	socket: SocketIOClient.Socket;
	initialTime: number;
}

const msToTime = (s: number) => {
	let tmp = s;
	const ms = tmp % 1000;
	tmp = (tmp - ms) / 1000;
	const secs = tmp % 60;
	tmp = (tmp - secs) / 60;
	const mins = tmp % 60;

	return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const Timer: React.FC<TimerProps> = ({ socket, initialTime }: TimerProps) => {
	const [time, setTime] = useState(initialTime);

	useEffect(() => {
		setTime(initialTime);
	}, [initialTime]);

	useEffect(() => {
		socket.on('time_step', (currentTime: number) => {
			setTime(currentTime);
		});
	}, [socket]);

	return (
		<div className="timer">
			<p unselectable="on" style={{ color: time > 10000 ? 'white' : 'red' }}>
				{msToTime(time)}
			</p>
		</div>
	);
};

export default Timer;
