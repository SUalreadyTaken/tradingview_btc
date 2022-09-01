const downToNearestQuater = (s: number) => Math.floor(s / 15) * 15;

export const getEndTimePreviousQuater = () => {
	const d = new Date(Math.floor(Date.now() / 1000) * 1000);
	d.setSeconds(0);
	d.setMinutes(downToNearestQuater(d.getMinutes()));
	return d.getTime() - 15 * 60 * 1000;
};