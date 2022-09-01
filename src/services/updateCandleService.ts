import { Model } from 'mongoose';
import { ICandle } from '../models/candleModel';
import { Candle } from '..';
import axios, { AxiosResponse } from 'axios';
import { getEndTimePreviousQuater } from '../utils/universal';

// FIXME move to config ??
const _apiUrl = 'https://api.binance.com/api/v3/klines?';
const _limit = 500;

const candlesFromLast = (start: number, end: number) => {
	const diff = end - start;
	return Math.floor(diff / 1000 / 60) / 15;
};

const buildRequestStartEndUrl = (symbol: string, interval: string, start: number, end: number) => {
	return `${_apiUrl}symbol=${symbol}&interval=${interval}&startTime=${start}&endTime=${end}`;
};

const buildRequestStartUrl = (symbol: string, interval: string, start: number) => {
	return `${_apiUrl}symbol=${symbol}&interval=${interval}&startTime=${start}`;
};

const toOHLC = (s: any): Candle => {
	return {
		time: s[0],
		open: parseFloat(s[1]),
		high: parseFloat(s[2]),
		low: parseFloat(s[3]),
		close: parseFloat(s[4]),
		volume: parseFloat(s[5]),
	};
};

export async function updateCandles(
	lastTimestamp: number,
	symbol: string,
	interval: string,
	model: Model<ICandle, {}, {}, {}>,
	candleCache: Candle[]
) {
	let endTime = getEndTimePreviousQuater();
	const startTime = lastTimestamp + 15 * 60 * 1000;
	const count = candlesFromLast(startTime, endTime);
	// console.log(`# start=${new Date(startTime)} | end=${new Date(endTime)}\n`);
	let candleList: Candle[] = [];
	if (count < _limit) {
		candleList = await getEnd(symbol, interval, startTime);
	} else {
		candleList = await getStartEnd(symbol, interval, startTime, endTime, count);
	}

	if (candleList) {
		// TODO must be ordered so can't use insertMany.. it will take a long time if a lot of time has passed since last candle
		// FIXME
		let insertCount = 0;
		// dont insert the last
		for (let i = 0; i < candleList.length - 1; i++) {
      await model
				.create(candleList[i])
				.then((res: any) => {
          candleCache.push({
						time: res.time,
						open: res.open,
						high: res.high,
						low: res.low,
						close: res.close,
						volume: res.volume,
					});
				})
				.catch((e: any) => {
          console.log("updateCandles 💣 caught");
          console.log(e);
					insertCount--;
				});
			insertCount++;
		}

		if (insertCount !== candleList.length - 1)
			console.log(`candleSize : ${candleList.length} vs insertCount : ${insertCount}`);
		return true;
	}
	return false;
}

const sleep = (delay: number) => new Promise((resolve) => setTimeout(resolve, delay));

function pushData(res: AxiosResponse<any, any>, result: Candle[]) {
	if (res.status == 200) {
		res.data.forEach((e: any) => result.push(toOHLC(e)));
	} else {
		console.log(`getEnd api response wasn't 200 but ${res.status} \n${res.statusText}`);
	}
}

async function getEnd(symbol: string, interval: string, start: number) {
	const result: Candle[] = [];
	// TODO better error handling ..
	try {
		let res = await axios.get(buildRequestStartUrl(symbol, interval, start));
		pushData(res, result);
	} catch (error) {
		// TODO error 429.. if its thrown need to shut it down .. dont want to get ip banned
		console.log('💥 getEnd' + error);
		return undefined;
	}
	return result;
}

async function getStartEnd(symbol: string, interval: string, start: number, end: number, count: number) {
	const result: Candle[] = [];
	const requestCount = Math.ceil(count / _limit);
	let requestUrls = [];
	for (let i = 0; i < requestCount; i++) {
		let end = start + 15 * _limit * 60 * 1000;
		let res = axios.get(buildRequestStartEndUrl(symbol, interval, start, end));
		// TODO theres 10 req / s limit.. have a counter 1req time 9req time if its under 1s then wait 1 sec
		// FIXME ^
		await sleep(150);
		console.log(new Date(Date.now()).getTime());
		requestUrls.push(res);
		start = end;
	}

	// TODO better error handling ..
	try {
		for (const pro of requestUrls) {
			const res = await pro;
			pushData(res, result);
		}
	} catch (error) {
		return undefined;
	}
	return result;
}
