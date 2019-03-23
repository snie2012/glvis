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

_flair_sentiment_linear = {
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

_flair_ner_linear = {
    'input': 'text',
    'reps': ['linear_layer_state'],
    'pred': 'tag',
    'tag_type': 'multiclass',
    'tag_dict': {tag: i for i, tag in enumerate(['LOC', 'MISC', 'ORG', 'PER'])}
}

_flair_pos_linear = {
    'input': 'text',
    'reps': ['linear_layer_state'],
    'pred': 'tag',
    'tag_type': 'multiclass',
    'tag_dict': {tag: i for i, tag in enumerate([
        '$',
        "''",
        ',',
        '-LRB-',
        '-RRB-',
        '.',
        ':',
        'ADD',
        'AFX',
        'CC',
        'CD',
        'DT',
        'EX',
        'FW',
        'HYPH',
        'IN',
        'JJ',
        'JJR',
        'JJS',
        'LS',
        'MD',
        'NFP',
        'NN',
        'NNP',
        'NNPS',
        'NNS',
        'PDT',
        'POS',
        'PRP',
        'PRP$',
        'RB',
        'RBR',
        'RBS',
        'RP',
        'SYM',
        'TO',
        'UH',
        'VB',
        'VBD',
        'VBG',
        'VBN',
        'VBP',
        'VBZ',
        'WDT',
        'WP',
        'WP$',
        'WRB',
        'XX',
        '``'
    ])}
}

_flair_chunk_linear = {
    'input': 'text',
    'reps': ['linear_layer_state'],
    'pred': 'tag',
    'tag_type': 'multiclass',
    'tag_dict': {tag: i for i, tag in enumerate([
        'VP',
        'CONJP',
        'PRT',
        'ADVP',
        'UCP',
        'SBAR',
        'NP',
        'LST',
        'PP',
        'INTJ',
        'ADJP'
    ])}
}

_flair_ner_embedding2nn = {
    'input': 'text',
    'reps': ['embedding2nn'],
    'pred': 'tag',
    'tag_type': 'multiclass',
    'tag_dict': {tag: i for i, tag in enumerate(['LOC', 'MISC', 'ORG', 'PER'])}
}

_flair_pos_embedding2nn = {
    'input': 'text',
    'reps': ['embedding2nn'],
    'pred': 'tag',
    'tag_type': 'multiclass',
    'tag_dict': {tag: i for i, tag in enumerate([
        '$',
        "''",
        ',',
        '-LRB-',
        '-RRB-',
        '.',
        ':',
        'ADD',
        'AFX',
        'CC',
        'CD',
        'DT',
        'EX',
        'FW',
        'HYPH',
        'IN',
        'JJ',
        'JJR',
        'JJS',
        'LS',
        'MD',
        'NFP',
        'NN',
        'NNP',
        'NNPS',
        'NNS',
        'PDT',
        'POS',
        'PRP',
        'PRP$',
        'RB',
        'RBR',
        'RBS',
        'RP',
        'SYM',
        'TO',
        'UH',
        'VB',
        'VBD',
        'VBG',
        'VBN',
        'VBP',
        'VBZ',
        'WDT',
        'WP',
        'WP$',
        'WRB',
        'XX',
        '``'
    ])}
}

_flair_chunk_embedding2nn = {
    'input': 'text',
    'reps': ['embedding2nn'],
    'pred': 'tag',
    'tag_type': 'multiclass',
    'tag_dict': {tag: i for i, tag in enumerate([
        'VP',
        'CONJP',
        'PRT',
        'ADVP',
        'UCP',
        'SBAR',
        'NP',
        'LST',
        'PP',
        'INTJ',
        'ADJP'
    ])}
}


DB_KEY_DICT = {
    'bert_mrpc': _bert_mrpc,
    'flair_sentiment_linear': _flair_sentiment_linear,
    'glove_6b_50d': _glove_6b_50d,
    'glove_6b_100d': _glove_6b_100d,
    'glove_6b_200d': _glove_6b_200d,
    'glove_6b_300d': _glove_6b_300d,
    'word2vec': _word2vec,
    'flair_ner_linear': _flair_ner_linear,
    'flair_pos_linear': _flair_pos_linear,
    'flair_chunk_linear': _flair_chunk_linear,
    'flair_ner_embedding2nn': _flair_ner_embedding2nn,
    'flair_pos_embedding2nn': _flair_pos_embedding2nn,
    'flair_chunk_embedding2nn': _flair_chunk_embedding2nn,
}


def text_match(term, collection, limit=2000):
    # Query the sentiment model data
    pipeline = {
        '$text': {'$search': f'{term}'}
    }

    return list(db[collection].find(pipeline).limit(limit))


def random_sample(size, collection):
    pipeline = [
        {'$sample': {'size': size}}
    ]

    return list(db[collection].aggregate(pipeline, allowDiskUse=True))