import mongoose, { Schema, Document } from 'mongoose';

export interface IStrategyConfig extends Document {
	name: string;
	symbol: string;
	interval: string;
	//FIXME
	// ## REMOVED TRADE SECRET ##
}

const strategyConfigSchema: Schema = new Schema(
	{
		name: { type: String, required: true, unique: true },
		symbol: { type: String, required: true },
		interval: { type: String, required: true },
		//FIXME
		// ## REMOVED TRADE SECRET ##
	},
	{ versionKey: false }
);

// TODO
// FIXME have only 1 so.. just have to call await mongoose.connection.db.collections(); somewhere so it will fetch and save the model
const modelName = 'strategy_configs';
export function getStrategyConfigCollectionModel(): mongoose.Model<IStrategyConfig, {}, {}, {}> {
	return mongoose.modelNames().includes(modelName)
		? mongoose.model<IStrategyConfig>(modelName)
		: mongoose.model<IStrategyConfig>(modelName, strategyConfigSchema);
}

export async function getStrategyConfigCollectionModelStrict(): Promise<
	mongoose.Model<IStrategyConfig, {}, {}, {}> | undefined
> {
	return (await modelExists()) ? mongoose.model<IStrategyConfig>(modelName, strategyConfigSchema) : undefined;
}

async function modelExists() {
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
	return strategyConfigSchema;
}
