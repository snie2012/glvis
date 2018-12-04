import sys
# sys.path.append('../languagernn/common/')
# sys.path.append('../languagernn/language_model/')
# sys.path.append('../languagernn/language_model/transparent_rnn/')

import json
from flask import Flask, jsonify, render_template, request
app = Flask(__name__)

from word_embeddings import get_sample_vectors

sample_words, embeddings = get_sample_vectors(sample_size=5000)

@app.route('/embeddings')
def serve_embeddings():
	return jsonify(
        sample_words=sample_words,
        embeddings=embeddings
    )

@app.route('/')
def index():
	return render_template('main.html')

if __name__ == '__main__':
	app.run(port=5000, debug=True)