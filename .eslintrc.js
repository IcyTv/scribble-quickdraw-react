module.exports = {
	extends: ['airbnb-typescript-prettier'],
	root: true,
	env: {
		jest: true,
	},
	rules: {
		'no-plusplus': ['error', { allowForLoopAfterthoughts: true }],
		'@typescript-eslint/no-non-null-assertion': 0,
		'@typescript-eslint/explicit-function-return-type': 0,
	},
	parserOptions: {
		project: ['./tsconfig.json', './server/tsconfig.json'],
	},
	ignorePatterns: ['config-overrides.js', '*config*.js', '*jest*'],
};
