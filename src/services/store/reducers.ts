import { combineReducers } from 'redux';
import { persistReducer } from 'redux-persist';
import storage from 'redux-persist/es/storage';

const makeRootReducers = () => {
	return combineReducers({
		tmp: persistReducer(
			{
				key: 'tmp',
				storage,
			},
			(state = {}) => state,
		),
	});
};

export default makeRootReducers;
