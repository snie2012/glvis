from pymongo import MongoClient

# Init client
client = MongoClient()

# Specify which db to use
db = client['glvis_db']


_bert_mrpc_db_key_dict = {
    'input': 'sentence',
    'reps': ['cls_token', 'reduce_mean'],
    'pred': 'prediction'
}

DB_KEY_DICT = {
    'bert_mrpc': _bert_mrpc_db_key_dict
}


def query_sentiment_model(term, collection='flattened'):
    # Query the sentiment model data
    pipeline = {
        '$text': {'$search': '\"{}\"'.format(term)}
    }

    return list(db[collection].find(pipeline))


def random_sample(size, collection):
    pipeline = [
        {'$sample': {'size': size}}
    ]

    return list(db[collection].aggregate(pipeline))