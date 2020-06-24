import { put, takeLatest } from 'redux-saga/effects';
import { get } from '../../utils/requests';
import { Auth0ContextValues } from '../../utils/auth0Hooks';

function* fetchRoom(action: { type: string; payload: { room: number; auth0: Auth0ContextValues } }) {
	try {
		const room = yield get(`/api/room/${action.payload.room}`, {}, action.payload.auth0);
		yield put({
			type: 'ROOM_FETCH_SUCCEEDED',
			room: room.data.room,
		});
	} catch (e) {
		yield put({
			type: 'ROOm_FETCH_FAILED',
			message: e.message,
		});
	}
}

function* getRoom() {
	yield takeLatest('ROOM_FETCH_REQUEST', fetchRoom);
}

export default getRoom;
