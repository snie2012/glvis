import numpy as np
from reorder import reorder

def prepare_heatmap_data(mat, cluster_results, num_of_rows=10, num_of_cols=10):
    '''
    Prepare the data to draw heatmap
    
    Notice: we assume mat is not reindexed before the cluster results
    '''
    num_of_rows = num_of_rows if num_of_rows < len(mat) else len(mat)
    num_of_cols = num_of_cols if num_of_cols < len(mat[0]) else len(mat[0])

    row_index = cluster_results['row']['new_idx']
    col_index = cluster_results['col']['new_idx']

    # Reindex mat
    mat = reorder(mat, row_index, col_index)

    row_group = cluster_results['row']['groups'][str(num_of_rows)]
    col_group = cluster_results['col']['groups'][str(num_of_cols)]

    row_group = np.insert(row_group, 0, 0).tolist()
    col_group = np.insert(col_group, 0, 0).tolist()

    heatmap_data = []
    for i in range(1, len(row_group)):
        for j in range(1, len(col_group)):
            heatmap_data.append({
                'x': col_group[j-1],
                'y': row_group[i-1],
                'w': col_group[j] - col_group[j-1],
                'h': row_group[i] - row_group[i-1],
                'mean': mat[row_group[i-1]: row_group[i], col_group[j-1]: col_group[j]].mean(),
                'std': mat[row_group[i-1]: row_group[i], col_group[j-1]: col_group[j]].std(),
                'instances': row_index[row_group[i-1]: row_group[i]],
                'dimensions': col_index[col_group[j-1]: col_group[j]]
            })
    
    return heatmap_data