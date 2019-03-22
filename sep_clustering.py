from scipy.spatial.distance import pdist
import scipy.cluster.hierarchy as hier
import itertools
import numpy as np

from hierarchical_clustering import calc_distance_matrix, cluster_and_group

"""
Steps:
1. Cluster on the dimensions
2. For each dimension cluster, perform an independent clustering on the instances
"""

MAX_DIM_CLUSTERS = 10
MAX_INST_CLUSTER = 10

def sep_clustering(mat, dist_type='cosine', linkage_type='average', group_type='maxclust'):
    dim_groups = cluster_dimensions(mat, dist_type, linkage_type, group_type)
    inst_groups = cluster_instances(mat, dim_groups, dist_type, linkage_type, group_type)

    return dim_groups, inst_groups


def cluster_dimensions(mat, dist_type='cosine', linkage_type='average', group_type='maxclust'):
    dist_mat = calc_distance_matrix(mat, 'col', dist_type)
    dim_groups = cluster_and_group(dist_mat, MAX_DIM_CLUSTERS, linkage_type=linkage_type, group_type=group_type)

    dim_groups = {k: sorted(g, key=len) for k, g in dim_groups.items()}

    return dim_groups


def cluster_instances(mat, dim_groups, dist_type='cosine', linkage_type='average', group_type='maxclust'):
    inst_groups = {}
    for key, dim_group in dim_groups.items():
        inst_group_list = [] # len(inst_group_list) == key
        for dims in dim_group:
            data = mat[:, dims]
            dist_mat = calc_distance_matrix(data, 'row', dist_type)
            inst_group = cluster_and_group(dist_mat, MAX_INST_CLUSTER, linkage_type=linkage_type, group_type=group_type)

            inst_group = {k: sorted(g, key=len) for k, g in inst_group.items()}

            inst_group_list.append(inst_group)
        
        inst_groups[key] = inst_group_list

    return inst_groups


