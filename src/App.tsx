import React from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import './App.css';
import Auth0Provider from './components/Auth0Provider';
import Router from './components/Router/Router';
import config from './services/auth0_config.json';
import createStore from './services/store/createStore';
import history from './utils/history';

const onRedirectCallback = (appState: { targetUrl: string }) => {
	history.push(appState && appState.targetUrl ? appState.targetUrl : window.location.pathname);
};

function App() {
	const { store, persistor } = createStore();

	return (
		<Provider store={store}>
			<PersistGate loading={null} persistor={persistor}>
				<Auth0Provider
					initOptions={{
						domain: config.domain,
						client_id: config.client_id,
						redirect_uri: window.location.origin,
					}}
					onRedirectCallback={onRedirectCallback}>
					<Router />
				</Auth0Provider>
			</PersistGate>
		</Provider>
	);
}

export default App;
