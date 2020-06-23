import React from 'react';
// import { BrowserRouter } from 'react-router-dom';
import { Router as BrowserRouter } from 'react-router';
import { Route, Redirect } from 'react-router-dom';
import MainGame from '../../pages/MainGame';
import history from '../../utils/history';
import ProtectedRoute from '../ProtectedRoute';
import RoomPage from '../../pages/RoomPage';

const Router: React.FC = () => {
	return (
		<BrowserRouter history={history}>
			{/* <Route path="/" render={() => <Redirect to="/game" />} exact /> */}
			<ProtectedRoute path="/game" component={MainGame} exact />
			<ProtectedRoute path="/room" component={RoomPage} />
		</BrowserRouter>
	);
};

export default Router;
