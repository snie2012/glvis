import sys
sys.path.append('../languagernn/common/')
sys.path.append('../languagernn/language_model/')
sys.path.append('../languagernn/language_model/transparent_rnn/')
from data_model import DataModel
from corpus_prep import twitter_preprocess

from data_prep import process_data
from cluster import cluster_f_gate

import json
from flask import Flask, jsonify, render_template, request
app = Flask(__name__)

model = DataModel()
elements = None

@app.route('/api/data', methods=['GET'])
# serve static data files
def serve_data():
	data = {}
	with open('data/fcluster_info.json', 'r', encoding='utf8') as f:
		data = json.load(f)
	return jsonify(data)


@app.route('/api/input', methods=['POST'])
def serve_input():
	global elements 

	starting_text = request.json['words']
	print ('starting text: ', starting_text)
	starting_words = ["<eos>"] + twitter_preprocess(starting_text.split(" "))
	print (starting_words)
	sentence, intermediates_probabilistic = model.generate_sentence(starting_words=starting_words, deterministic=False)
	elements = process_data(sentence, intermediates_probabilistic)
	return jsonify({
			'sentence': sentence[:-1],
			'cluster_data': cluster_f_gate(elements)
		})

@app.route('/api/node', methods=['POST'])
def serve_node_info():
	node_id = request.json['id']
	print ("node_id: ", node_id)
	elem = elements[node_id]
	return elem.to_json(orient='records')

@app.route('/')
def index():
	return render_template('main.html')

if __name__ == '__main__':
	app.run(port=5000, debug=True)