"""
Perform hierarchical clustering on matrix data.
Clustering will be performed on both rows and columns.
"""

from scipy.spatial.distance import pdist
import scipy.cluster.hierarchy as hier
import itertools
import numpy as np

Max_Cluster_Num = 31

def cluster_row_and_col(mat, dist_type='cosine', linkage_type='average', group_type='maxclust'):
    # Cluster both row and column
    cluster_results = {}
    max_level = len(mat) if len(mat) < Max_Cluster_Num else Max_Cluster_Num
    for rc_type in ['row', 'col']:
        dist_mat = calc_distance_matrix(mat, rc_type, dist_type)
        cluster_results[rc_type] = cluster_and_group(dist_mat, max_level, linkage_type=linkage_type, group_type=group_type)

    return cluster_results


def calc_distance_matrix(mat, rc_type, dist_type='cosine'):
    if rc_type == 'row':
        dist_mat = pdist(mat, metric=dist_type)
    elif rc_type == 'col':
        dist_mat = pdist(mat.transpose(), metric=dist_type)
    
    dist_mat[dist_mat < 0] = float(0)

    return dist_mat


def cluster_and_group(dist_mat, max_level, linkage_type='average', group_type='maxclust'):
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
            partial_sum = np.insert(partial_sum, 0, 0)
            groups[key] = np.array([new_idx[partial_sum[i-1] : partial_sum[i]] for i in range(1, len(partial_sum))])

    elif group_type == 'maxclust':
        for num_cluster in range(2, max_level):
            fc_num = hier.fcluster(Y, num_cluster, criterion='maxclust')
            fc_num = fc_num[new_idx] # Index fc_num according to the new order
            count = np.array([len(list(g)) for k, g in itertools.groupby(fc_num)])
            partial_sum = count.cumsum()

            partial_sum = np.insert(partial_sum, 0, 0)
            groups[num_cluster] = np.array([new_idx[partial_sum[i-1] : partial_sum[i]] for i in range(1, len(partial_sum))])

    return groups

# def rank_clusters(mat, cluster_results, num_of_points):
#     # For each group, rank the clusters in the group based on their standard deviation of the mean value
#     max_num = num_of_points if num_of_points < Max_Cluster_Num else Max_Cluster_Num
#     ranked_groups = {}
#     for row_num in range(2, max_num):
#         for col_num in range(2, max_num):
            
    
#     return ranked_groups


def rank_clusters(mat, cluster_results, row_num, col_num):
    row_group_indices = cluster_results['row'][row_num]
    col_group_indices = cluster_results['col'][col_num]
    mean_matrix = []
    std_matrix = []
    for row_idx in row_group_indices:
        mean_row = []
        std_row = []
        for col_idx in col_group_indices:
            mean_row.append(mat[row_idx, :][:, col_idx].mean())
            std_row.append(mat[row_idx, :][:, col_idx].std())
        mean_matrix.append(mean_row)
        std_matrix.append(std_row)
    
    std_matrix = np.array(std_matrix)
    mean_matrix = np.array(mean_matrix)
    row_std = mean_matrix.std(axis=1) # std for each row
    col_std = mean_matrix.std(axis=0) # std for each column

    row_rank = np.argsort(row_std)[::-1]
    col_rank = np.argsort(col_std)[::-1]

    # Reorder row_group and col_group based on rank
    row_group_ranked = row_group_indices[row_rank]
    col_group_ranked = col_group_indices[col_rank]

    # Reorder mean and std matrix based on rank
    mean_matrix_ranked = mean_matrix[row_rank, :][:, col_rank]
    std_matrix_ranked = std_matrix[row_rank, :][:, col_rank]

    # Calculate partial sum for the ranked row and column
    row_partial_sum = np.insert(np.cumsum([len(a) for a in row_group_ranked]), 0, 0)
    col_partial_sum = np.insert(np.cumsum([len(a) for a in col_group_ranked]), 0, 0)

    return {
        'mean_matrix': mean_matrix_ranked.tolist(),
        'std_matrix': std_matrix_ranked.tolist(),
        'row_group_indices': row_group_ranked.tolist(),
        'col_group_indices': col_group_ranked.tolist(),
        'row_partial_sum': row_partial_sum.tolist(),
        'col_partial_sum': col_partial_sum.tolist()
    }