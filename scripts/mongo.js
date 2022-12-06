// const { MongoClient } = require('mongodb');

import { MongoClient } from 'mongodb';

const uri = "mongodb+srv://dbuser:u8QXNaLsgPie4749@cluster0.z9zkrwk.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri);
const database = client.db('vocabulist');
const user_lists = database.collection('user_lists');

async function main() {
    try {
        // await client.connect();
        // await listDatabases();
        // await getAllData();
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

async function listDatabases() {
    try {
        databasesList = await client.db().admin().listDatabases();
    
        console.log("Databases:");
        databasesList.databases.forEach(db => console.log('- ' + db.name));

    } catch (e) {
        console.error(e);
    } 
} 

/**
 * gets all data from all documents
 * @returns array of all data
 */
export async function getAllData() {
    try {
        return await user_lists.find().toArray();
        // console.log(data);

    } catch (e) {
        console.error(e);
    } 
}

/** 
 * checks if user exists
 * @returns true if exists, false if not
 */
export async function userExists(username) {
    try {
        let result = await user_lists.find({ "username": username }).toArray();

        console.log("num users: " + result.length);
        if (result.length) {
            return true;
        }
        return false;
    } catch (e) {
        console.error(e);
    }
}

/**
 * creates new user if provided username is not already in use
 * @param {String} username 
 */
export async function createNewUser(username) {
    try {
        if (!(await userExists(username))) {
            let newData = { "username": username, "lists": [], "folders": [] };
            await user_lists.insertOne(newData);
            console.log("new user " + username + " inserted");
        } else {
            console.log("user " + username + " already exists, aborting insert");
        }        
    } catch (e) {
        console.error(e);
    }
}

/**
 * checks if list exists based on name for specified user
 * @param {String} username 
 * @param {String} listName 
 * @returns true if list exists for user, false otherwise
 */
export async function listExists(username, listName) {
    try {
        let result = await user_lists.find({ "username": username, "lists.list_name": listName }).toArray();

        console.log("num lists: " + result.length);
        if (result.length) {
            return true;
        }
        return false;
    } catch (e) {
        console.error(e);
    }
}

/**
 * creates a new list for specified user
 * ASSUMES: user exists
 * adds metadata and an empty array for words
 * @param {String} username 
 * @param {String} listName 
 * @param {String} listDescription 
 */
export async function createNewList(username, listName, listDescription) {
    try {
        if (!(await listExists(username, listName))) {
            await user_lists.updateOne({ "username": username },  
                { $addToSet: 
                    { "lists": { 
                        "list_name": listName,
                        "list_description": listDescription,
                        "date_created": new Date(),
                        "words": [],
                        "favorites": [] } } });
            console.log("new list " + listName + " inserted for user " + username);
        } else {
            console.log("list with name " + listName + " already exists for user " + username + ", aborting insert");
        }
    } catch (e) {
        console.error(e);
    }
}

/**
 * adds words to existing list for specified user
 * ASSUMES: user exists, list exists
 * does not add duplicates
 * @param {String} username
 * @param {String} listName
 * @param {Array} words 
 */
export async function addWordsToList(username, listName, words) {
    try {
        await user_lists.updateOne({ "username": username, "lists.list_name": listName },  { $addToSet: { "lists.$.words": { $each: words } } });
    } catch (e) {
        console.error(e);
    }
}

/**
 * gets array of words from specified list for specified user
 * ASSUMES: user exists, list exists
 * @param {String} username 
 * @param {String} listName 
 * @returns array of words
 */
export async function getWordsFromList(username, listName) {
    try {
        console.log("getting words from list " + listName);
        let result = await user_lists.find({ "username": username, "lists.list_name": listName }).toArray();
        let words = await result[0].lists.find(list => list.list_name == listName).words;
        return words;
    } catch (e) {
        console.error(e);
    }
}

/**
 * adds array of words to favorites for a specified list and user
 * ASSUMES: user exists, list exists, words exist in list
 * does not add duplicates
 * @param {String} username 
 * @param {String} listName 
 * @param {Array} words 
 */
export async function addWordsToFavorites(username, listName, words) {
    try {
        await user_lists.updateOne({ "username": username, "lists.list_name": listName },  { $addToSet: { "lists.$.favorites": { $each: words } } });
    } catch (e) {
        console.error(e);
    }
}

/**
 * gets words designated as favorites from specified list for specified user
 * ASSUMES: user exists, list exists
 * @param {String} username
 * @param {String} listName
 * @returns array of favorites
 */
export async function getWordsFromFavorites(username, listName) {
    try {
        console.log("getting favorites from list " + listName);
        let result = await user_lists.find({ "username": username }).toArray();
        let favorites = await result[0].lists.find(list => list.list_name == listName).favorites;
        return favorites;
    } catch (e) {
        console.error(e);
    }
}

/**
 * adds an object to the folder array consisting of a key that is the name of the folder and value of an empty array
 * ASSUMES: user exists
 * @param {String} username 
 * @param {String} folderName 
 */
export async function createNewFolder(username, folderName) {
    try {
        await user_lists.updateOne({ "username": username, "folders.folder_name": { $ne: folderName } }, { $addToSet: { "folders": { "folder_name": folderName, "folder_lists": [] } } } );
    } catch (e) {
        console.error(e);
    }
}

export async function getFolderNames(username) {
    try {
        let result = await user_lists.find({ "username": username }).toArray();
        let folderNames = [];
        for (let i = 0; i < result[0].folders.length; i++) {
            folderNames.push(result[0].folders[i].folder_name);
        }
        return folderNames;
    } catch (e) {
        console.error(e);
    }
}

/**
 * adds list names to specified folder for specified user
 * ASSUMES: user exists, folder exists, lists exist
 * @param {String} username 
 * @param {String} folderName 
 * @param {Array} listNames 
 */
export async function addListsToFolder(username, folderName, listNames) {
    try {
        await user_lists.updateOne({ "username": username, "folders.folder_name": folderName}, { $addToSet: { "folders.$.folder_lists": { $each: listNames }}})
    } catch (e) {
        console.error(e);
    }
}

/**
 * gets names of lists that have been added to specified folder for specified user
 * ASSUMES: user exists, folder exists
 * @param {String} username 
 * @param {String} folderName 
 * @returns array of list names
 */
export async function getListsFromFolder(username, folderName) {
    try {
        console.log("getting lists from folder " + folderName);
        let result = await user_lists.find({ "username": username }).toArray();
        let lists = await result[0].folders.find(folder => folder.folder_name == folderName).folder_lists;
        return lists;
    } catch (e) {
        console.error(e);
    }
}

/**
 * removes words from specified list for specified user
 * ASSUMES: user exists, list exists, all words to be removed exist
 * @param {String} username 
 * @param {Array} words - words to remove
 */
export async function removeWordsFromList(username, listName, words) {
    try {
        await user_lists.updateOne({ "username": username, "lists.list_name": listName },  { $pull: { "lists.$.words": { $in: words } } });
    } catch (e) {
        console.error(e);
    }
}

export async function removeWordsFromFavorites(username, listName, words) {
    try {
        await user_lists.updateOne({ "username": username, "lists.list_name": listName },  { $pull: { "lists.$.favorites": { $in: words } } });
    } catch (e) {
        console.error(e);
    }
}

export async function removeListsFromFolder(username, folderName, listNames) {
    try {
        await user_lists.updateOne({ "username": username, "folders.folder_name": folderName}, { $pull: { "folders.$.folder_lists": { $in: listNames }}});
    } catch (e) {
        console.error(e);
    }
}

export async function removeFolder(username, folderName) {
    try {
        await user_lists.updateOne({ "username": username }, { $pull: { "folders": { "folder_name": folderName } }});
    } catch (e) {
        console.error(e);
    }
}

export async function removeList(username, listName) {
    try {
        await user_lists.updateOne({ "username": username }, { $pull: { "lists": { "list_name": listName } }});
    } catch (e) {
        console.error(e);
    }
}

export async function closeConnection() {
    await client.close();
}