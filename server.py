import sys
# sys.path.append('../languagernn/common/')
# sys.path.append('../languagernn/language_model/')
# sys.path.append('../languagernn/language_model/transparent_rnn/')

import numpy as np
import pandas as pd

import gensim

import json
from flask import Flask, jsonify, render_template, request
app = Flask(__name__)

from word_embeddings import get_sample_vectors

# data_path='data/GoogleNews-vectors-negative300.bin'
data_path = 'data/glove.6B/glove.6B.50d.txt.word2vec'
model = gensim.models.KeyedVectors.load_word2vec_format(data_path, binary=False)
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
    topn = int(response['topn'])

    neighbors = [t[0] for t in model.most_similar(word, topn=topn)]
    vectors = [model.get_vector(w).tolist() for w in neighbors]

    stats = pd.DataFrame(columns=['dim', 'mean', 'std'])
    stats['mean'] = np.mean(vectors, axis=0)
    stats['std'] = np.std(vectors, axis=0)
    stats['dim'] = np.arange(len(stats['mean']))

    return jsonify(
        neighbors=neighbors,
        vectors=np.transpose(vectors).tolist(),
        stats=stats.to_dict(orient='records')
    )

@app.route('/')
def index():
	return render_template('main.html')

if __name__ == '__main__':
	app.run(port=5000, debug=True)