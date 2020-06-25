import React, { useState, useEffect } from 'react';
import { Modal, Button } from '@material-ui/core';
import './WordSelection.scss';

interface WordSelectionProps {
	socket: SocketIOClient.Socket;
	onWordSelect?: (word: string) => void;
	defWord?: string;
}

const selectRandom = <T1 extends unknown>(list: T1[], amount: number): T1[] => {
	const tmp = list.slice();
	const ret = [];
	for (let i = 0; i < amount; i++) {
		ret.push(tmp.splice(Math.floor(Math.random() * tmp.length), 1)[0]);
	}
	return ret.filter((v) => v);
};

const WordSelection: React.FC<WordSelectionProps> = ({ socket, onWordSelect, defWord }: WordSelectionProps) => {
	const [wordList, setWordList] = useState<string[]>([]);
	const [word, setWord] = useState('');

	useEffect(() => {
		if (defWord !== undefined) {
			setWord(defWord);
		}
	}, [defWord]);

	useEffect(() => {
		socket.on('word_list', (wordlist: string[]) => {
			setWordList(wordlist);
		});
	}, [socket]);

	const randWords = selectRandom(wordList, 3);

	const onClick = (w: string) => () => {
		socket.emit('word_select', w);
		setWord(w);
		if (onWordSelect) {
			onWordSelect(w);
			setWordList([]);
		}
	};

	return (
		<Modal open={word === '' && wordList.length > 0}>
			<div className="word-selection">
				<h3>Select your word</h3>
				<div className="words">
					{randWords.map((v) => {
						return (
							<Button key={`select-${v}`} onClick={onClick(v)}>
								{v}
							</Button>
						);
					})}
				</div>
			</div>
		</Modal>
	);
};

export default WordSelection;
