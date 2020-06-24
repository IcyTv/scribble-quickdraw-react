import { createStore, applyMiddleware, compose } from 'redux';
import createSagaMiddleware from 'redux-saga';
import { persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/es/storage';
import makeRootReducer from './reducers';
import saga from './saga';

export default () => {
	const createStoreWithMiddleware = compose(
		typeof window === 'object' && typeof (window as any).devToolsExtension !== 'undefined'
			? (): any => (window as any).__REDUX_DEVTOOLS_EXTENSION__ // eslint-disable-line no-underscore-dangle
			: (f: any): any => f,
	)(createStore);
	const sagaMiddleware = createSagaMiddleware();
	const presistedReducer = persistReducer(
		{
			key: 'persist',
			storage,
		},
		makeRootReducer(),
	);
	const composeEnhancers = (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
	const store = createStore(presistedReducer, composeEnhancers(applyMiddleware(sagaMiddleware)));
	const persistor = persistStore(store);

	saga(sagaMiddleware);

	return { store, persistor, runSaga: sagaMiddleware.run };
};
