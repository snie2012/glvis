import numpy as np
import pandas as pd
from sklearn.manifold import TSNE
import umap
import itertools

from flask import Flask, jsonify, render_template, request, abort

from db_utils import random_sample, text_match, DB_KEY_DICT
from clean_text import clean_text, remove_tags

from sep_clustering import sep_clustering
from dim_inst_data import prepare_sep_data

from server_data import ModelData


app = Flask(__name__)

counter = itertools.count() # Counter to keep track of each subset request
data_dict = {} # Dictionary to store all the calculated data for each subset request

reducers = {
    'tsne': TSNE(n_components=2),
    'umap': umap.UMAP(n_components=2, metric='correlation')
}

# Default number of row and column clusters
ROW_NUM = 2
COL_NUM = 3


def fill_model_data(query_result, model_name='bert_mrpc'):
    '''
    Operation flow:
    1. Query database to get the embeddings
    2. Perform hierarchical clustering on the embeddings
    3. Prepare drawing information/data to be used in the front end
    4. Send the data back to the front end
    '''
    # Initiate data class
    model = ModelData(model_name)
    db_keys = DB_KEY_DICT[model_name]

    model.inputs = np.array([item[db_keys['input']] for item in query_result])
    model.reps = np.array([item[db_keys['reps'][0]] for item in query_result])

    # Check whether the model's tag_type (prediction, binary, multiclass)
    model.tag_type = db_keys['tag_type']
    if model.tag_type == 'no_tag':
        pass
    elif model.tag_type == 'binary':
        model.preds = np.array([item[db_keys['pred']] for item in query_result])
    elif model.tag_type == 'multiclass':
        model.preds = np.array([item[db_keys['pred']] for item in query_result])
        model.tag_dict = db_keys['tag_dict']
    else:
        raise Exception()

    # Calculate the statistics for each dimension
    mean = np.mean(model.reps, axis=0)
    std = np.std(model.reps, axis=0)
    print(f'Stats shape. Mean: {mean.shape}, variance: {std.shape}')
    model.stats = [
        {'dim': i,'mean': val[0],'std': val[1]} for i, val in enumerate(zip(mean, std))
    ]

    model.dim_groups, model.inst_groups = sep_clustering(model.reps)

    model.heatmap_data = prepare_sep_data(model.reps, model.dim_groups, model.inst_groups, num_of_dims=COL_NUM)

    return model

@app.route('/dimension_reduction', methods=['POST'])
def serve_dimension_reduction():
    response = request.json

    dm_method = response['dm_method']
    model = data_dict[response['request_identifier']]

    instances = response['instances']
    inst_group_ids = []
    instances_flatten = []
    for i, g in enumerate(instances):
        inst_group_ids += [i] * len(g)
        instances_flatten += g

    dimensions = response['dimensions']
    reps = model.reps[instances_flatten, :][:, dimensions]
    
    print(f'Perform dimension reduction on shape: {reps.shape}')
    coords = reducers[dm_method].fit_transform(reps)

    input_data = model.inputs[instances_flatten]

    # Process prediction data if the model has prediction data
    response_data = [
        {'coords': coord, 'input': input_d, 'instance_id': inst, 'group_id': g_id} for coord, input_d, inst, g_id in zip(coords.tolist(), input_data, instances_flatten, inst_group_ids)
    ]

    if model.tag_type == 'no_tag':
        pass
    elif model.tag_type == 'binary':
        predictions = model.preds[instances_flatten]
        for i, elm in enumerate(predictions):
            idx = np.argmax(elm)
            prob = elm[idx] if idx == 0 else -elm[idx]
            response_data[i]['prediction'] = {'class': int(idx),'prob': float(prob)}
    elif model.tag_type == 'multiclass':
        predictions = model.preds[instances_flatten]
        tags = [model.tag_dict[tag] for tag in predictions]
        for i in range(len(predictions)):
            response_data[i]['prediction'] = tags[i]
            response_data[i]['tag'] = predictions[i]
    else:
        raise Exception()

    return jsonify(
        tag_type=model.tag_type,
        plot_data=response_data
    )

@app.route('/query_model_data', methods=['POST'])
def query_model_data():
    response = request.json

    model_name = response['model_name']
    db_col_name = response['db_col_name']
    query_method = response['query_method']

    if query_method == 'random_sample':
        sample_size = int(response['sample_size'])
        print(f'Sample size: {sample_size}')
        query_result = random_sample(sample_size, db_col_name)
    elif query_method == 'text_match':
        term = response['term']
        print(f'Query term: {term}')
        query_result = text_match(term, db_col_name)
    else:
        raise Exception()

    if not query_result or len(query_result) < 2:
        abort(400, 'Empty query result')

    # Use the queried results to fill the ModelData class
    model = fill_model_data(query_result, model_name)

    # Store the created and filled ModelData object to a dictionary for later use
    request_identifier = str(next(counter))
    data_dict[request_identifier] = model

    return jsonify(
        request_identifier=request_identifier,
        vectors=model.reps.tolist(),
        stats=model.stats,
        heatmap_data=model.heatmap_data
    )


@app.route('/heatmap_data', methods=['POST'])
def heatmap_data():
    response = request.json
    
    model = data_dict[response['request_identifier']]
    dim_num = response['dim_num']
    insts_nums = response['insts_nums']

    heatmap_data = prepare_sep_data(model.reps, model.dim_groups, model.inst_groups, num_of_dims=dim_num, num_of_instances=insts_nums)

    return jsonify(
        heatmap_data=heatmap_data
    )

@app.errorhandler(400)
def abort400(error):
    response = jsonify({'message': error.description})
    return response

@app.route('/')
def index():
	return render_template('main.html')

if __name__ == '__main__':
	app.run(port=5000, debug=True)