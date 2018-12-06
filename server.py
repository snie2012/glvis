import sys
# sys.path.append('../languagernn/common/')
# sys.path.append('../languagernn/language_model/')
# sys.path.append('../languagernn/language_model/transparent_rnn/')

import numpy as np

import gensim

import json
from flask import Flask, jsonify, render_template, request
app = Flask(__name__)

from word_embeddings import get_sample_vectors

data_path='data/GoogleNews-vectors-negative300.bin'
model = gensim.models.KeyedVectors.load_word2vec_format(data_path, binary=True)
vocab = list(model.vocab.keys())

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

    neighbors = [t[0] for t in model.most_similar(word)]
    vectors = [model.get_vector(w).tolist() for w in neighbors]

    mean = np.mean(vectors, axis=0)
    std = np.std(vectors, axis=0)
    
    return jsonify(
        neighbors=neighbors,
        vectors=vectors,
        mean=np.stack((np.arange(len(mean)), mean), axis=1).tolist(),
        std=np.stack((np.arange(len(mean)), std-np.min(std)), axis=1).tolist()
    )

@app.route('/')
def index():
	return render_template('main.html')

if __name__ == '__main__':
	app.run(port=5000, debug=True)