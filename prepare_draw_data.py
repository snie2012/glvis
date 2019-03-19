import numpy as np
from hierarchical_clustering import rank_clusters

def prepare_heatmap_data(mat, cluster_results, num_of_rows=10, num_of_cols=10):
    '''
    Prepare the data to draw heatmap
    
    Notice: we assume mat is NOT reindexed before the cluster results
    '''
    num_of_rows = num_of_rows if num_of_rows < len(mat) else len(mat)
    num_of_cols = num_of_cols if num_of_cols < len(mat[0]) else len(mat[0])

    data = rank_clusters(mat, cluster_results, num_of_rows, num_of_cols)

    heatmap_data = []
    for i in range(0, num_of_rows):
        dt = []
        for j in range(0, num_of_cols):
            dt.append({
                'x': data['col_partial_sum'][j],
                'y': data['row_partial_sum'][i],
                'w': len(data['col_group_indices'][j]),
                'h': len(data['row_group_indices'][i]),
                'mean': data['mean_matrix'][i][j],
                'std': data['std_matrix'][i][j],
                'instances': data['row_group_indices'][i],
                'dimensions': data['col_group_indices'][j]
            })
        heatmap_data.append(dt)
    
    return heatmap_data