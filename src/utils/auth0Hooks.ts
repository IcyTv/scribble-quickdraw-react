import { useContext, createContext } from 'react';
import { GetIdTokenClaimsOptions, IdToken, RedirectLoginOptions, GetTokenSilentlyOptions, GetTokenWithPopupOptions, LogoutOptions } from '@auth0/auth0-spa-js';

export interface Auth0ContextValues {
	isAuthenticated: boolean;
	user: any;
	loading: boolean;
	popupOpen: boolean;
	loginWithPopup?: () => Promise<void>;
	handleRedirectCallback?: () => Promise<void>;
	getIdTokenClaims?: (p?: GetIdTokenClaimsOptions) => Promise<IdToken>;
	loginWithRedirect?: (p: RedirectLoginOptions) => Promise<void>;
	getTokenSilently?: (p: GetTokenSilentlyOptions) => Promise<any>;
	getTokenWithPopup?: (p: GetTokenWithPopupOptions) => Promise<string>;
	logout?: (p: LogoutOptions) => void;
}

// interface IsNotLoaded {
// 	loading: true;
// 	isAuthenticated: boolean;
// 	user: undefined | null;
// 	popupOpen: boolean;
// }

// type Auth0ContextValues = IsNotLoaded | Auth0Loaded;

// type Auth0ContextValues<IsLoading extends boolean = boolean> = IsLoading extends true ? IsNotLoaded : Auth0Loaded;

const defaultValue: Auth0ContextValues = {
	isAuthenticated: false,
	user: undefined,
	loading: true,
	popupOpen: false,
};

export const Auth0Context = createContext<Auth0ContextValues>(defaultValue);
export const useAuth0 = () => useContext(Auth0Context);
