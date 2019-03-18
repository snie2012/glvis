from pymongo import MongoClient

# Init client
client = MongoClient()

# Specify which db to use
db = client['glvis_db']


_bert_mrpc = {
    'input': 'sentence',
    'reps': ['cls_token', 'reduce_mean'],
    'pred': 'prediction',
    'has_prediction': True
}

_flair_sentiment = {
    'input': 'sentence',
    'reps': ['val'],
    'pred': 'prediction',
    'has_prediction': True
}

_glove_6b_50d = {
    'input': 'word',
    'reps': ['embedding'],
    'has_prediction': False
}

_glove_6b_100d = {
    'input': 'word',
    'reps': ['embedding'],
    'has_prediction': False
}

_glove_6b_200d = {
    'input': 'word',
    'reps': ['embedding'],
    'has_prediction': False
}

_glove_6b_300d = {
    'input': 'word',
    'reps': ['embedding'],
    'has_prediction': False
}

_word2vec = {
    'input': 'word',
    'reps': ['embedding'],
    'has_prediction': False
}

DB_KEY_DICT = {
    'bert_mrpc': _bert_mrpc,
    'flair_sentiment': _flair_sentiment,
    'glove_6b_50d': _glove_6b_50d,
    'glove_6b_100d': _glove_6b_100d,
    'glove_6b_200d': _glove_6b_200d,
    'glove_6b_300d': _glove_6b_300d,
    'word2vec': _word2vec
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

    return list(db[collection].aggregate(pipeline, allowDiskUse=True))