import sys
# sys.path.append('../languagernn/common/')
# sys.path.append('../languagernn/language_model/')
# sys.path.append('../languagernn/language_model/transparent_rnn/')

import random
import numpy as np
import pandas as pd
from sklearn.manifold import TSNE
import nltk

import gensim

import json
from flask import Flask, jsonify, render_template, request
app = Flask(__name__)

from models.word_embeddings import get_sample_vectors

# data_path='data/GoogleNews-vectors-negative300.bin'
data_path = 'data/glove.6B/glove.6B.50d.txt.word2vec'
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

    stats = pd.DataFrame(columns=['dim', 'mean', 'std'])
    stats['mean'] = np.mean(vectors, axis=0)
    stats['std'] = np.std(vectors, axis=0)
    stats['dim'] = np.arange(len(stats['mean']))

    return jsonify(
        subset=neighbors,
        vectors=np.transpose(vectors).tolist(),
        stats=stats.to_dict(orient='records')
    )

@app.route('/subset', methods=['POST'])
def serve_subsets():
    response = request.json
    print(response)
    size = int(response['size'])

    vocab_subset = get_sample_subset(size=size)
    vectors = [model.get_vector(w).tolist() for w in vocab_subset]

    stats = pd.DataFrame(columns=['dim', 'mean', 'std'])
    stats['mean'] = np.mean(vectors, axis=0)
    stats['std'] = np.std(vectors, axis=0)
    stats['dim'] = np.arange(len(stats['mean']))

    return jsonify(
        subset=vocab_subset,
        vectors=np.transpose(vectors).tolist(),
        stats=stats.to_dict(orient='records')
    )


@app.route('/tsne', methods=['POST'])
def serve_tsne():
    response = request.json
    vectors = response['vectors']
    coords = TSNE(n_components=2).fit_transform(np.array(vectors))

    return jsonify(
        coords=coords.tolist()
    )

@app.route('/')
def index():
	return render_template('main.html')

if __name__ == '__main__':
	app.run(port=5000, debug=True)