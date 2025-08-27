"use client"

import * as React from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface SimpleColumn {
  key: string
  label: string
  render?: (value: any, row: any) => React.ReactNode
  sortable?: boolean
}

interface SimpleTableProps {
  columns: SimpleColumn[]
  data: any[]
  searchTerm?: string
  onRowClick?: (row: any) => void
  loading?: boolean
  pageSize?: number
  showPagination?: boolean
  showSearch?: boolean
  emptyMessage?: string
  className?: string
}

export function SimpleTable({
  columns,
  data,
  searchTerm = "",
  onRowClick,
  loading = false,
  pageSize = 10,
  showPagination = true,
  showSearch = false,
  emptyMessage = "Heç bir məlumat tapılmadı.",
  className,
}: SimpleTableProps) {
  const [currentPage, setCurrentPage] = React.useState(1)
  const [localSearchTerm, setLocalSearchTerm] = React.useState("")
  const [sortConfig, setSortConfig] = React.useState<{
    key: string
    direction: 'asc' | 'desc'
  } | null>(null)

  // Use external search term if provided, otherwise use local search
  const effectiveSearchTerm = searchTerm || localSearchTerm

  // Filter data based on search term
  const filteredData = React.useMemo(() => {
    if (!effectiveSearchTerm) return data
    
    return data.filter((row) =>
      columns.some((column) => {
        const value = row[column.key]
        if (value == null) return false
        return String(value).toLowerCase().includes(effectiveSearchTerm.toLowerCase())
      })
    )
  }, [data, effectiveSearchTerm, columns])

  // Sort data
  const sortedData = React.useMemo(() => {
    if (!sortConfig) return filteredData

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key]
      const bValue = b[sortConfig.key]

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1
      }
      return 0
    })
  }, [filteredData, sortConfig])

  // Paginate data
  const paginatedData = React.useMemo(() => {
    if (!showPagination) return sortedData
    
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return sortedData.slice(startIndex, endIndex)
  }, [sortedData, currentPage, pageSize, showPagination])

  const totalPages = Math.ceil(sortedData.length / pageSize)

  const handleSort = (key: string) => {
    const column = columns.find(col => col.key === key)
    if (!column?.sortable) return

    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  // Reset to first page when search changes
  React.useEffect(() => {
    setCurrentPage(1)
  }, [effectiveSearchTerm])

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
    <div className={`space-y-4 ${className}`}>
      {/* Search */}
      {showSearch && !searchTerm && (
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Axtar..."
            value={localSearchTerm}
            onChange={(e) => setLocalSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
      )}

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead 
                  key={column.key}
                  className={column.sortable ? "cursor-pointer select-none hover:bg-muted/50" : ""}
                  onClick={() => handleSort(column.key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.label}</span>
                    {column.sortable && sortConfig?.key === column.key && (
                      <span className="text-xs">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length ? (
              paginatedData.map((row, index) => (
                <TableRow
                  key={index}
                  className={onRowClick ? "cursor-pointer hover:bg-muted/50" : ""}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((column) => {
                    const value = row[column.key]
                    return (
                      <TableCell key={column.key}>
                        {column.render ? column.render(value, row) : value}
                      </TableCell>
                    )
                  })}
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
      {showPagination && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Cəmi {sortedData.length} nəticə
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
              disabled={currentPage === 1}
            >
              Əvvəlki
            </Button>
            <div className="text-sm text-muted-foreground">
              Səhifə {currentPage} / {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
              disabled={currentPage === totalPages}
            >
              Növbəti
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}