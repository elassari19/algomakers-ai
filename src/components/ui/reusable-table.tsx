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
  Settings,
  Eye,
  EyeOff,
  ChevronRight,
  Download,
} from 'lucide-react';
import { useState, useEffect, ReactNode } from 'react';
import { PaginationControls } from '../ui/pagination-controls';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

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
  title?: React.ReactNode;
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
  // Column visibility props
  enableColumnSelector?: boolean; // Enable column visibility selector
  defaultVisibleColumns?: string[]; // Default visible columns (if not specified, all columns are visible)
  frozenColumnKey?: string; // Key of the column to freeze (sticky left)
  // Accordion props
  enableAccordion?: boolean; // Enable accordion functionality
  accordionContent?: (row: T) => ReactNode; // Content to show in accordion
  accordionTitle?: (row: T) => string; // Title for accordion trigger
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
  itemsPerPage = 20,
  onRowClick,
  rowClassName,
  enableRowDetails = false,
  rowDetailTitle,
  rowDetailContent,
  excludeFromDetails = ['id'],
  enableColumnSelector = false,
  defaultVisibleColumns,
  frozenColumnKey,
  enableAccordion = false,
  accordionContent,
  accordionTitle,
}: ReusableTableProps<T>) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();

  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedRow, setSelectedRow] = useState<T | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Accordion state - track which rows have open accordions
  const [openAccordions, setOpenAccordions] = useState<Set<number>>(new Set());

  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
    if (defaultVisibleColumns) {
      return defaultVisibleColumns;
    }
    return columns.map((col) => col.key);
  });

  // Filter columns based on visibility
  const displayColumns = columns.filter((col) =>
    visibleColumns.includes(col.key)
  );

  // Handle accordion toggle
  const toggleAccordion = (rowIndex: number) => {
    setOpenAccordions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(rowIndex)) {
        newSet.delete(rowIndex);
      } else {
        newSet.add(rowIndex);
      }
      return newSet;
    });
  };

  // Handle column visibility toggle
  const toggleColumnVisibility = (columnKey: string) => {
    setVisibleColumns((prev) => {
      if (prev.includes(columnKey)) {
        // Don't allow hiding all columns
        if (prev.length === 1) return prev;
        return prev.filter((key) => key !== columnKey);
      } else {
        return [...prev, columnKey];
      }
    });
  };

  // Show/hide all columns
  const toggleAllColumns = (show: boolean) => {
    if (show) {
      setVisibleColumns(columns.map((col) => col.key));
    } else {
      // Keep at least one column visible
      setVisibleColumns([columns[0].key]);
    }
  };

  // Export table data to Excel
  const exportToExcel = async () => {
    try {

      // Check if there's data to export
      if (!data || data.length === 0) {
        toast.warning('No data available to export.');
        return;
      }

      // Check if there are visible columns
      if (!displayColumns || displayColumns.length === 0) {
        toast.warning('No columns available to export.');
        return;
      }

      // Dynamically import XLSX only when needed
      let XLSX: any;
      try {
        XLSX = await import('xlsx');
      } catch (importError) {
        toast.error('Export library not available. Please refresh the page and try again.');
        return;
      }

      // Prepare data for export - only include visible columns
      const exportData = data.map((row, rowIndex) => {
        const exportRow: any = {};
        displayColumns.forEach((column) => {
          try {
            const value = column.accessor
              ? column.accessor(row)
              : getNestedValue(row, column.key);

            // Format the value for Excel
            if (value instanceof Date) {
              exportRow[column.header] = value.toLocaleDateString();
            } else if (typeof value === 'object' && value !== null) {
              exportRow[column.header] = JSON.stringify(value);
            } else {
              exportRow[column.header] = String(value || '');
            }
          } catch (columnError) {
            console.warn(`Error processing column ${column.key} for row ${rowIndex}:`, columnError);
            exportRow[column.header] = 'Error';
          }
        });
        return exportRow;
      });

      let wb, ws;
      try {
        // Verify XLSX library is properly loaded
        if (!XLSX || typeof XLSX !== 'object') {
          throw new Error('XLSX library not properly loaded');
        }

        if (!XLSX.utils) {
          throw new Error('XLSX.utils not available');
        }

        wb = XLSX.utils.book_new();
        ws = XLSX.utils.json_to_sheet(exportData);
      } catch (xlsxError) {
        console.error('Error creating XLSX workbook/worksheet:', xlsxError);
        if (xlsxError instanceof Error) {
          if (xlsxError.message.includes('json_to_sheet')) {
            toast.error('Unable to convert data to Excel format. The data may contain unsupported types.');
          } else if (xlsxError.message.includes('book_new')) {
            toast.error('Unable to create Excel workbook. Please try again.');
          } else if (xlsxError.message.includes('not properly loaded') || xlsxError.message.includes('not available')) {
            toast.error('Export library not available. Please refresh the page and try again.');
          } else {
            toast.error('Error creating Excel file structure. Please try again.');
          }
        } else {
          toast.error('Unexpected error during Excel file creation.');
        }
        return;
      }

      // Auto-size columns
      const colWidths = displayColumns.map((col) => ({
        wch: Math.max(col.header.length, 15) // Minimum width of 15 characters
      }));
      ws['!cols'] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, title || 'Data');

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `${title || 'table-data'}_${timestamp}.xlsx`;

      // Save file
      try {
        XLSX.writeFile(wb, filename);
        toast.success(`Successfully exported ${exportData.length} rows to Excel file.`);
      } catch (saveError) {
        console.error('Error saving Excel file:', saveError);
        if (saveError instanceof Error) {
          if (saveError.message.includes('permission') || saveError.message.includes('denied')) {
            toast.error('Unable to save file. Please check your browser download permissions.');
          } else if (saveError.message.includes('storage') || saveError.message.includes('quota')) {
            toast.error('Unable to save file. Your browser storage may be full.');
          } else {
            toast.error('Unable to save Excel file. Please try again.');
          }
        } else {
          toast.error('Unexpected error while saving the file.');
        }
      }

    } catch (error) {
      console.error('Error exporting to Excel:', error);

      // Provide more specific error messages based on error type
      let errorMessage = 'Failed to export data. Please try again.';

      if (error instanceof Error) {
        const errorMsg = error.message.toLowerCase();

        // Check for specific error patterns
        if (errorMsg.includes('writefile') || errorMsg.includes('download') || errorMsg.includes('permission')) {
          errorMessage = 'Unable to save file. Please check your browser permissions and try again.';
        } else if (errorMsg.includes('book_new') || errorMsg.includes('workbook')) {
          errorMessage = 'Unable to create Excel file. Please try again.';
        } else if (errorMsg.includes('json_to_sheet') || errorMsg.includes('sheet')) {
          errorMessage = 'Unable to process data for Excel. Please check your data and try again.';
        } else if (errorMsg.includes('cors') || errorMsg.includes('network')) {
          errorMessage = 'Network error occurred. Please check your connection and try again.';
        } else if (errorMsg.includes('import') || errorMsg.includes('module')) {
          errorMessage = 'Export library not available. Please refresh the page and try again.';
        } else {
          // Log the actual error for debugging
          console.error('Unhandled export error:', error);
          errorMessage = 'An unexpected error occurred during export. Please try again.';
        }
      } else {
        // Non-Error object thrown
        console.error('Non-standard error thrown:', error);
        errorMessage = 'An unexpected error occurred during export. Please try again.';
      }

      toast.error(errorMessage);
    }
  };

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
        className={`bg-white/10 backdrop-blur-md border-white/20 shadow-xl ${className}`}
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
      className={`bg-white/10 backdrop-blur-md border-white/20 shadow-xl min-h-[370px] ${className}`}
    >
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between h-0">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="h-5 w-5" />}
            {title}
            <span className="text-sm text-white/70 font-normal">
              ({data.length} {data.length === 1 ? 'item' : 'items'} available)
            </span>
          </div>

          <div className='flex items-center gap-4'>
            {
              (session?.user?.role == 'ADMIN' || session?.user?.role == 'MANAGER') &&
              <Button
              variant="ghost"
              size="sm"
              onClick={exportToExcel}
              className="h-8 px-3 text-white/70 hover:text-white hover:bg-white/10 flex items-center gap-2"
              disabled={data.length === 0}
            >
              <Download className="h-4 w-4" />
              Export
            </Button>}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-white/70 hover:text-white hover:bg-white/10"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 bg-slate-900/95 backdrop-blur-md border-white/20"
              >
                <DropdownMenuLabel className="text-white/90">
                  Toggle Columns
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/20" />

                <div className="px-2 py-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleAllColumns(true)}
                      className="h-6 px-2 text-xs text-white/70 hover:text-white hover:bg-white/10"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Show All
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleAllColumns(false)}
                      className="h-6 px-2 text-xs text-white/70 hover:text-white hover:bg-white/10"
                    >
                      <EyeOff className="h-3 w-3 mr-1" />
                      Hide All
                    </Button>
                  </div>
                </div>

                <DropdownMenuSeparator className="bg-white/20" />

                {columns.map((column) => (
                  <DropdownMenuItem
                    key={column.key}
                    className="flex items-center gap-2 text-white/80 cursor-pointer"
                    onSelect={(e) => {
                      e.preventDefault();
                      toggleColumnVisibility(column.key);
                    }}
                  >
                    <Checkbox
                      checked={visibleColumns.includes(column.key)}
                      onChange={() => {}} // Handled by the parent onSelect
                      className="border-white/30 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                    <span className="flex-1">{column.header}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardTitle>
        {subtitle && <p className="text-white/70 text-sm">{subtitle}</p>}
      </CardHeader>
      <CardContent className="h-full flex flex-col justify-between px-1 sm:px-3 overflow-auto">
        <div className="min-h-[16rem] flex-1 rounded-lg border border-white/20 bg-white/5 backdrop-blur-sm">
          <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
            <Table className="min-w-[600px] w-full">
              <TableHeader className="sticky top-0 z-10 bg-white/5 backdrop-blur-sm">
                <TableRow className="border-white/20 bg-white/5 backdrop-blur-sm">
                  {enableAccordion && (
                    <TableHead className="w-12 text-center">
                      {/* Accordion column header - empty */}
                    </TableHead>
                  )}
                  {displayColumns.map((column, colIdx) => (
                    <TableHead
                      key={column.key}
                      className={`text-white/80 ${
                        column.width || ''
                      } ${getAlignmentClass(column.align)} ${
                        frozenColumnKey && column.key === frozenColumnKey
                          ? 'sticky left-0 z-20 bg-gray-700 backdrop-blur-3xl'
                          : ''
                      }`}
                      style={
                        frozenColumnKey && column.key === frozenColumnKey
                          ? { left: enableAccordion ? '3rem' : 0, zIndex: 20 }
                          : undefined
                      }
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
              <TableBody>
                {paginatedData.map((row, index) => {
                  const globalIndex = startIndex + index; // Global index for accordion state
                  const isAccordionOpen = openAccordions.has(globalIndex);

                  if (enableAccordion) {
                    return (
                      <>
                        <TableRow
                          className={`border-white/10 ${
                            onRowClick || enableRowDetails ? 'cursor-pointer' : ''
                          } ${rowClassName ? rowClassName(row, index) : ''}`}
                          onClick={(event) => handleRowClick(row, index, event)}
                          key={index}
                        >
                          <TableCell className="w-12 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-white/70 hover:text-white hover:bg-white/10"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleAccordion(globalIndex);
                              }}
                            >
                              <ChevronRight
                                className={`h-4 w-4 transition-transform ${
                                  isAccordionOpen ? 'rotate-90' : ''
                                }`}
                              />
                            </Button>
                          </TableCell>
                          {displayColumns.map((column, colIdx) => {
                            const value = column.accessor
                              ? column.accessor(row)
                              : getNestedValue(row, column.key);

                            return (
                              <TableCell
                                key={column.key}
                                className={`text-white/80 ${
                                  column.width || ''
                                } ${getAlignmentClass(column.align)} ${
                                  frozenColumnKey && column.key === frozenColumnKey
                                    ? 'sticky left-0 z-10 bg-muted/30 backdrop-blur-md'
                                    : ''
                                }`}
                                style={
                                  frozenColumnKey && column.key === frozenColumnKey
                                    ? { left: '3rem', zIndex: 10 }
                                    : undefined
                                }
                              >
                                {column.render
                                  ? column.render(value, row, index)
                                  : String(value || '')}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                        {isAccordionOpen && (
                          <tr>
                            <td
                              colSpan={displayColumns.length + 1}
                              className="bg-white/5 border-white/10"
                            >
                              <div className="p-4">
                                {accordionTitle && (
                                  <h4 className="text-white font-medium mb-2">
                                    {accordionTitle(row)}
                                  </h4>
                                )}
                                {accordionContent ? (
                                  accordionContent(row)
                                ) : (
                                  <div className="text-white/70">
                                    No content provided
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  }

                  // Regular row without accordion
                  return (
                    <TableRow
                      key={globalIndex}
                      className={`border-white/10 ${
                        onRowClick || enableRowDetails ? 'cursor-pointer' : ''
                      } ${rowClassName ? rowClassName(row, index) : ''}`}
                      onClick={(event) => handleRowClick(row, index, event)}
                    >
                      {displayColumns.map((column, colIdx) => {
                        const value = column.accessor
                          ? column.accessor(row)
                          : getNestedValue(row, column.key);

                        return (
                          <TableCell
                            key={column.key}
                            className={`text-white/80 ${
                              column.width || ''
                            } ${getAlignmentClass(column.align)} ${
                              frozenColumnKey && column.key === frozenColumnKey
                                ? 'sticky left-0 z-10 bg-muted/30 backdrop-blur-md'
                                : ''
                            }`}
                            style={
                              frozenColumnKey && column.key === frozenColumnKey
                                ? { left: 0, zIndex: 10 }
                                : undefined
                            }
                          >
                            {column.render
                              ? column.render(value, row, index)
                              : String(value || '')}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Pagination Controls - only show if there are multiple pages */}
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={currentItemsPerPage}
          totalItems={totalItemsCount}
          className="mt-4"
        />
      </CardContent>

      {/* Row Detail Slider */}
      {enableRowDetails && (
        <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <SheetContent className="w-full md:w-[32rem] max-w-none bg-gradient-to-b from-white/20 to-white/5 backdrop-blur-2xl p-6">
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
