from pymongo import MongoClient

# Init client
client = MongoClient()

# Specify which db to use
db = client['glvis_db']


_bert_mrpc = {
    'input': 'sentence',
    'reps': ['cls_token', 'reduce_mean'],
    'pred': 'prediction',
    'tag_type': 'binary'
}

_flair_sentiment = {
    'input': 'sentence',
    'reps': ['val'],
    'pred': 'prediction',
    'tag_type': 'binary'
}

_glove_6b_50d = {
    'input': 'word',
    'reps': ['embedding'],
    'tag_type': 'no_tag'
}

_glove_6b_100d = {
    'input': 'word',
    'reps': ['embedding'],
    'tag_type': 'no_tag'
}

_glove_6b_200d = {
    'input': 'word',
    'reps': ['embedding'],
    'tag_type': 'no_tag'
}

_glove_6b_300d = {
    'input': 'word',
    'reps': ['embedding'],
    'tag_type': 'no_tag'
}

_word2vec = {
    'input': 'word',
    'reps': ['embedding'],
    'tag_type': 'no_tag'
}

_flair_ner = {
    'input': 'text',
    'reps': ['linear_layer_state'],
    'pred': 'tag',
    'tag_type': 'multiclass',
    'tag_dict': {tag: i for i, tag in enumerate(['LOC', 'MISC', 'ORG', 'PER'])}
}

DB_KEY_DICT = {
    'bert_mrpc': _bert_mrpc,
    'flair_sentiment': _flair_sentiment,
    'glove_6b_50d': _glove_6b_50d,
    'glove_6b_100d': _glove_6b_100d,
    'glove_6b_200d': _glove_6b_200d,
    'glove_6b_300d': _glove_6b_300d,
    'word2vec': _word2vec,
    'flair_ner': _flair_ner
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