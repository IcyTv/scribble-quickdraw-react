/* eslint-disable global-require */
import React from 'react';
import { render, waitFor } from '@testing-library/react';
import * as auth0 from '@auth0/auth0-spa-js';
import App from './App';

describe('Main App tests', () => {
	const mockCrypto = (search?: string) => {
		const mockResponse = jest.fn();
		// eslint-disable-next-line import/no-extraneous-dependencies
		window.crypto = require('@trust/webcrypto');
		Object.defineProperty(window, 'location', {
			value: {
				hash: {
					endsWith: mockResponse,
					includes: mockResponse,
				},
				assign: mockResponse,
				search: search || '',
			},
			writable: true,
		});
		return mockResponse;
	};
	it('renders without crashing', async () => {
		const mockResponse = mockCrypto();
		const { container } = render(<App />);
		await waitFor(() => expect(mockResponse).toHaveBeenCalled());
		expect(container).toBeDefined();
		// const linkElement = getByText(/learn react/i);
		// expect(linkElement).toBeInTheDocument();
	});

	it('verifies token', async () => {
		const mockResponse = mockCrypto('?code=123&state=123');
		jest.mock('@auth0/auth0-spa-js');
		const { container } = render(<App />);
	});
});
