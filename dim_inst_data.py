import numpy as np

# Prepare data to draw dimensions and instances separately

def prepare_sep_data(mat, dim_groups, inst_groups, num_of_dims, num_of_instances=None):
    num_of_dims = num_of_dims if num_of_dims < len(mat[0]) else len(mat[0])

    nums_of_instances = num_of_instances if num_of_instances else [3 for _ in range(num_of_dims)]
    """
    What should the data look like?
    {
        'dims': [
            {'x': int, 'w': int, 'mean': float, 'std': float, 'dimensions': []},
            ...
        ],
        'insts': {
            0: [
                {'y': int, 'h': int, 'mean': float, 'std': float, 'instances': []},
                ...
            ],

            1: [
                {'y': int, 'h': int, 'mean': float, 'std': float},
                ...
            ],
        }        
    }
    """
    dim_group = dim_groups[num_of_dims]
    dim_partial_sum = [0] + np.cumsum([len(a) for a in dim_group]).tolist()

    dims_data = []
    insts_data = []
    for i, dims in enumerate(dim_group):
        dims_data.append({
            'x': dim_partial_sum[i],
            'w': len(dims),
            'mean': float(mat[:, dims].mean()),
            'std': float(mat[:, dims].std()),
            'dimensions': dims if isinstance(dims, list) else dims.tolist()
        })

        inst_group = inst_groups[num_of_dims][i][nums_of_instances[i]]

        inst_partial_sum = [0] + np.cumsum([len(a) for a in inst_group]).tolist()

        insts_data.append([{
            'y': inst_partial_sum[j],
            'h': len(insts),
            'mean': float(mat[insts, :][:, dims].mean()),
            'std': float(mat[insts, :][:, dims].std()),
            'instances': insts if isinstance(insts, list) else insts.tolist()
        } for j, insts in enumerate(inst_group)])

    return {'dims': dims_data, 'insts': insts_data}

