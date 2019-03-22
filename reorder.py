def reorder(mat, row_idx, col_idx):
    # Reorder mat using new row and column index
    return mat[row_idx, :][:, col_idx]