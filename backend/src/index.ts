import express from 'express';
import bodyParser from 'body-parser';
import { Database, aql } from 'arangojs';
import { DocumentCollection, EdgeCollection } from "arangojs/collection";

const app = express();
const port = 8080;      // default port to listen

app.use(bodyParser.json())

const systemDb = new Database({
    url: 'http://arangodb:8529',
    auth: { username: 'root', password: 'root' }
});

const dbName = 'myDatabase';
const colName = 'myCollection';

const myDb = async (): Promise<Database | undefined> => {
    try {
        let myDb = systemDb.database(dbName);
        if (!await myDb.exists()) {
            myDb = await systemDb.createDatabase(dbName);
            console.log(`Database created: ${dbName}`);
        }
        return myDb;
    } catch (err) {
        console.error(`Error creating or receiving database: ${err}`);
        return undefined;
    }
}

const myCol = async (): Promise<(DocumentCollection & EdgeCollection) | undefined> =>  {
    try {
        const db = await myDb();
        const col = db?.collection(colName);
        if (!await col?.exists()) {
            await col?.create();
        }
        return col;
    } catch (err) {
        console.error(`Error creating or receiving collection: ${err}`)
        return undefined;
    }
}

// define a route handler for the default page
// add data
app.post('/', async (req, res) => {
    const col = await myCol();
    try {
        await col?.save(req.body);
        console.log(`Successfully inserted \'${req.body._key}\'`);
        res.status(200).send({ message: 'Successfully inserted \'dhbw\'' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send({ error: err.message });
    }
});

// add data with aql
app.post('/aql', async (req, res) => {
    const db = await myDb();
    const col = await myCol();
    try {
        db?.query(aql`
            INSERT ${req.body} INTO ${col}
            OPTIONS { ignoreErrors: true }
        `);
        console.log(`Successfully inserted \'${req.body._key}\'`);
        res.status(200).send({ message: `Successfully inserted \'${req.body._key}\'` });
    } catch (err) {
        console.error(err.message);
        res.status(500).send({ error: err.message });
    }
});

// get data
app.get('/:key', async (req, res) => {
    const col = await myCol();
    try {
        const result = await col?.document(req.params.key);
        console.log(`Successfully received \'${req.params.key}\'`);
        res.status(200).send({ message: `Successfully received \'${req.params.key}\'`, value: result });
    } catch (err) {
        console.error(err.message);
        res.status(500).send({ error: err.message });
    }
});

// get data with aql
app.get('/aql/:key', async (req, res) => {
    const db = await myDb();
    const col = await myCol();
    try {
        const cursor = await db?.query(aql`
            FOR item IN ${col}
            FILTER item._key == ${req.params.key}
            RETURN item
        `);
        const result = await cursor?.all();
        console.log(`Successfully received \'${req.params.key}\'`);
        res.status(200).send({ message: `Successfully received \'${req.params.key}\'`, value: result });
    } catch (err) {
        console.error(err.message);
        res.status(500).send({ error: err.message });
    }
});

// update data
app.patch('/:key', async (req, res) => {
    const col = await myCol();
    try {
        await col?.update(req.params.key, req.body);
        console.log(`Successfully updated \'${req.params.key}\'`);
        res.status(200).send({ message: `Successfully updated \'${req.params.key}\'` });
    } catch (err) {
        console.error(err.message);
        res.status(500).send({ error: err.message });
    }
});

// update data with aql
app.patch('/aql/:key', async (req, res) => {
    const db = await myDb();
    const col = await myCol();
    try {
        await db?.query(aql`
            UPDATE ${req.params.key}
            WITH ${req.body}
            IN ${col}
            OPTIONS { ignoreErrors: true }
        `);
        console.log(`Successfully updated \'${req.params.key}\'`);
        res.status(200).send({ message: `Successfully updated \'${req.params.key}\'` });
    } catch (err) {
        console.error(err.message);
        res.status(500).send({ error: err.message });
    }
});

// delete data
app.delete('/:key', async (req, res) => {
    const col = await myCol();
    try {
        await col?.remove(req.params.key);
        console.log(`Successfully removed \'${req.params.key}\'`);
        res.status(200).send({ message: `Successfully removed \'${req.params.key}\'` });
    } catch (err) {
        console.error(err.message);
        res.status(500).send({ error: err.message });
    }
});

// delete data with aql
app.delete('/aql/:key', async (req, res) => {
    const db = await myDb();
    const col = await myCol();
    try {
        await db?.query(aql`
            REMOVE ${req.params.key} IN ${col}
            OPTIONS { ignoreErrors: true }
        `);
        console.log(`Successfully removed \'${req.params.key}\'`);
        res.status(200).send({ message: `Successfully removed \'${req.params.key}\'` });
    } catch (err) {
        console.error(err.message);
        res.status(500).send({ error: err.message });
    }
});

// start the express backend
app.listen(port, () => {
    console.log( `server started at http://localhost:${port}` );
});
