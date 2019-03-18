# Classes to manage server data

import itertools

_bert_mrpc = (
    'inputs', 'reps', 'preds', 'stats', 'heatmap_data', 'cluster_res', 'has_prediction'
)

_flair_sentiment = (
    'inputs', 'reps', 'preds', 'stats', 'heatmap_data', 'cluster_res', 'hash_prediction'
)

_glove_6b_50d = (
    'inputs', 'reps', 'preds', 'stats', 'heatmap_data', 'cluster_res', 'hash_prediction'
)

_glove_6b_100d = (
    'inputs', 'reps', 'preds', 'stats', 'heatmap_data', 'cluster_res', 'hash_prediction'
)

_glove_6b_200d = (
    'inputs', 'reps', 'preds', 'stats', 'heatmap_data', 'cluster_res', 'hash_prediction'
)

_glove_6b_300d = (
    'inputs', 'reps', 'preds', 'stats', 'heatmap_data', 'cluster_res', 'hash_prediction'
)

_word2vec = (
    'inputs', 'reps', 'preds', 'stats', 'heatmap_data', 'cluster_res', 'hash_prediction'
)


MODEL_KEY_DICT = {
    'bert_mrpc': _bert_mrpc,
    'flair_sentiment': _flair_sentiment,
    'glove_6b_50d': _glove_6b_50d,
    'glove_6b_100d': _glove_6b_100d,
    'glove_6b_200d': _glove_6b_200d,
    'glove_6b_300d': _glove_6b_300d,
    'word2vec': _word2vec
}


class ModelData:
    def __init__(self, model_name):
        self.model_name = model_name
        self.children = []
        for key in MODEL_KEY_DICT[model_name]:
            self.key = None