# Classes to manage server data

class BertMrpcData:
    @property
    def size(self):
        return self._size
    
    @size.setter
    def size(self, size):
        self._size = size

    @property
    def sentences(self):
        return self._sentences

    @sentences.setter
    def sentences(self, sentences):
        self._sentences = sentences

    @property
    def sentences(self):
        return self._sentences

    @sentences.setter
    def sentences(self, sentences):
        self._sentences = sentences
    
    @property
    def vectors(self):
        return self._vectors

    @vectors.setter
    def vectors(self, vectors):
        self._vectors = vectors

    @property
    def stats(self):
        return self._stats

    @stats.setter
    def stats(self, stats):
        self._stats = stats

    @property
    def heatmap_data(self):
        return self._heatmap_data

    @heatmap_data.setter
    def heatmap_data(self, heatmap_data):
        self._heatmap_data = heatmap_data
    
    