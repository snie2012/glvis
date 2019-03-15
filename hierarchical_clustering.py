"""
Perform hierarchical clustering on matrix data.
Clustering will be performed on both rows and columns.
"""

from scipy.spatial.distance import pdist
import scipy.cluster.hierarchy as hier
import itertools
import numpy as np


def cluster_row_and_col(mat, dist_type='cosine', linkage_type='average', group_type='maxclust'):
    # Cluster both row and column
    cluster_results = {}

    for rc_type in ['row', 'col']:
        dist_mat = calc_distance_matrix(mat, rc_type, dist_type)
        new_idx, groups = cluster_and_group(dist_mat, len(mat), linkage_type=linkage_type, group_type=group_type)

        cluster_results[rc_type] = {
            'new_idx': new_idx,
            'groups': groups
        }

    return cluster_results


def calc_distance_matrix(mat, rc_type, dist_type='cosine'):
    if rc_type == 'row':
        dist_mat = pdist(mat, metric=dist_type)
    elif rc_type == 'col':
        dist_mat = pdist(mat.transpose(), metric=dist_type)
    
    dist_mat[dist_mat < 0] = float(0)

    return dist_mat


def cluster_and_group(dist_mat, num_of_points, linkage_type='average', group_type='maxclust'):
    Y = hier.linkage(dist_mat, method=linkage_type)
    Z = hier.dendrogram(Y, no_plot=True)
    new_idx = Z['leaves']

    groups = {}
    if group_type == 'distance':
        for inst_dist in [float(i) / 10 for i in range(11)]:
            key = str(inst_dist).replace('.', '')
            fc_num = hier.fcluster(Y, inst_dist * dist_mat.max(), 'distance')
            fc_num = fc_num[new_idx] # Index fc_num according to the new order
            count = np.array([len(list(g)) for k, g in itertools.groupby(fc_num)])
            partial_sum = count.cumsum()
            groups[key] = partial_sum
    elif group_type == 'maxclust':
        max_num = num_of_points if num_of_points < 11 else 11
        for num_cluster in range(2, max_num):
            fc_num = hier.fcluster(Y, num_cluster, criterion='maxclust')
            fc_num = fc_num[new_idx] # Index fc_num according to the new order
            count = np.array([len(list(g)) for k, g in itertools.groupby(fc_num)])
            partial_sum = count.cumsum()
            groups[str(num_cluster)] = partial_sum

    return new_idx, groups
