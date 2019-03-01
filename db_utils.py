from pymongo import MongoClient

# Init client
client = MongoClient()

# Specify which db to use
db_name = 'glvis_db'
db = client[db_name]

# Specify which collection to use
col_name = 'flattened'
collection = db[col_name]

# Define a function what takes a query and return the matched results from the database.
def query(term):
    pipeline = {
        '$text': {'$search': '\"{}\"'.format(term)}
    }

    return list(collection.find(pipeline))

