import numpy as np
import random
from sklearn.manifold import TSNE

def get_sample_vectors(model, vocab, sample_size=1000):
    print('Calculating low dimesional embeddings')
    sample_words = [vocab[i] for i in random.sample(range(0, len(vocab)), sample_size)]

    sample_vectors = [model.get_vector(w) for w in sample_words]
    embedded_vectors = TSNE(n_components=2).fit_transform(np.array(sample_vectors))

    return sample_words, embedded_vectors