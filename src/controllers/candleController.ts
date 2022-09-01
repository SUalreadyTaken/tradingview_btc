import { NextFunction, Response, Request } from 'express';
import { Candle } from '..';
import { getPositionCollectionModel, IPosition } from '../models/positionModel';
import { getStrategyConfigCollectionModelStrict } from '../models/strategyConfigModel';
import { catchAsync } from '../utils/catchAsync';
import { candleCache } from './dbController';

// TODO made fast to get online.. make it better
export const getCandle = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
	const positionCount = req.query.positions as string;
	const strategyName = req.query.strategy as string;
	let resPositionData: IPosition[] = [];
	let resCandleData: Candle[] = [];
	let year = req.query.year as string;
	if (typeof strategyName === 'string' && typeof positionCount === 'string') {
		const strategyModel = await getStrategyConfigCollectionModelStrict();
		const strategy = await strategyModel.find({ name: strategyName }).limit(1).exec();
		//FIXME
		// ## REMOVED TRADE SECRET ##

		// all of them exist otherwise would not reach this function
		const positionModel = getPositionCollectionModel(strategyName);
		const positionList = (await positionModel
			.find({}, { _id: 0 })
			.sort({ _id: -1 })
			.limit(+positionCount * 2)
			.lean()
			.exec()) as IPosition[];
		positionList.reverse();
		if (positionList.length > 0) {
			const start: number = positionList[0].long ? 0 : 1;
			for (let i = start; i < positionList.length; i++) {
				resPositionData.push(positionList[i]);
			}
			const firstPosTime = +resPositionData[0].time;
			//FIXME
			// ## REMOVED TRADE SECRET ##
			const firstCandleNeeded = firstPosTime - 150 * 15 * 60 * 1000;
			let candleStart = 0;
			for (let i = 0; i < candleCache.length; i++) {
				if (+candleCache[i].time > firstCandleNeeded) {
					candleStart = i;
					break;
				}
			}
			for (let i = candleStart; i < candleCache.length; i++) {
				resCandleData.push(candleCache[i]);
			}

			if (year) {
				year = new Date(year + '-01-01').getTime().toString();
				let posIndex = 0;
				let candleIndex = 0;
				for (let i = 0; i < resPositionData.length; i++) {
					if (year.localeCompare(resPositionData[i].time) <= -1 && resPositionData[i].long) {
						posIndex = i;
						break;
					}
				}
				for (let i = 0; i < resCandleData.length; i++) {
					if (resPositionData[posIndex].time.localeCompare(resCandleData[i].time) <= -1) {
						candleIndex = i - 1;
						break;
					}
				}
				resPositionData = resPositionData.splice(posIndex);
				resCandleData = resCandleData.splice(candleIndex);
			}
		}
	}
	res.status(200).json({
		status: 'success',
		data: {
			candle: resCandleData,
			position: resPositionData,
		},
	});
});
