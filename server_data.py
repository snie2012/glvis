# Classes to manage server data

_bert_mrpc_key_set = (
    'size', 'inputs', 'reps', 'preds', 'stats', 'heatmap_data', 'cluster_res'
)

_model_key_dict = {
    'bert_mrpc': _bert_mrpc_key_set
}

class ModelData:
    def __init__(self, model_name='bert_mrpc'):
        for key in _model_key_dict[model_name]:
            self.key = None