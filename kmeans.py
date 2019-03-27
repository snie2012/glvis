from sklearn.cluster import KMeans

MAX_CLUSTER_NUM = 5

def kmeans(data, rc_type):
    data = data if rc_type =='col' else data.T
    groups = {}
    for num in range(1, MAX_CLUSTER_NUM+1):
        km = KMeans(n_clusters=num, n_jobs=8).fit(data)
        res = [[] for _ in range(num)]
        for idx, label in enumerate(km.labels_):
            res[label].append(idx)
        groups[num] = sorted(res, key=len)
    return groups