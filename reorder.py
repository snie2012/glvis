def reorder(mat, row_idx, col_idx):
    # Reorder mat using new row and column index
    reindex_row = mat[row_idx, :]
    return reindex_row[:, col_idx]