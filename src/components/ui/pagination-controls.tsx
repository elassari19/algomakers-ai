'use client';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { useURLParams } from '@/hooks/useURLParams';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  className?: string;
}

export function PaginationControls({
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  className = '',
}: PaginationControlsProps) {
  const { updateURLParams } = useURLParams();

  const handlePageChange = (page: number) => {
    updateURLParams({ page: page.toString() });
  };

  const handleItemsPerPageChange = (limit: string) => {
    updateURLParams({
      limit: limit,
      page: '1', // Reset to first page when changing items per page
    });
  };

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}
    >
      <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 w-full sm:w-auto">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400 whitespace-nowrap">Show</span>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={handleItemsPerPageChange}
          >
            <SelectTrigger className="w-16 h-8 bg-slate-800 border-slate-600">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-600">
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm text-slate-400 text-center sm:text-left">
          <span className="hidden sm:inline">
            Showing {startIndex + 1} to {endIndex} of {totalItems} pairs
          </span>
          <span className="sm:hidden">
            {startIndex + 1}-{endIndex} of {totalItems}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-center sm:justify-end gap-1 sm:gap-2 w-full sm:w-auto">
        {/* First page button - hidden on mobile for space */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1}
          className="hidden sm:flex h-8 w-8 p-0 bg-slate-800 border-slate-600 hover:bg-slate-700"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>

        {/* Previous page button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="h-8 w-8 p-0 bg-slate-800 border-slate-600 hover:bg-slate-700"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Page info - responsive text */}
        <div className="flex items-center gap-1 px-2">
          <span className="text-sm text-slate-400 whitespace-nowrap">
            <span className="hidden sm:inline">Page </span>
            {currentPage} of {totalPages}
          </span>
        </div>

        {/* Next page button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="h-8 w-8 p-0 bg-slate-800 border-slate-600 hover:bg-slate-700"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Last page button - hidden on mobile for space */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="hidden sm:flex h-8 w-8 p-0 bg-slate-800 border-slate-600 hover:bg-slate-700"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
