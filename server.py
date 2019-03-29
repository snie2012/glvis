import numpy as np
import pandas as pd
# from sklearn.manifold import TSNE
# from tsnecuda import TSNE
from MulticoreTSNE import MulticoreTSNE as TSNE
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
    'tsne': TSNE(n_components=2, n_jobs=8),
    'umap': umap.UMAP(n_components=2, metric='correlation')
}

def fill_model_data(query_result, model_name, cluster_method):
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

    model.input_type = db_keys['input_type']
    model.inputs = np.array([item[db_keys['input']] for item in query_result])
    if model.input_type == 'sentence':
        model.cleaned_inputs = [clean_text(s) for s in model.inputs]
    model.inputs_length = [len(item.split(' ')) for item in model.inputs]

    model.reps = np.array([item[db_keys['reps'][0]] for item in query_result])

    # Check whether the model's tag_type (prediction, binary, multiclass)
    model.tag_type = db_keys['tag_type']
    if model.tag_type == 'no_tag':
        model.preds = []
    elif model.tag_type == 'binary':
        model.preds = [item[db_keys['pred']] for item in query_result]
    elif model.tag_type == 'multiclass':
        model.preds = [item[db_keys['pred']] for item in query_result]
        model.tag_dict = db_keys['tag_dict']
    else:
        raise Exception()

    model.dim_groups, model.inst_groups = sep_clustering(model.reps, cluster_method)

    model.heatmap_data = prepare_sep_data(model.reps, model.dim_groups, model.inst_groups, num_of_dims=2)

    return model

@app.route('/dimension_reduction', methods=['POST'])
def serve_dimension_reduction():
    response = request.json

    model = data_dict[response['request_identifier']]
    dm_method = response['dm_method']
    dimensions = response['dimensions']
    reps = model.reps[:, dimensions]
    
    print(f'Using: {dm_method}')
    print(f'Perform dimension reduction on shape: {reps.shape}')
    coords = reducers[dm_method].fit_transform(reps)

    return jsonify(
        coords=coords.tolist()
    )

@app.route('/query_model_data', methods=['POST'])
def query_model_data():
    response = request.json

    model_name = response['model_name']
    db_col_name = response['db_col_name']
    query_method = response['query_method']
    query_input = response['query_input']
    cluster_method = response['cluster_method']

    if query_method == 'random_sample':
        print(f'Sample size: {query_input}')
        query_result = random_sample(int(query_input), db_col_name)
    elif query_method == 'text_match':
        print(f'Query term: {query_input}')
        query_result = text_match(query_input, db_col_name)
    else:
        raise Exception()

    if not query_result or len(query_result) < 2:
        abort(400, 'Empty query result')

    # Use the queried results to fill the ModelData class
    model = fill_model_data(query_result, model_name, cluster_method)

    # Store the created and filled ModelData object to a dictionary for later use
    request_identifier = str(next(counter))
    data_dict[request_identifier] = model

    return jsonify(
        request_identifier=request_identifier,
        num_of_inputs=model.reps.shape[0],
        num_of_dims=model.reps.shape[1],
        tag_dict=model.tag_dict if model.tag_type == 'multiclass' else 0,
        tag_type=model.tag_type,
        input_type=model.input_type,
        inputs=model.inputs.tolist(),
        inputs_length=model.inputs_length,
        cleaned_inputs=model.cleaned_inputs if model.input_type == 'sentence' else 'no cleaned input',
        # vectors=model.reps.tolist(),
        predictions=model.preds,
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