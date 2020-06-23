/* eslint-disable react/jsx-props-no-spreading */
import React, { useEffect } from 'react';
import { Route, RouteProps, useLocation } from 'react-router-dom';
import { useAuth0 } from '../../utils/auth0Hooks';

const ProtectedRoute: React.FC<RouteProps> = ({ component: Component, path, ...rest }: RouteProps) => {
	const { loading, isAuthenticated, loginWithRedirect } = useAuth0();

	useEffect(() => {
		if (loading || isAuthenticated) {
			return;
		}

		console.log('Redirecting', loading, isAuthenticated);

		const fn = async () => {
			await loginWithRedirect!({
				appState: {
					targetUrl: window.location.pathname + window.location.search,
				},
			});
		};
		fn();
	}, [loading, isAuthenticated, loginWithRedirect, path]);

	if (Component === undefined) {
		return null;
	}

	const render = (props: any) => (isAuthenticated && !loading ? <Component {...props} /> : null); // TODO add loading indicator
	return <Route path={path} render={render} {...rest} />;
};

export default ProtectedRoute;
