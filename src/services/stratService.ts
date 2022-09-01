import { ICandle } from '../models/candleModel';
import { IPosition } from '../models/positionModel';
import { IStrategyConfig } from '../models/strategyConfigModel';

export interface Position {
	time: string;
	price: number;
	long: boolean;
}

export function getPastPositions_v1(
	start: number,
	strategy: IStrategyConfig,
	candleList: ICandle[],
	lastPosition: IPosition
): Position[] {
	let position = false;
	let result: Position[] = [];

	//FIXME
	// ## REMOVED TRADE SECRET ##
	result = [
		{
			time: '1661968800000',
			price: 20015.85,
			long: true,
		},
		{
			time: '1661972400000',
			price: 20182.06,
			long: false,
		},
	];

	return result;
}

export function getPastPositions_v2(
	start: number,
	strategy: IStrategyConfig,
	candleList: ICandle[],
	lastPositionList: IPosition[]
): Position[] {
	let position = true;
	let result: Position[] = [];
	//FIXME
	// ## REMOVED TRADE SECRET ##
  
  result = [
		{
			time: '1661968800000',
			price: 20015.85,
			long: true,
		},
		{
			time: '1661972400000',
			price: 20182.06,
			long: false,
		},
	];

	return result;
}

//FIXME
// ## REMOVED TRADE SECRET ##
