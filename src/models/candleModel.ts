import mongoose, { Schema, Document } from 'mongoose';

export interface ICandle extends Document {
	time: string;
	open: number;
	high: number;
	low: number;
	close: number;
	volume: number;
}

const candleSchema: Schema = new Schema(
	{
		time: { type: String, required: true, unique: true },
		open: { type: Number, required: true },
		high: { type: Number, required: true },
		low: { type: Number, required: true },
		close: { type: Number, required: true },
		volume: { type: Number, required: true },
	},
	{ versionKey: false }
);

export function getCandleCollectionModel(symbol: string): mongoose.Model<ICandle, {}, {}, {}> {
	const modelName = symbol + '_candles';
	return mongoose.modelNames().includes(modelName)
		? mongoose.model<ICandle>(modelName)
		: mongoose.model<ICandle>(modelName, candleSchema);
}

export async function getCandleCollectionModelStrict(
	symbol: string
): Promise<mongoose.Model<ICandle, {}, {}, {}> | undefined> {
	const modelName = symbol + '_candles';
	return (await modelExists(symbol)) ? mongoose.model<ICandle>(modelName, candleSchema) : undefined;
}

async function modelExists(name: string) {
	const modelName = name + '_candles';
	if (mongoose.modelNames().includes(modelName)) return true;
	const collections = await mongoose.connection.db.collections();
	for (const col of collections) {
		if (col.namespace.split('.')[1] === modelName) {
			return true;
		}
	}
	return false;
}

export function getSchema() {
	return candleSchema;
}
