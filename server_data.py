# Classes to manage server data

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


_model_key_dict = {
    'bert_mrpc': _bert_mrpc,
    'flair_sentiment': _flair_sentiment,
    'glove_6b_50d': _glove_6b_50d,
    'glove_6b_100d': _glove_6b_100d,
    'glove_6b_200d': _glove_6b_200d,
    'glove_6b_300d': _glove_6b_300d,
}


class ModelData:
    def __init__(self, model_name):
        for key in _model_key_dict[model_name]:
            self.key = None