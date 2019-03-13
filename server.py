import numpy as np
import pandas as pd
from sklearn.manifold import TSNE

from flask import Flask, jsonify, render_template, request

from db_utils import query_sentiment_model, random_sample
from clean_text import clean_text, remove_tags

from hierarchical_clustering import cluster_row_and_col
from reorder import reorder
from prepare_draw_data import prepare_heatmap_data

from server_data import BertMrpcData


app = Flask(__name__)

@app.route('/tsne', methods=['POST'])
def serve_tsne():
    response = request.json
    vectors = response['vectors']
    coords = TSNE(n_components=2).fit_transform(np.array(vectors))

    return jsonify(
        coords=coords.tolist()
    )

bert_mrpc_data = BertMrpcData()

@app.route('/query_bert_mrpc', methods=['POST'])
def query_bert_mrpc():
    '''
    Operation flow:
    1. Query database to get the embeddings
    2. Perform hierarchical clustering on the embeddings
    3. Reorder the embeddings based on the clustering results
    4. Prepare drawing information/data to be used in the front end
    5. Send the data back to the front end
    '''

    # 1
    size = int(request.json['size'])
    print('Sample size: ', size)

    query_result = random_sample(size, 'bert_mrpc')

    sentences = [item['sentence'] for item in query_result]
    # reduce_mean = [item['reduce_mean'] for item in query_result]
    vectors = np.array([item['cls_token'] for item in query_result])

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
    vectors = reorder(vectors, cluster_results['row']['new_idx'], cluster_results['col']['new_idx'])

    # 4
    heatmap_data = prepare_heatmap_data(vectors, cluster_results, num_of_rows=3, num_of_cols=3)

    # Set values for the data class
    bert_mrpc_data.size = size
    bert_mrpc_data.sentences = sentences
    bert_mrpc_data.vectors = vectors
    bert_mrpc_data.stats = stats
    bert_mrpc_data.heatmap_data = heatmap_data

    return jsonify(
        sentences=sentences,
        vectors=vectors.tolist(),
        stats=stats,
        heatmap_data=heatmap_data
    )


@app.route('/')
def index():
	return render_template('main.html')

if __name__ == '__main__':
	app.run(port=5000, debug=True)