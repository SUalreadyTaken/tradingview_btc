import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { app } from './app';
import { start } from './controllers/dbController';

dotenv.config({ path: `${__dirname}/../config.env` });

const DB = process.env.DATABASE;

mongoose
	.connect(DB, {
	})
	.then(() => {
		start().then(() => {
			console.log('DB connection successful!!');
			const port = process.env.PORT || 3000;
			const server = app.listen(port, () => {
				console.log(`App running on port ${port}...`);
			});
		});
	})
	.catch((err) => {
		console.log(err);
	});
