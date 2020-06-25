module.exports = {
	extends: ['airbnb-typescript-prettier'],
	root: true,
	env: {
		jest: true,
	},
	rules: {
		'no-plusplus': ['error', { allowForLoopAfterthoughts: true }],
	},
};
