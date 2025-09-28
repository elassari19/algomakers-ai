'use client';

import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Search,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  X,
} from 'lucide-react';
import { useState, useEffect, ReactNode } from 'react';
import { PaginationControls } from '../ui/pagination-controls';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

export interface Column<T = any> {
  key: string;
  header: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: T, index: number) => ReactNode;
  accessor?: (row: T) => any; // Function to get the value for sorting/display
}

export interface ReusableTableProps<T = any> {
  data: T[];
  columns: Column<T>[];
  title?: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  isLoading?: boolean;
  className?: string;
  searchable?: boolean;
  searchFields?: string[]; // Fields to search in
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  itemsPerPage?: number; // Number of items per page (default: 10)
  onRowClick?: (row: T, index: number) => void;
  rowClassName?: (row: T, index: number) => string;
  // Row detail slider props
  enableRowDetails?: boolean; // Enable the built-in row detail slider
  rowDetailTitle?: (row: T) => string; // Custom title for the detail slider
  rowDetailContent?: (row: T) => ReactNode; // Custom content for the detail slider
  excludeFromDetails?: string[]; // Keys to exclude from auto-generated details
}

export function ReusableTable<T = any>({
  data,
  columns,
  title = 'Data Table',
  subtitle,
  icon: Icon,
  isLoading = false,
  className,
  searchable = true,
  searchFields = [],
  emptyStateTitle = 'No data found',
  emptyStateDescription = "We couldn't find any data matching your criteria.",
  itemsPerPage = 5,
  onRowClick,
  rowClassName,
  enableRowDetails = false,
  rowDetailTitle,
  rowDetailContent,
  excludeFromDetails = ['id'],
}: ReusableTableProps<T>) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedRow, setSelectedRow] = useState<T | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Get pagination and search values from URL params
  const urlPage = parseInt(searchParams.get('page') || '1');
  const urlLimit = parseInt(
    searchParams.get('limit') || itemsPerPage.toString()
  );
  const searchQuery = searchParams.get('q') || '';

  const currentPage = urlPage;
  const currentItemsPerPage = urlLimit;

  // Helper function to get nested object values
  const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  // Filter data based on search query
  const filteredData =
    searchable && searchQuery
      ? data.filter((item) => {
          if (searchFields.length > 0) {
            return searchFields.some((field) => {
              const value = getNestedValue(item, field);
              return String(value)
                .toLowerCase()
                .includes(searchQuery.toLowerCase());
            });
          }

          // If no search fields specified, search in all string values
          return Object.values(item as any).some((value) =>
            String(value).toLowerCase().includes(searchQuery.toLowerCase())
          );
        })
      : data;

  // Sort data based on current sort field and direction
  const sortedData = sortField
    ? [...filteredData].sort((a, b) => {
        const column = columns.find((col) => col.key === sortField);
        let aValue: any;
        let bValue: any;

        if (column?.accessor) {
          aValue = column.accessor(a);
          bValue = column.accessor(b);
        } else {
          aValue = getNestedValue(a, sortField);
          bValue = getNestedValue(b, sortField);
        }

        // Handle null/undefined values
        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return 1;
        if (bValue == null) return -1;

        if (typeof aValue === 'string') {
          return sortDirection === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }

        if (typeof aValue === 'number') {
          return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        }

        // For other types, convert to string and compare
        const aStr = String(aValue);
        const bStr = String(bValue);
        return sortDirection === 'asc'
          ? aStr.localeCompare(bStr)
          : bStr.localeCompare(aStr);
      })
    : filteredData;

  // Calculate pagination - always use internal pagination
  const totalItemsCount = sortedData.length;
  const totalPages = Math.ceil(sortedData.length / currentItemsPerPage);

  // Slice the data for display based on current page
  const startIndex = (currentPage - 1) * currentItemsPerPage;
  const endIndex = startIndex + currentItemsPerPage;
  const paginatedData = sortedData.slice(startIndex, endIndex);

  // Reset to page 1 if current page is beyond available pages due to search filtering
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      const params = new URLSearchParams(searchParams);
      params.set('page', '1');
      router.replace(`${pathname}?${params}`);
    }
  }, [currentPage, totalPages, searchParams, router, pathname]);

  // Handle sorting
  const handleSort = (columnKey: string) => {
    const column = columns.find((col) => col.key === columnKey);
    if (!column?.sortable) return;

    if (sortField === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(columnKey);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (columnKey: string) => {
    const column = columns.find((col) => col.key === columnKey);
    if (!column?.sortable) return null;

    if (sortField !== columnKey) {
      return <ChevronsUpDown className="h-4 w-4 text-slate-500" />;
    }
    return sortDirection === 'asc' ? (
      <ChevronUp className="h-4 w-4 text-blue-400" />
    ) : (
      <ChevronDown className="h-4 w-4 text-blue-400" />
    );
  };

  const getAlignmentClass = (align?: 'left' | 'center' | 'right') => {
    switch (align) {
      case 'center':
        return 'text-center';
      case 'right':
        return 'text-right';
      default:
        return 'text-left';
    }
  };

  // Handle row click - either custom handler or detail slider
  const handleRowClick = (row: T, index: number, event: React.MouseEvent) => {
    // Check if the click originated from an interactive element
    const target = event.target as HTMLElement;
    const isInteractiveElement = target.closest(
      'button, a, input, select, textarea, [role="button"]'
    );

    // Don't trigger row action if clicking on interactive elements
    if (isInteractiveElement) {
      return;
    }

    if (onRowClick) {
      onRowClick(row, index);
    } else if (enableRowDetails) {
      setSelectedRow(row);
      setIsDetailOpen(true);
    }
  };

  // Generate auto detail content from row data
  const generateAutoDetailContent = (row: T) => {
    const entries = Object.entries(row as any).filter(
      ([key]) => !excludeFromDetails.includes(key)
    );

    return (
      <div className="space-y-4">
        {entries.map(([key, value]) => {
          // Format key to be more readable
          const formattedKey = key
            .split(/(?=[A-Z])|_|-/)
            .map(
              (word) =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            )
            .join(' ');

          // Format value based on type
          let formattedValue: string;
          if (value instanceof Date) {
            formattedValue = value.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });
          } else if (typeof value === 'object' && value !== null) {
            formattedValue = JSON.stringify(value, null, 2);
          } else {
            formattedValue = String(value || 'N/A');
          }

          return (
            <div
              key={key}
              className="border-b border-white/10 pb-3 last:border-b-0"
            >
              <dt className="text-sm font-medium text-white/90 mb-1">
                {formattedKey}
              </dt>
              <dd className="text-sm text-white/70 break-words">
                {typeof value === 'object' && value !== null ? (
                  <pre className="whitespace-pre-wrap font-mono text-xs bg-white/5 p-2 rounded">
                    {formattedValue}
                  </pre>
                ) : (
                  formattedValue
                )}
              </dd>
            </div>
          );
        })}
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card
        className={`bg-white/10 backdrop-blur-md border-white/20 shadow-xl hover:bg-white/15 transition-all duration-300 ${className}`}
      >
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            {Icon && <Icon className="h-5 w-5" />}
            {title}
          </CardTitle>
          {subtitle && <p className="text-white/70 text-sm">{subtitle}</p>}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-12 bg-white/10 backdrop-blur-sm rounded-lg border border-white/10"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card
        className={`bg-white/10 backdrop-blur-md border-white/20 shadow-xl hover:bg-white/15 transition-all duration-300 ${className}`}
      >
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2 py-2">
            {Icon && <Icon className="h-5 w-5" />}
            {title}
          </CardTitle>
          {subtitle && <p className="text-white/70 text-sm">{subtitle}</p>}
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Search}
            title={emptyStateTitle}
            description={emptyStateDescription}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={`bg-white/5 backdrop-blur-md border-white/20 shadow-xl hover:bg-white/15 transition-all duration-300 ${className}`}
    >
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2 h-0">
          {Icon && <Icon className="h-5 w-5" />}
          {title}
          <span className="text-sm text-white/70 font-normal">
            ({data.length} {data.length === 1 ? 'item' : 'items'} available)
          </span>
        </CardTitle>
        {subtitle && <p className="text-white/70 text-sm">{subtitle}</p>}
      </CardHeader>
      <CardContent className="px-1 sm:px-3">
        <div className="rounded-lg border border-white/20 overflow-hidden bg-white/5 backdrop-blur-sm">
          <div className="relative">
            {/* Fixed Header */}
            <div className="sticky top-0 z-10 bg-white/5 backdrop-blur-sm border-b border-white/20">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/20 bg-white/5 backdrop-blur-sm">
                    {columns.map((column) => (
                      <TableHead
                        key={column.key}
                        className={`text-white/80 ${
                          column.width || ''
                        } ${getAlignmentClass(column.align)}`}
                      >
                        {column.sortable ? (
                          <button
                            onClick={() => handleSort(column.key)}
                            className={`flex items-center gap-2 hover:text-white transition-colors ${
                              column.align === 'center'
                                ? 'justify-center w-full'
                                : column.align === 'right'
                                ? 'justify-end w-full'
                                : ''
                            }`}
                          >
                            {column.header}
                            {getSortIcon(column.key)}
                          </button>
                        ) : (
                          column.header
                        )}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
              </Table>
            </div>

            {/* Scrollable Body */}
            <ScrollArea className="h-[400px]">
              <Table>
                <TableBody>
                  {paginatedData.map((row, index) => (
                    <TableRow
                      key={index}
                      className={`border-white/10 hover:bg-white/5 transition-colors ${
                        onRowClick || enableRowDetails ? 'cursor-pointer' : ''
                      } ${rowClassName ? rowClassName(row, index) : ''}`}
                      onClick={(event) => handleRowClick(row, index, event)}
                    >
                      {columns.map((column) => {
                        const value = column.accessor
                          ? column.accessor(row)
                          : getNestedValue(row, column.key);

                        return (
                          <TableCell
                            key={column.key}
                            className={`text-white/80 ${getAlignmentClass(
                              column.align
                            )}`}
                          >
                            {column.render
                              ? column.render(value, row, index)
                              : String(value || '')}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </div>

        {/* Pagination Controls - only show if there are multiple pages */}
        {totalPages > 1 && (
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={currentItemsPerPage}
            totalItems={totalItemsCount}
            className="mt-4"
          />
        )}
      </CardContent>

      {/* Row Detail Slider */}
      {enableRowDetails && (
        <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <SheetContent className="w-full md:w-[32rem] max-w-none bg-gradient-to-b from-[#6a1b9a] to-[#2d1b24] p-6">
            <SheetHeader className="px-2 h-10">
              <SheetTitle className="text-white text-lg">
                {selectedRow && rowDetailTitle
                  ? rowDetailTitle(selectedRow)
                  : 'Item Details'}
              </SheetTitle>
            </SheetHeader>
            <ScrollArea className="h-[calc(100vh-120px)] px-2">
              {selectedRow && (
                <div className="space-y-1">
                  {rowDetailContent
                    ? rowDetailContent(selectedRow)
                    : generateAutoDetailContent(selectedRow)}
                </div>
              )}
            </ScrollArea>
          </SheetContent>
        </Sheet>
      )}
    </Card>
  );
}
