import sys
# sys.path.append('../languagernn/common/')
# sys.path.append('../languagernn/language_model/')
# sys.path.append('../languagernn/language_model/transparent_rnn/')

import numpy as np

import json
from flask import Flask, jsonify, render_template, request
app = Flask(__name__)

from word_embeddings import get_sample_vectors

sample_words, embeddings, model = get_sample_vectors(sample_size=5000)

@app.route('/embeddings')
def serve_embeddings():
	return jsonify(
        sample_words=sample_words,
        embeddings=embeddings
    )

@app.route('/neighbors', methods=['POST'])
def serve_neighbors():
    response = request.json
    word = response['word']
    print(word)

    neighbors = [t[0] for t in model.most_similar(word)]
    vectors = [model.get_vector(w).tolist() for w in neighbors]

    mean = np.mean(vectors, axis=0)
    std = np.std(vectors, axis=0)
    line_data = np.stack((np.arange(len(mean)), std-np.min(std)), axis=1)
    
    return jsonify(
        neighbors=neighbors,
        vectors=vectors,
        mean=mean.tolist(),
        line_data=line_data.tolist()
    )

@app.route('/')
def index():
	return render_template('main.html')

if __name__ == '__main__':
	app.run(port=5000, debug=True)