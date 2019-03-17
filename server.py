import numpy as np
import pandas as pd
from sklearn.manifold import TSNE
import umap
import itertools

from flask import Flask, jsonify, render_template, request

from db_utils import query_sentiment_model, random_sample, DB_KEY_DICT
from clean_text import clean_text, remove_tags

from hierarchical_clustering import cluster_row_and_col
from reorder import reorder
from prepare_draw_data import prepare_heatmap_data

from server_data import ModelData


app = Flask(__name__)

counter = itertools.count() # Counter to keep track of each subset request
data_dict = {} # Dictionary to store all the calculated data for each subset request

reducers = {
    'tsne': TSNE(n_components=2),
    'umap': umap.UMAP(n_components=2, metric='cosine')
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

    model.inputs = [item[db_keys['input']] for item in query_result]
    model.reps = np.array([item[db_keys['reps'][0]] for item in query_result])

    model.preds = np.array([item[db_keys['pred']] for item in query_result])

    # Calculate the statistics for each dimension
    mean = np.mean(model.reps, axis=0)
    std = np.std(model.reps, axis=0)
    print(f'Stats shape. Mean: {mean.shape}, variance: {std.shape}')
    model.stats = [
        {'dim': i,'mean': val[0],'std': val[1]} for i, val in enumerate(zip(mean, std))
    ]

    model.cluster_res = cluster_row_and_col(model.reps)

    model.heatmap_data = prepare_heatmap_data(model.reps, model.cluster_res, num_of_rows=ROW_NUM, num_of_cols=COL_NUM)

    # Set reodered data
    model.reps_reorder = reorder(model.reps, model.cluster_res['row']['new_idx'], model.cluster_res['col']['new_idx'])

    return model



@app.route('/dimension_reduction', methods=['POST'])
def serve_dimension_reduction():
    response = request.json

    dm_method = response['dm_method']
    data = data_dict[response['request_identifier']]

    instances = response['instances']
    dimensions = response['dimensions']

    if len(instances) == 0:
        reps = data.reps[:, dimensions]
    elif len(dimensions) == 0:
        reps = data.reps[instances, :]
    else:
        reps = data.reps[instances, :]
        reps = reps[:, dimensions]

    print(f'Perform dimension reduction on shape: {reps.shape}')
    coords = reducers[dm_method].fit_transform(reps)

    # Process prediction data
    predictions = data.preds[instances] if instances else data.preds
    preds = []
    for elm in predictions:
        idx = np.argmax(elm)
        prob = elm[idx] if idx == 1 else -elm[idx]
        preds.append({'class': int(idx),'prob': float(prob)})

    return jsonify(
        plot_data = [{'coords': coord,'prediction': pred} for coord, pred in zip(coords.tolist(), preds)]
    )

@app.route('/query_model_data', methods=['POST'])
def query_model_data():
    response = request.json

    model_name = response['model_name']
    db_col_name = response['db_col_name']

    sample_size = int(response['sample_size'])
    print(f'Sample size: {sample_size}')

    # Query results from db
    query_result = random_sample(sample_size, db_col_name)

    # Use the queried results to fill the ModelData class
    model = fill_model_data(query_result, model_name)

    # Store the created and filled ModelData object to a dictionary for later use
    request_identifier = str(next(counter))
    data_dict[request_identifier] = model

    return jsonify(
        request_identifier=request_identifier,
        sentences=model.inputs,
        vectors=model.reps_reorder.tolist(),
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


@app.route('/')
def index():
	return render_template('main.html')

if __name__ == '__main__':
	app.run(port=5000, debug=True)