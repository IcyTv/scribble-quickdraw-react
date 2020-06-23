/* eslint-disable no-plusplus */
/* eslint-disable import/prefer-default-export */

const scale = (num: number, in_min: number, in_max: number, out_min: number, out_max: number) => {
	return ((num - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min;
};

function intersectsHelper(a: number, b: number, c: number, d: number, p: number, q: number, r: number, s: number) {
	const det = (c - a) * (s - q) - (r - p) * (d - b);
	if (det === 0) {
		return false;
	}
	const gamma = ((s - q) * (r - a) + (p - r) * (s - b)) / det;
	const lambda = ((b - d) * (r - a) + (c - a) * (s - b)) / det;
	return lambda > 0 && lambda < 1 && gamma > 0 && gamma < 1;
}

const intersects = (points: { x: number; y: number }[], x1: number, y1: number, x2: number, y2: number) => {
	let last = points[0];
	for (let i = 1; i < points.length; i++) {
		const p = points[i];
		if (intersectsHelper(last.x, last.y, p.x, p.y, x1, y1, x2, y2)) {
			return true;
		}
		last = p;
	}
	return false;
};

export { scale, intersects };
