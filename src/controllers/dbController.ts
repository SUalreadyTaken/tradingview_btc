import { catchAsync } from '../utils/catchAsync';
import { NextFunction, Response, Request } from 'express';
import { getCandleCollectionModelStrict, ICandle } from '../models/candleModel';
import { updateCandles } from '../services/updateCandleService';
import { getStrategyConfigCollectionModelStrict } from '../models/strategyConfigModel';
import { updatePositions, updatePositions2 } from '../services/updatePositionsService';
import dotenv from 'dotenv';
import { getEndTimePreviousQuater } from '../utils/universal';
import { getPositionCollectionModel, getPositionCollectionModelStrict } from '../models/positionModel';
import { Candle } from '..';
dotenv.config({ path: `${__dirname}/../../config.env` });

const lastCheckMap = new Map<string, number>();

let cDone = false;

// TODO temporary... candleCache make it a class and check for ordering and adding 1 copy...
export const candleCache: Candle[] = [];
const sleep = (delay: number) => new Promise((resolve) => setTimeout(resolve, delay));
export function start() {
  return new Promise<boolean>(async (resolve) => {
    await sleep(1000);
    const tmpModel = await getCandleCollectionModelStrict('btcusdt15m');
    const candles = (await tmpModel.find().sort({ _id: 1 }).lean().exec()) as ICandle[];
    for (const i of candles) {
      candleCache.push({
        time: i.time,
        open: i.open,
        high: i.high,
        low: i.low,
        close: i.close,
        volume: i.volume,
      });
    }
    console.log(`cache len ${candleCache.length}`);
    cDone = true;
    console.log('Cache done');
    resolve(cDone);
  });
}

//end

async function workCandleDB(collectionName: string, symbol: string, interval: string): Promise<boolean> {
	const model = await getCandleCollectionModelStrict(collectionName);
	if (model) {
		const lastCandle = await model.find().sort({ _id: -1 }).limit(1).lean().exec();
		if (lastCandle.length > 0) {
			// got last candle
			const lastTime = lastCandle[0].time;
			const result = await updateCandles(+lastTime, symbol.toUpperCase(), interval, model, candleCache);
			if (result) lastCheckMap.set(collectionName, +lastTime);
		} // no else .. insert first candle u want otherwise it will queue from start .. will take a lot of time
	} else {
		return false;
	}
	return true;
}

async function workStrategyDB(strategyName: string, symbol: string, interval: string) {
	const candleModel = await getCandleCollectionModelStrict((symbol + interval).toLowerCase());
	const strategyModel = await getStrategyConfigCollectionModelStrict();
	if (strategyModel) {
		const positionModel = getPositionCollectionModel(strategyName);
		if (positionModel) {
			const strategy = await strategyModel.find({ name: strategyName }).limit(1).exec();
			if (strategy.length > 0) {
        const strat = strategy[0];
        if (strategyName === 'btc_15m_og') {
          await updatePositions(candleModel, strat, positionModel);
        } else if (strategyName === 'btc_15m_v2') {
          await updatePositions2(candleModel, strat, positionModel);
        }
        lastCheckMap.set(strategyName, getEndTimePreviousQuater());
      }
      
			return true;
		}
	} else {
		return false;
	}
}

export const defaultGet = (req: Request, res: Response) => {
	res.send({ date: Date.now() });
};

export const updateCandleDB = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
	const symbol = req.query.symbol;
	const interval = req.query.interval;
	let worked = true;
  if(!cDone) {
    for(let i = 0; i < 10; i++) {
      if(!cDone) {
        await sleep(1000);
      } else {
        break;
      }
    }
  }
  // leave the typeof instead of using 'as string'
	if (typeof symbol === 'string' && typeof interval === 'string') {
		const candleKey = (symbol + interval).toLowerCase();
		if (lastCheckMap.has(candleKey)) {
			const lastTime = getEndTimePreviousQuater();
			if (lastTime > lastCheckMap.get(candleKey)) {
				worked = await workCandleDB(candleKey, symbol, interval);
			}
		} else {
			worked = await workCandleDB(candleKey, symbol, interval);
		}
	}
	if (worked) {
		next();
	} else {
		res.status(400).json({
			status: 'Bad Request',
		});
	}
});

export const updatePositionDB = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
	const symbol = req.query.symbol;
	const interval = req.query.interval;
	const strategy = req.query.strategy;
	// const lastTime = req.query.last;

	if (typeof symbol === 'string' && typeof interval === 'string' && typeof strategy === 'string') {
		const candleKey = strategy.toLowerCase();
		if (lastCheckMap.has(candleKey)) {
			const lastTime = getEndTimePreviousQuater();
			if (lastTime > lastCheckMap.get(candleKey)) {
				await workStrategyDB(candleKey, symbol, interval);
			}
		} else {
			await workStrategyDB(candleKey, symbol, interval);
		}
	}
  next();
	// res.status(200).json({
	// 	status: 'success',
	// 	data: 'updatedDB',
	// });
});