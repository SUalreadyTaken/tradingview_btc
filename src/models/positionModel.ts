import mongoose, { Schema, Document } from 'mongoose';

export interface IPosition extends Document {
	time: string;
	price: number;
	long: boolean;
}

const positionSchema: Schema = new Schema(
	{
		time: { type: String, required: true, unique: true },
		price: { type: Number, required: true },
		long: { type: Boolean, required: true },
	},
	{ versionKey: false }
);

export function getPositionCollectionModel(symbol: string): mongoose.Model<IPosition, {}, {}, {}> {
	const modelName = symbol + '_positions';
	return mongoose.modelNames().includes(modelName)
		? mongoose.model<IPosition>(modelName)
		: mongoose.model<IPosition>(modelName, positionSchema);
}

// go create collection in db some other way... 
export async function getPositionCollectionModelStrict(
	symbol: string
): Promise<mongoose.Model<IPosition, {}, {}, {}> | undefined> {
	const modelName = symbol + '_positions';
	return (await modelExists(symbol)) ? mongoose.model<IPosition>(modelName, positionSchema) : undefined;
}

async function modelExists(name: string) {
	const modelName = name + '_positions';
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
	return positionSchema;
}
