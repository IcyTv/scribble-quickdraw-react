import { SagaMiddleware } from 'redux-saga';
import room from './room';

export default (sagaMiddleware: SagaMiddleware<object>) => {
	sagaMiddleware.run(room);
};
