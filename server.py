import random
import numpy as np
import pandas as pd
from sklearn.manifold import TSNE
import nltk

import gensim

import json
from flask import Flask, jsonify, render_template, request

from models.word_embeddings import get_sample_vectors
from db_utils import query_sentiment_model, random_sample
from clean_text import clean_text, remove_tags

from hierarchical_clustering import cluster_row_and_col
from reorder import reorder
from prepare_draw_data import prepare_heatmap_data


app = Flask(__name__)

# data_path='data/GoogleNews-vectors-negative300.bin'
data_path = 'models/data/glove.6B/glove.6B.50d.txt.word2vec'
model = gensim.models.KeyedVectors.load_word2vec_format(data_path, binary=False)
vocab = list(model.vocab.keys())

RB = list(map(lambda x: x[0], filter(lambda x: x[1] == 'RB', nltk.pos_tag(vocab))))

def get_sample_subset(size):
    # Get words ending with 'ly'
    # ly_words = list(filter(lambda x: x.endswith('ly'), vocab))
    # subset = random.sample(ly_words, k=size)

    # Get words with POS tag 'RB' (normal adverb) from nltk
    
    subset = random.sample(RB, k=size)

    return subset


@app.route('/embeddings', methods=['POST'])
def serve_embeddings():
    response = request.json
    print(response)
    sample_words, embeddings = get_sample_vectors(model, vocab, sample_size=int(response['sample_size']))
    return jsonify(
        sample_words=sample_words,
        embeddings=embeddings.tolist()
    )

@app.route('/neighbors', methods=['POST'])
def serve_neighbors():
    response = request.json
    print(response)
    word = response['word']
    topn = int(response['topn'])

    neighbors = [t[0] for t in model.most_similar(word, topn=topn)]
    vectors = [model.get_vector(w).tolist() for w in neighbors]

    mean = np.mean(vectors, axis=0)
    std = np.mean(vectors, axis=0)
    stats = [
        {
            'dim': i,
            'mean': val[0],
            'std': val[1]
        } for i, val in enumerate(zip(mean, std))
    ]

    return jsonify(
        subset=neighbors,
        vectors=np.transpose(vectors).tolist(),
        stats=stats
    )

@app.route('/subset', methods=['POST'])
def serve_subsets():
    response = request.json
    print(response)
    size = int(response['size'])

    vocab_subset = get_sample_subset(size=size)
    vectors = [model.get_vector(w).tolist() for w in vocab_subset]

    mean = np.mean(vectors, axis=0)
    std = np.mean(vectors, axis=0)
    stats = [
        {
            'dim': i,
            'mean': val[0],
            'std': val[1]
        } for i, val in enumerate(zip(mean, std))
    ]

    return jsonify(
        subset=vocab_subset,
        vectors=np.transpose(vectors).tolist(),
        stats=stats
    )


@app.route('/tsne', methods=['POST'])
def serve_tsne():
    response = request.json
    vectors = response['vectors']
    coords = TSNE(n_components=2).fit_transform(np.array(vectors))

    return jsonify(
        coords=coords.tolist()
    )

# Endpoint that takes query from front end and send back matched results for the query
@app.route('/query_db', methods=['POST'])
def serve_db_query():
    term = request.json['term']
    print('Query term: ', term)

    query_res = query_sentiment_model(term)
    print('Number of results: ', len(query_res))
    if len(query_res) == 0: return ('', 204)

    vectors = [elm['val'] for elm in query_res]

    # Clean the sentences and retrieve words for each sentence
    words = [clean_text(elm['sentence']) for elm in query_res]

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

    return jsonify(
        sentences=[remove_tags(elm['sentence']) for elm in query_res],
        vectors=np.transpose(vectors).tolist(),
        stats=stats,
        words=words,
        sentiments=[{
            'sentiment': elm['sentiment'],
            'confidence': elm['confidence'],
            } for elm in query_res]
    )


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
    heatmap_data = prepare_heatmap_data(vectors, cluster_results, num_of_rows=10, num_of_cols=10)

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