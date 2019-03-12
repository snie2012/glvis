from pymongo import MongoClient

# Init client
client = MongoClient()

# Specify which db to use
db = client['glvis_db']

# Define a function what takes a query and return the matched results from the database.
def query_sentiment_model(term, collection='flattened'):
    pipeline = {
        '$text': {'$search': '\"{}\"'.format(term)}
    }

    return list(db[collection].find(pipeline))

