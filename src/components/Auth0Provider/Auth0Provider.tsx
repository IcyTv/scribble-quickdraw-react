/* eslint-disable no-shadow */
import createAuth0Client, {
	Auth0Client,
	Auth0ClientOptions,
	GetIdTokenClaimsOptions,
	GetTokenSilentlyOptions,
	GetTokenWithPopupOptions,
	LogoutOptions,
	RedirectLoginOptions,
} from '@auth0/auth0-spa-js';
import React, { useEffect, useState } from 'react';
import { Auth0Context } from '../../utils/auth0Hooks';

const DEFAULT_REDIRECT_CALLBACK = () => window.history.replaceState({}, document.title, window.location.pathname);

interface Auth0ProviderProps {
	children: React.ReactChildren | React.ReactChild;
	onRedirectCallback?: (appState: { targetUrl: string }) => void;
	initOptions: Auth0ClientOptions;
}

export default ({ children, onRedirectCallback = DEFAULT_REDIRECT_CALLBACK, initOptions }: Auth0ProviderProps) => {
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [user, setUser] = useState(null);
	const [auth0Client, setAuth0Client] = useState<Auth0Client>();
	const [loading, setLoading] = useState(true);
	const [popupOpen, setPopupOpen] = useState(false);

	useEffect(() => {
		const initAuth0 = async () => {
			const auth0FromHook = await createAuth0Client(initOptions);
			setAuth0Client(auth0FromHook);

			if (window.location.search.includes('code=') && window.location.search.includes('state=')) {
				const { appState } = await auth0FromHook.handleRedirectCallback();
				onRedirectCallback(appState);
			}

			const isAuthenticated = await auth0FromHook.isAuthenticated();
			setIsAuthenticated(isAuthenticated);

			if (isAuthenticated) {
				const user = await auth0FromHook.getUser();
				setUser(user);
			}

			setLoading(false);
		};
		initAuth0().catch(console.error);
	}, [initOptions, onRedirectCallback]);

	const loginWithPopup = async (params = {}) => {
		setPopupOpen(true);
		try {
			await auth0Client!.loginWithPopup(params);
		} catch (error) {
			console.error(error);
		} finally {
			setPopupOpen(false);
		}
		const user = await auth0Client!.getUser();
		setUser(user);
		setIsAuthenticated(true);
	};

	const handleRedirectCallback = async () => {
		setLoading(true);
		await auth0Client!.handleRedirectCallback();
		const user = await auth0Client!.getUser();
		setLoading(false);
		setIsAuthenticated(false);
		setUser(user);
	};

	if (!loading) {
		return (
			<Auth0Context.Provider
				value={{
					isAuthenticated,
					user,
					loading,
					popupOpen,
					loginWithPopup,
					handleRedirectCallback,
					getIdTokenClaims: (p?: GetIdTokenClaimsOptions) => auth0Client!.getIdTokenClaims(p),
					loginWithRedirect: (p?: RedirectLoginOptions) => auth0Client!.loginWithRedirect(p),
					getTokenSilently: (p?: GetTokenSilentlyOptions) => auth0Client!.getTokenSilently(p),
					getTokenWithPopup: (p?: GetTokenWithPopupOptions) => auth0Client!.getTokenWithPopup(p),
					logout: (p?: LogoutOptions) => auth0Client!.logout(p),
				}}>
				{children}
			</Auth0Context.Provider>
		);
	}
	return <Auth0Context.Provider value={{ isAuthenticated, loading, user, popupOpen }}>{children}</Auth0Context.Provider>;
};
