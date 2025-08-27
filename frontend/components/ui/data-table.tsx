"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, MoreHorizontal, Search, Plus, Edit, Trash2, ChevronLeft, ChevronRight, Filter } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// Legacy DataTable interface (for REA INVEST compatibility)
interface LegacyColumn {
  key?: string;
  accessorKey?: string;
  id?: string;
  title?: string;
  header?: string;
  render?: (value: any, row: any) => React.ReactNode;
  cell?: (props: { row: { original: any } }) => React.ReactNode;
  searchable?: boolean;
}

interface LegacyDataTableProps {
  title: string;
  columns: LegacyColumn[];
  data: any[];
  loading?: boolean;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onSearch?: (query: string) => void;
  onPageChange?: (page: number) => void;
  onEdit?: (item: any) => void;
  onDelete?: (item: any) => void;
  onAdd?: () => void;
  searchPlaceholder?: string;
  emptyMessage?: string;
  filter?: React.ReactNode;
}

// Modern DataTable interface (TanStack Table)
interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchKey?: string
  searchPlaceholder?: string
  onRowClick?: (row: TData) => void
  loading?: boolean
  pageSize?: number
  showPagination?: boolean
  showSearch?: boolean
  showColumnToggle?: boolean
  emptyMessage?: string
}

// Legacy DataTable Component for backward compatibility with REA INVEST
export function LegacyDataTable({
  title,
  columns,
  data,
  loading = false,
  pagination,
  onSearch,
  onPageChange,
  onEdit,
  onDelete,
  onAdd,
  searchPlaceholder = 'Axtarış...',
  emptyMessage = 'Məlumat tapılmadı',
  filter
}: LegacyDataTableProps) {
  const [searchQuery, setSearchQuery] = React.useState('');

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onSearch?.(query);
  };

  const renderPagination = () => {
    if (!pagination) return null;

    const { page, totalPages, total, limit } = pagination;
    const startItem = (page - 1) * limit + 1;
    const endItem = Math.min(page * limit, total);

    return (
      <div className="flex items-center justify-between px-4 py-3 bg-white border-t">
        <div className="flex items-center text-sm text-gray-500">
          <span>
            {total > 0 ? `${startItem}-${endItem}` : '0'} / {total} nəticə
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange?.(page - 1)}
            disabled={page <= 1 || loading}
          >
            <ChevronLeft className="h-4 w-4" />
            Əvvəlki
          </Button>
          
          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, Math.min(totalPages, page - 2 + i));
              return (
                <Button
                  key={`page-${i}-${pageNum}`}
                  variant={pageNum === page ? 'default' : 'outline'}
                  size="sm"
                  className="w-8 h-8 p-0"
                  onClick={() => onPageChange?.(pageNum)}
                  disabled={loading}
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange?.(page + 1)}
            disabled={page >= totalPages || loading}
          >
            Sonrakı
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          {onAdd && (
            <Button onClick={onAdd} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Yeni Əlavə Et
            </Button>
          )}
        </div>
        
        {(onSearch || filter) && (
          <div className="flex items-center justify-between gap-4 mt-4">
            {onSearch && (
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            )}
            
            {filter && (
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                {filter}
              </div>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-0">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <div className="text-lg font-medium mb-2">Məlumat yoxdur</div>
            <div className="text-sm">{emptyMessage}</div>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((column, colIndex) => (
                    <TableHead key={column.accessorKey || column.key || column.id || colIndex}>
                      {column.header || column.title}
                    </TableHead>
                  ))}
                  {(onEdit || onDelete) && <TableHead className="w-[100px]">Əməliyyatlar</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row, index) => (
                  <TableRow key={row.id || `row-${index}`}>
                    {columns.map((column, colIndex) => (
                      <TableCell key={column.accessorKey || column.key || column.id || `cell-${colIndex}`}>
                        {column.cell 
                          ? column.cell({ row: { original: row } })
                          : column.render 
                          ? column.render(row[column.accessorKey || column.key], row)
                          : row[column.accessorKey || column.key] || '-'
                        }
                      </TableCell>
                    ))}
                    {(onEdit || onDelete) && (
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {onEdit && (
                              <DropdownMenuItem onClick={() => onEdit(row)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Redaktə Et
                              </DropdownMenuItem>
                            )}
                            {onDelete && (
                              <DropdownMenuItem 
                                onClick={() => onDelete(row)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Sil
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {renderPagination()}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Modern DataTable Component (TanStack Table)
export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey = "name",
  searchPlaceholder = "Axtar...",
  onRowClick,
  loading = false,
  pageSize = 10,
  showPagination = true,
  showSearch = true,
  showColumnToggle = true,
  emptyMessage = "Heç bir məlumat tapılmadı.",
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    initialState: {
      pagination: {
        pageSize,
      },
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center space-x-2">
          {showSearch && (
            <Input
              placeholder={searchPlaceholder}
              value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn(searchKey)?.setFilterValue(event.target.value)
              }
              className="max-w-sm"
            />
          )}
        </div>
        {showColumnToggle && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                Sütunlar <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={onRowClick ? "cursor-pointer hover:bg-muted/50" : ""}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Pagination */}
      {showPagination && (
        <div className="flex items-center justify-between space-x-2">
          <div className="flex-1 text-sm text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length} / {" "}
            {table.getFilteredRowModel().rows.length} sətir seçildi.
          </div>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Əvvəlki
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Növbəti
            </Button>
          </div>
          <div className="text-sm text-muted-foreground">
            Səhifə {table.getState().pagination.pageIndex + 1} / {" "}
            {table.getPageCount()}
          </div>
        </div>
      )}
    </div>
  )
}

// Mobile Card View for responsive design
interface DataCardProps<TData> {
  data: TData[]
  renderCard: (item: TData, index: number) => React.ReactNode
  onCardClick?: (item: TData) => void
  loading?: boolean
  emptyMessage?: string
}

export function DataCards<TData>({
  data,
  renderCard,
  onCardClick,
  loading = false,
  emptyMessage = "Heç bir məlumat tapılmadı.",
}: DataCardProps<TData>) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-100 rounded w-1/2"></div>
              <div className="h-3 bg-gray-100 rounded w-2/3"></div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  if (!data.length) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {data.map((item, index) => (
        <div
          key={index}
          className={onCardClick ? "cursor-pointer" : ""}
          onClick={() => onCardClick?.(item)}
        >
          {renderCard(item, index)}
        </div>
      ))}
    </div>
  )
}

export {
  type LegacyDataTableProps,
  type DataTableProps,
  type DataCardProps,
  type LegacyColumn
}