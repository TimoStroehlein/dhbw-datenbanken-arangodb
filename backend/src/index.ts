import express from 'express';
import { Database, aql } from 'arangojs';
import { DocumentCollection, EdgeCollection } from "arangojs/collection";

const app = express();
const port = 8080;      // default port to listen

const systemDb = new Database({
    url: 'http://arangodb:8529',
    auth: { username: 'root', password: 'root' }
});

const dbName = 'myDatabase';
const colName = 'myCollection';

const myDb = async (): Promise<Database | undefined> => {
    try {
        const myDb = await systemDb.createDatabase(dbName);
        console.log(`Database created: ${dbName}`);
        return myDb;
    } catch (err) {
        try {
            return await systemDb.database(dbName);
        } catch (err) {
            console.error(`Error creating or receiving database: ${err}`);
            return undefined;
        }
    }
}

const myCol = async (): Promise<(DocumentCollection & EdgeCollection) | undefined> =>  {
    const db = await myDb();
    const col = db?.collection(colName);
    try {
        await col?.create();
    } catch(err) {}
    try {
        await col?.get();
        return col;
    } catch (err) {
        console.error(`Error creating or receiving collection: ${err}`)
        return undefined;
    }
}

const data = {
    _key: 'dhbw',
    name: 'DHBW',
    location: 'Stuttgart'
}

const updateLocation = {
    location: 'Heilbronn'
}

// define a route handler for the default page
// add data
app.post('/', async (req, res) => {
    const col = await myCol();
    try {
        await col?.save(data);
        console.log('Successfully inserted \'dhbw\'');
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
            UPSERT { _key: "dhbw" }
            INSERT ${data} IN ${col}
        `);
        console.log('Successfully inserted \'dhbw\'');
        res.status(200).send({ message: 'Successfully inserted \'dhbw\'' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send({ error: err.message });
    }
});

// get data
app.get('/', async (req, res) => {
    const col = await myCol();
    try {
        const item = await col?.document('dhbw');
        console.log('Successfully received \'dhbw\'');
        res.status(200).send({ message: 'Successfully received \'dhbw\'', value: item });
    } catch (err) {
        console.error(err.message);
        res.status(500).send({ error: err.message });
    }
});

// get data with aql
app.get('/aql', async (req, res) => {
    const db = await myDb();
    const col = await myCol();
    try {
        const item = await db?.query(aql`
            FOR item IN ${col}
            FILTER item._key == "dhbw"
            RETURN item
        `);
        console.log('Successfully received \'dhbw\'');
        res.status(200).send({ message: 'Successfully received \'dhbw\'', value: item });
    } catch (err) {
        console.error(err.message);
        res.status(500).send({ error: err.message });
    }
});

// update data
app.patch('/', async (req, res) => {
    const col = await myCol();
    try {
        await col?.update('dhbw', updateLocation);
        console.log('Successfully updated \'dhbw\'');
        res.status(200).send({ message: 'Successfully updated \'dhbw\'' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send({ error: err.message });
    }
});

// update data with aql
app.post('/aql', async (req, res) => {
    const db = await myDb();
    const col = await myCol();
    try {
        await db?.query(aql`
            UPDATE "dhbw" WITH {
                location: "Heilbronn"
            } IN ${col}
        `);
        console.log('Successfully updated \'dhbw\'');
        res.status(200).send({ message: 'Successfully updated \'dhbw\'' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send({ error: err.message });
    }
});

// delete data
app.delete('/', async (req, res) => {
    const col = await myCol();
    try {
        await col?.remove('dhbw');
        console.log('Successfully removed \'dhbw\'');
        res.status(200).send({ message: 'Successfully removed \'dhbw\'' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send({ error: err.message });
    }
});

// delete data with aql
app.delete('/aql', async (req, res) => {
    const db = await myDb();
    const col = await myCol();
    try {
        await db?.query(aql`
            REMOVE "dhbw" IN ${col}
        `);
        console.log('Successfully removed \'dhbw\'');
        res.status(200).send({ message: 'Successfully removed \'dhbw\'' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send({ error: err.message });
    }
});

// start the express backend
app.listen(port, () => {
    console.log( `server started at http://localhost:${port}` );
});
