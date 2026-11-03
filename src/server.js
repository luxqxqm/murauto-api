import 'dotenv/config';
import { app } from './app.js';
import { mongoConnect } from './db/mongoConnect.js';

const port = process.env.PORT || 3000;

await mongoConnect();

app.listen(port, () => {
  console.log(`Server is listening on port : ${port}`);
});
