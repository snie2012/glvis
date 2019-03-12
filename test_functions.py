import numpy as np

from db_utils import query_sentiment_model, random_sample

from hierarchical_clustering import cluster_row_and_col
from reorder import reorder
from prepare_draw_data import prepare_heatmap_data
from flask import jsonify


def test_query_bert_mrpc():
    '''
    Operation flow:
    1. Query database to get the embeddings
    2. Perform hierarchical clustering on the embeddings
    3. Reorder the embeddings based on the clustering results
    4. Prepare drawing information/data to be used in the front end
    5. Send the data back to the front end
    '''

    # 1
    size = 50

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

    # 4
    heatmap_data = prepare_heatmap_data(vectors, cluster_results, num_of_rows=10, num_of_cols=10)

    return {
        'sentences': sentences,
        'vectors': vectors,
        'stats': stats,
        'heatmap_data': heatmap_data
    }