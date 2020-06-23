import { Avatar, List, ListItem, ListItemAvatar, Button } from '@material-ui/core';
import { AxiosResponse } from 'axios';
import { parse } from 'query-string';
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, Redirect } from 'react-router';
import { useAuth0 } from '../../utils/auth0Hooks';
import { get } from '../../utils/requests';
import './RoomPage.scss';
import config from '../../utils/config';

const RoomPage: React.FC = () => {
	const location = useLocation();
	const auth0 = useAuth0();
	const roomNr = useMemo(() => parse(location.search).nr, [location]);
	const [room, setRoom] = useState<{ users: { name: string; picture?: string }[] }>();
	const [redirectTo, setRedirectTo] = useState('');

	useEffect(() => {
		const func = async () => {
			const res = (await get(`http://${config.host}:${config.port}/api/room/${roomNr}`, { timeout: 10000 }, auth0)) as AxiosResponse;
			if (((res as unknown) as { exception: string }).exception) {
				console.log('Exception', ((res as unknown) as { exception: string }).exception);
			} else {
				console.log(res.data);
				setRoom(res.data.room);
			}
		};
		// if (auth0.loading) {
		// 	console.log('Auth0 loading', auth0);
		// 	return;
		// }
		func();
	}, [auth0, roomNr]);

	if (redirectTo !== '') {
		return <Redirect to={redirectTo} />;
	}

	if (!room) {
		return (
			<div className="room-page">
				<p>Loading room...</p>
			</div>
		);
	}

	return (
		<div className="room-page">
			<h2>Room {roomNr}</h2>
			<List>
				{room.users.map((v) => {
					return (
						<ListItem key={`user-${v.name}`}>
							<ListItemAvatar>
								<Avatar src={v.picture} alt="User" imgProps={{ referrerPolicy: 'no-referrer' }} />
							</ListItemAvatar>
							<p>{v.name}</p>
						</ListItem>
					);
				})}
			</List>
			<div className="bottom">
				<Button
					onClick={() => {
						get(`http://${config.host}:${config.port}/api/room/${roomNr}/play`, {}, auth0);
						setRedirectTo(`/game?roomNr=${roomNr}`);
					}}>
					Start
				</Button>
			</div>
		</div>
	);
};

export default RoomPage;
