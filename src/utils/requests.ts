/* eslint-disable import/prefer-default-export */
import axios, { AxiosRequestConfig } from 'axios';
import { Auth0ContextValues } from './auth0Hooks';

export const get = async (url: string, axiosConfig?: AxiosRequestConfig, auth0?: Auth0ContextValues) => {
	// eslint-disable-next-line no-underscore-dangle
	const header = !auth0 ? undefined : { Authorization: `Bearer ${(await auth0.getIdTokenClaims!()).__raw}` };
	return axios.get(url, {
		...axiosConfig,
		headers: {
			...header,
			...(axiosConfig || {}).headers,
		},
	});
};
