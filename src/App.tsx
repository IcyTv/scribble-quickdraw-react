import React from 'react';
import config from './services/auth0_config.json';
import './App.css';
import Auth0Provider from './components/Auth0Provider';
import history from './utils/history';
import Router from './components/Router/Router';

const onRedirectCallback = (appState: { targetUrl: string }) => {
	history.push(appState && appState.targetUrl ? appState.targetUrl : window.location.pathname);
};

function App() {
	return (
		<Auth0Provider
			initOptions={{
				domain: config.domain,
				client_id: config.client_id,
				redirect_uri: window.location.origin,
			}}
			onRedirectCallback={onRedirectCallback}>
			<Router />
		</Auth0Provider>
	);
}

export default App;
