import { useState, useMemo } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    TablePagination, TableSortLabel, Paper, TextField, Box, IconButton,
    Tooltip, InputAdornment, alpha, useTheme, Typography, Skeleton,
} from '@mui/material';
import {
    Search as SearchIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility as ViewIcon,
} from '@mui/icons-material';

const DataTable = ({
    columns = [],
    rows = [],
    onEdit,
    onDelete,
    onView,
    searchPlaceholder = 'Buscar...',
    loading = false,
    actions = true,
}) => {
    const theme = useTheme();
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [orderBy, setOrderBy] = useState('');
    const [order, setOrder] = useState('asc');
    const [search, setSearch] = useState('');

    const handleSort = (property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const filteredRows = useMemo(() => {
        if (!search) return rows;
        const s = search.toLowerCase();
        return rows.filter((row) =>
            columns.some((col) => {
                const val = row[col.field];
                return val && String(val).toLowerCase().includes(s);
            })
        );
    }, [rows, search, columns]);

    const sortedRows = useMemo(() => {
        if (!orderBy) return filteredRows;
        return [...filteredRows].sort((a, b) => {
            const aVal = a[orderBy] ?? '';
            const bVal = b[orderBy] ?? '';
            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return order === 'asc' ? aVal - bVal : bVal - aVal;
            }
            return order === 'asc'
                ? String(aVal).localeCompare(String(bVal))
                : String(bVal).localeCompare(String(aVal));
        });
    }, [filteredRows, orderBy, order]);

    const paginatedRows = sortedRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    return (
        <Paper
            sx={{
                borderRadius: 3,
                overflow: 'hidden',
                border: `1px solid ${theme.palette.divider}`,
            }}
        >
            {/* Search */}
            <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
                <TextField
                    size="small"
                    fullWidth
                    placeholder={searchPlaceholder}
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                            </InputAdornment>
                        ),
                    }}
                    sx={{ maxWidth: 400 }}
                />
            </Box>

            {/* Table */}
            <TableContainer sx={{ overflowX: 'auto' }}>
                <Table sx={{ minWidth: 900 }}>
                    <TableHead>
                        <TableRow>
                            {columns.map((col) => (
                                <TableCell
                                    key={col.field}
                                    sx={{
                                        fontWeight: 600,
                                        fontSize: '0.72rem',
                                        letterSpacing: '0.05em',
                                        textTransform: 'uppercase',
                                        whiteSpace: 'nowrap',
                                        py: 1.5,
                                    }}
                                >
                                    {col.sortable !== false ? (
                                        <TableSortLabel
                                            active={orderBy === col.field}
                                            direction={orderBy === col.field ? order : 'asc'}
                                            onClick={() => handleSort(col.field)}
                                        >
                                            {col.headerName}
                                        </TableSortLabel>
                                    ) : (
                                        col.headerName
                                    )}
                                </TableCell>
                            ))}
                            {actions && <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', whiteSpace: 'nowrap', py: 1.5 }}>Acciones</TableCell>}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    {columns.map((col) => (
                                        <TableCell key={col.field}>
                                            <Skeleton variant="text" width="80%" />
                                        </TableCell>
                                    ))}
                                    {actions && (
                                        <TableCell>
                                            <Skeleton variant="text" width={80} />
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))
                        ) : paginatedRows.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={columns.length + (actions ? 1 : 0)} align="center" sx={{ py: 6 }}>
                                    <Typography color="text.secondary">No se encontraron resultados</Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedRows.map((row, index) => (
                                <TableRow
                                    key={row.id || index}
                                    hover
                                    sx={{
                                        transition: 'background 0.15s ease',
                                        '&:hover': {
                                            bgcolor: alpha(theme.palette.primary.main, 0.04),
                                        },
                                    }}
                                >
                                    {columns.map((col) => (
                                        <TableCell key={col.field}>
                                            {col.renderCell ? col.renderCell(row) : row[col.field]}
                                        </TableCell>
                                    ))}
                                    {actions && (
                                        <TableCell align="right">
                                            <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                                                {onView && (
                                                    <Tooltip title="Ver detalle" arrow>
                                                        <IconButton size="small" onClick={() => onView(row)}
                                                            sx={{ color: 'info.main', '&:hover': { bgcolor: alpha(theme.palette.info.main, 0.1) } }}>
                                                            <ViewIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                                {onEdit && (
                                                    <Tooltip title="Editar" arrow>
                                                        <IconButton size="small" onClick={() => onEdit(row)}
                                                            sx={{ color: 'warning.main', '&:hover': { bgcolor: alpha(theme.palette.warning.main, 0.1) } }}>
                                                            <EditIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                                {onDelete && (
                                                    <Tooltip title="Eliminar" arrow>
                                                        <IconButton size="small" onClick={() => onDelete(row)}
                                                            sx={{ color: 'error.main', '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.1) } }}>
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                            </Box>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Pagination */}
            <TablePagination
                component="div"
                count={filteredRows.length}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                rowsPerPageOptions={[5, 10, 25]}
                labelRowsPerPage="Filas por página:"
                labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
                sx={{ borderTop: `1px solid ${theme.palette.divider}` }}
            />
        </Paper>
    );
};

export default DataTable;
