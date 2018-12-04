import gensim
import numpy as np
import random
from sklearn.manifold import TSNE

def get_sample_vectors(sample_size=1000):
    model = gensim.models.KeyedVectors.load_word2vec_format('data/GoogleNews-vectors-negative300.bin', binary=True)

    vocab = list(model.vocab.keys())

    sample_words = [vocab[i] for i in random.sample(range(0, len(vocab)), sample_size)]

    sample_vectors = [model.get_vector(w) for w in sample_words]

    embedded_vectors = TSNE(n_components=2).fit_transform(np.array(sample_vectors))

    return sample_words, embedded_vectors.tolist()