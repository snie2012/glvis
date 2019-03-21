import numpy as np
import pandas as pd
from sklearn.manifold import TSNE
import umap
import itertools

from flask import Flask, jsonify, render_template, request, abort

from db_utils import random_sample, text_match, DB_KEY_DICT
from clean_text import clean_text, remove_tags

from hierarchical_clustering import cluster_row_and_col
from prepare_draw_data import prepare_heatmap_data

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

    model.cluster_res = cluster_row_and_col(model.reps)

    model.heatmap_data = prepare_heatmap_data(model.reps, model.cluster_res, num_of_rows=ROW_NUM, num_of_cols=COL_NUM)

    return model

@app.route('/dimension_reduction', methods=['POST'])
def serve_dimension_reduction():
    response = request.json

    dm_method = response['dm_method']
    model = data_dict[response['request_identifier']]

    instances = response['instances']
    dimensions = response['dimensions']

    if len(instances) == 0:
        instances = list(range(len(model.inputs)))
        reps = model.reps[:, dimensions]
        # random_dims = np.random.choice(model.reps.shape[1], len(dimensions), replace=False)
        # random_dims.sort()
        # print(random_dims)
        # reps = model.reps[:, random_dims]
    elif len(dimensions) == 0:
        reps = model.reps[instances, :]
    else:
        reps = model.reps[instances, :]
        reps = reps[:, dimensions]

    print(f'Perform dimension reduction on shape: {reps.shape}')
    coords = reducers[dm_method].fit_transform(reps)

    input_data = model.inputs[instances]

    # Process prediction data if the model has prediction data
    if model.tag_type == 'no_tag':
        response_data = [
            {'coords': coord, 'input': input_d} for coord, input_d in zip(coords.tolist(), input_data)
        ]
    elif model.tag_type == 'binary':
        predictions = model.preds[instances]
        preds = []
        for elm in predictions:
            idx = np.argmax(elm)
            prob = elm[idx] if idx == 0 else -elm[idx]
            preds.append({'class': int(idx),'prob': float(prob)})
        response_data = [{'coords': coord, 'prediction': pred, 'input': input_d} for coord, pred, input_d in zip(coords.tolist(), preds, input_data)]
    elif model.tag_type == 'multiclass':
        predictions = model.preds[instances]
        preds = [model.tag_dict[tag] for tag in predictions]

        response_data = [{'coords': coord, 'prediction': pred, 'input':input_d, 'tag': tag} for coord, pred, input_d, tag in zip(coords.tolist(), preds, input_data, predictions)]
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

    if not query_result:
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

    heatmap_data = prepare_heatmap_data(model.reps, model.cluster_res, num_of_rows=int(response['row_num']), num_of_cols=int(response['col_num']))

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