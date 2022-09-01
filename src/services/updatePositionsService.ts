import { Model } from 'mongoose';
import { ICandle } from '../models/candleModel';
import { IPosition } from '../models/positionModel';
import { IStrategyConfig } from '../models/strategyConfigModel';
//FIXME
	// ## REMOVED TRADE SECRET ##
import { getPastPositions_v1, getPastPositions_v2, Position } from './stratService';

enum Time {
	'15m' = 15 * 60 * 1000,
}

export async function updatePositions(
	candleModel: Model<ICandle, {}, {}, {}>,
	strategy: IStrategyConfig,
	positionModel: Model<IPosition, {}, {}, {}>
) {
	const lastPosition = (await positionModel.find().sort({ _id: -1 }).limit(1).lean().exec()) as IPosition[];
	let positionList: Position[] = [];
	let candleList: ICandle[] = [];
	const start = 150 //edited trade secret 

	if (lastPosition.length > 0) {
		const firstCandleNeeded = +lastPosition[0].time - start * Time[strategy.interval as keyof typeof Time];
		candleList = (await candleModel
			.find({ time: { $gte: firstCandleNeeded } }, { _id: 0 })
			.lean()
			.exec()) as ICandle[];
	} else {
		candleList = (await candleModel.find({}, { _id: 0 }).lean().exec()) as ICandle[];
	}
	
  //FIXME
	// ## REMOVED TRADE SECRET ##
	positionList = getPastPositions_v1(start, strategy, candleList, lastPosition[0]);

	for (const pos of positionList) {
		console.log(pos);
		await positionModel.create(pos).catch((e: any) => {
			console.log('updatePositions 💣 caught');
			console.log(e);
		});
	}
}

export async function updatePositions2(
	candleModel: Model<ICandle, {}, {}, {}>,
	strategy: IStrategyConfig,
	positionModel: Model<IPosition, {}, {}, {}>
) {
	const lastPosition = (await positionModel.find().sort({ _id: -1 }).limit(2).lean().exec()) as IPosition[];
	lastPosition.reverse();
	let positionList: Position[] = [];
	let candleList: ICandle[] = [];
  //FIXME
	// ## REMOVED TRADE SECRET ##
	const start = 150;
	if (lastPosition.length > 0) {
		const firstCandleNeeded = +lastPosition[0].time - start * Time[strategy.interval as keyof typeof Time];
		candleList = (await candleModel
			.find({ time: { $gte: firstCandleNeeded } }, { _id: 0 })
			.lean()
			.exec()) as ICandle[];
		//FIXME
	// ## REMOVED TRADE SECRET ##
		positionList = getPastPositions_v2(start, strategy, candleList, lastPosition);
	} else {
		candleList = (await candleModel.find({}, { _id: 0 }).lean().exec()) as ICandle[];
		//FIXME
	// ## REMOVED TRADE SECRET ##
		positionList = getPastPositions_v2(start, strategy, candleList, undefined);
	}

	for (const pos of positionList) {
		console.log(pos);
		await positionModel.create(pos).catch((e: any) => {
			console.log('updatePositions2 💣 caught');
			console.log(e);
		});
	}
}
