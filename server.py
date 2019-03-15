import numpy as np
import pandas as pd
from sklearn.manifold import TSNE
import umap
import itertools

from flask import Flask, jsonify, render_template, request

from db_utils import query_sentiment_model, random_sample
from clean_text import clean_text, remove_tags

from hierarchical_clustering import cluster_row_and_col
from reorder import reorder
from prepare_draw_data import prepare_heatmap_data

from server_data import BertMrpcData


app = Flask(__name__)

counter = itertools.count() # Counter to keep track of each subset request
data_dict = {} # Dictionary to store all the calculated data for each subset request

tsne_reducer = TSNE(n_components=2)
umap_reducer = umap.UMAP(n_components=2)

@app.route('/dimension_reduction', methods=['POST'])
def serve_dimension_reduction():
    response = request.json

    dm_method = response['dm_method']

    selection_model = response['selection_mode']
    data = data_dict[response['request_identifier']]

    instances = response['instances']
    dimensions = response['dimensions']

    predictions = None

    # Select and reorder data based on selection mode
    if selection_model == 'Dimensions_Only':
        dimensions = np.concatenate(response['dimensions'])
        vectors = data.vectors[:, dimensions]
        predictions = data.prediction

    elif selection_model == 'Instances_Only':
        instances = np.concatenate(response['instances'])
        vectors = data.vectors[instances, :]
        predictions = data.prediction[instances]

    elif selection_model == 'Both_Instances_and_Dimensions':
        instances = np.concatenate(response['instances'])
        dimensions = np.concatenate(response['dimensions'])
        vectors = data.vectors[instances, :]
        vectors = vectors[:, dimensions]
        predictions = data.prediction[instances]

    elif selection_model == 'Cell_Selected':
        vectors = data.vectors[instances, :]
        vectors = vectors[:, dimensions]
        predictions = data.prediction[instances]
    else:
        raise Exception()

    print('Perform dimension reduction on shape: ', vectors.shape)
    if dm_method == 'tsne':
        coords = tsne_reducer.fit_transform(vectors)
    elif dm_method == 'umap':
        coords = umap_reducer.fit_transform(vectors)
    else:
        raise Exception()

    # Process prediction data
    preds = []
    for elm in predictions:
        idx = np.argmax(elm)
        prob = elm[idx] if idx == 1 else -elm[idx]
        preds.append({
            'class': int(idx),
            'prob': float(prob)
        })

    return jsonify(
        plot_data = [{
            'coords': coord,
            'prediction': pred
        } for coord, pred in zip(coords.tolist(), preds)]
    )

@app.route('/query_bert_mrpc', methods=['POST'])
def query_bert_mrpc():
    '''
    Operation flow:
    1. Query database to get the embeddings
    2. Perform hierarchical clustering on the embeddings
    3. Prepare drawing information/data to be used in the front end
    4. Send the data back to the front end
    '''
    # Initiate data class
    bert_mrpc_data = BertMrpcData()

    # 1
    size = int(request.json['size'])
    print('Sample size: ', size)

    query_result = random_sample(size, 'bert_mrpc')

    sentences = [item['sentence'] for item in query_result]
    # reduce_mean = [item['reduce_mean'] for item in query_result]
    vectors = np.array([item['cls_token'] for item in query_result])

    prediction = np.array([item['prediction'] for item in query_result])

    # Calculate the statistics for each dimension
    mean = np.mean(vectors, axis=0)
    std = np.std(vectors, axis=0)
    print('Stats shape. Mean: {}, variance: {}'.format(mean.shape, std.shape))
    stats = [
        {
            'dim': i,
            'mean': val[0],
            'std': val[1]
        } for i, val in enumerate(zip(mean, std))
    ]

    # 2
    cluster_results = cluster_row_and_col(vectors)

    # 3
    reordered = reorder(vectors, cluster_results['row']['new_idx'], cluster_results['col']['new_idx'])

    # 4
    heatmap_data = prepare_heatmap_data(vectors, cluster_results, num_of_rows=5, num_of_cols=5)

    # Set values for the data class
    reordered = reorder(vectors, cluster_results['row']['new_idx'], cluster_results['col']['new_idx'])

    bert_mrpc_data.reordered = reordered
    bert_mrpc_data.size = size
    bert_mrpc_data.sentences = sentences
    bert_mrpc_data.vectors = vectors
    bert_mrpc_data.cluster_results = cluster_results
    bert_mrpc_data.stats = stats
    bert_mrpc_data.heatmap_data = heatmap_data
    bert_mrpc_data.prediction = prediction

    request_identifier = str(next(counter))
    data_dict[request_identifier] = bert_mrpc_data

    return jsonify(
        request_identifier=request_identifier,
        sentences=sentences,
        vectors=reordered.tolist(),
        stats=stats,
        heatmap_data=heatmap_data
    )


@app.route('/heatmap_data', methods=['POST'])
def heatmap_data():
    response = request.json

    request_identifier = response['request_identifier']
    row_num = int(response['row_num'])
    col_num = int(response['col_num'])
    
    data = data_dict[request_identifier]

    heatmap_data = prepare_heatmap_data(data.vectors, data.cluster_results, num_of_rows=row_num, num_of_cols=col_num)

    return jsonify(
        heatmap_data=heatmap_data
    )


@app.route('/')
def index():
	return render_template('main.html')

if __name__ == '__main__':
	app.run(port=5000, debug=True)