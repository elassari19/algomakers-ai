'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import * as XLSX from 'xlsx';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { SortFilterBar } from '@/components/subscription/SortFilterBar';
import { ReusableTable, Column } from '@/components/ui/reusable-table';
import { Button } from '@/components/ui/button';
import BacktestForm from '@/components/console/BacktestForm';
import UpdateBacktestForm from '@/components/console/UpdateBacktestForm';
import { Card } from '@/components/ui/card';
// Modal implementation (replace with your Modal component)
import UploadDialog from '../UploadDialog';
import { GradientBackground } from '@/components/ui/gradient-background';

// Table columns definition
import Link from 'next/link';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// ActionButtons now receives handlers as props
function ActionButtons({
  row,
  onUpdate,
  onDelete,
}: {
  row: any;
  onUpdate: (row: any) => void;
  onDelete: (row: any) => void;
}) {
  return (
    <div className="flex gap-2 items-center">
      <Link
        href={`/console/1/backtests/${row.id}`}
        className="hover:text-white text-white/70"
        title="View"
      >
        <Eye size={20} />
      </Link>
      <Button
        className="hover:text-white text-white/70"
        variant={'ghost'}
        size="icon"
        onClick={() => {
          onUpdate(row);
        }}
        title="Update"
      >
        <Pencil size={20} />
      </Button>
      <Button
        className="hover:text-red-600 text-red-500 p-1 rounded hover:bg-red-100"
        variant={'ghost'}
        size="icon"
        onClick={() => onDelete(row)}
        title="Delete"
      >
        <Trash2 size={20} />
      </Button>
    </div>
  );
}

// Helper to parse file and extract fields (symbol/timeframe from Properties, metrics as stringified data)
const parseFile = async (file: File) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        let symbol = '';
        let timeframe = '';
        let data: Record<string, any> = {};
        if (file.name.endsWith('.csv')) {
          const text = evt.target?.result;
          const rows = XLSX.utils.sheet_to_json(
            XLSX.read(text, { type: 'string' }).Sheets.Sheet1,
            { defval: '' }
          ) as Record<string, any>[];
          data = { Sheet1: rows };
        } else {
          const workbook = XLSX.read(evt.target?.result, { type: 'array' });
          const sheets = workbook.SheetNames;
          data = {};
          sheets.forEach((sheet) => {
            data[sheet] = XLSX.utils.sheet_to_json(workbook.Sheets[sheet], {
              defval: '',
            });
          });
        }
        // Extract symbol/timeframe from Properties sheet if present
        if (data['Properties'] && Array.isArray(data['Properties'])) {
          symbol = data['Properties'][2]?.value || '';
          timeframe = data['Properties'][3]?.value || '';
        }
        resolve({
          symbol,
          timeframe,
          metrics: JSON.stringify(data),
        });
      } catch (err) {
        reject(err);
      }
    };
    if (file.name.endsWith('.csv')) reader.readAsText(file);
    else reader.readAsArrayBuffer(file);
  });
};

const ConsolePage = () => {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteRow, setDeleteRow] = useState<any>(null);
  // Delete handler
  const handleDeleteConfirm = async () => {
    if (!deleteRow) return;
    try {
      const res = await fetch(`/api/backtest?id=${deleteRow.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success('Backtest deleted!', {
          style: { background: '#22c55e', color: 'white' },
        });
        fetchAllBacktests();
      } else {
        toast.error('Failed to delete backtest', {
          style: { background: '#ef4444', color: 'white' },
        });
      }
    } catch {
      toast.error('Failed to delete backtest', {
        style: { background: '#ef4444', color: 'white' },
      });
    }
    setDeleteModalOpen(false);
    setDeleteRow(null);
  };
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [step, setStep] = useState<'upload' | 'form' | 'update'>('upload');
  const [formData, setFormData] = useState<any>(null);
  // Remove formMode, always add
  const [symbol, setSymbol] = useState<string>('');
  const [timeframe, setTimeframe] = useState<string>('');
  const [backtests, setBacktests] = useState<any[]>([]);

  // Separate update logic for clarity
  const handleUpdateClick = (row: any) => {
    setFormData(row);
    setStep('update');
  };
  // Handle Update Submit
  const handleUpdate = async (values: any) => {
    try {
      const response = await fetch('/api/backtest', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, id: formData.id }),
      });
      const result = await response.json();
      if (!response.ok) {
        toast.error(result.error || 'Failed to update backtest', {
          style: { background: '#ef4444', color: 'white' },
        });
        return;
      }
      toast.success('Backtest updated successfully!', {
        style: { background: '#22c55e', color: 'white' },
      });
      // Optionally refresh data or close modal
      setStep('upload');
      setFormData(null);
      setSymbol('');
      setTimeframe('');
      fetchAllBacktests();
    } catch (err) {
      console.log(err);
      toast.error('Error updating backtest', {
        style: { background: '#ef4444', color: 'white' },
      });
    }
  };
  // Handlers for table actions
  const handleDeleteRow = (row: any) => {
    setDeleteRow(row);
    setDeleteModalOpen(true);
  };
  // Table columns definition (moved here to access handlers)
  const columns: Column[] = [
    { key: 'symbol', header: 'Symbol', sortable: true },
    { key: 'timeframe', header: 'Timeframe', sortable: true },
    {
      key: 'priceOneMonth',
      header: 'Price (1M)',
      sortable: true,
      align: 'center',
    },
    {
      key: 'priceThreeMonths',
      header: 'Price (3M)',
      sortable: true,
      align: 'center',
    },
    {
      key: 'priceSixMonths',
      header: 'Price (6M)',
      sortable: true,
      align: 'center',
    },
    {
      key: 'priceTwelveMonths',
      header: 'Price (12M)',
      sortable: true,
      align: 'center',
    },
    {
      key: 'discountOneMonth',
      header: 'Discount (1M)',
      sortable: true,
      align: 'center',
      render: (value) =>
        value !== undefined && value !== null ? `${value}%` : '',
    },
    {
      key: 'discountThreeMonths',
      header: 'Discount (3M)',
      sortable: true,
      align: 'center',
      render: (value) =>
        value !== undefined && value !== null ? `${value}%` : '',
    },
    {
      key: 'discountSixMonths',
      header: 'Discount (6M)',
      sortable: true,
      align: 'center',
      render: (value) =>
        value !== undefined && value !== null ? `${value}%` : '',
    },
    {
      key: 'discountTwelveMonths',
      header: 'Discount (12M)',
      sortable: true,
      align: 'center',
      render: (value) =>
        value !== undefined && value !== null ? `${value}%` : '',
    },
    { key: 'id', header: 'ID', sortable: false },
    { key: 'createdAt', header: 'Created At', sortable: true },
    { key: 'updatedAt', header: 'Updated At', sortable: true },
    {
      key: 'action',
      header: 'Action',
      sortable: false,
      render: (_: any, row: any) => (
        <ActionButtons
          row={row}
          onUpdate={handleUpdateClick}
          onDelete={handleDeleteRow}
        />
      ),
    },
  ];

  const fetchAllBacktests = async () => {
    try {
      const res = await fetch('/api/backtest');
      const data = await res.json();
      if (res.ok && data.pairs) {
        setBacktests(data.pairs);
      }
    } catch (err) {
      // Optionally show a toast
    }
  };

  useEffect(() => {
    fetchAllBacktests();
  }, []);

  // Fetch pair/backtest data from API
  const checkBacktestExists = async (symbol: string, timeframe: string) => {
    try {
      const res = await fetch(
        `/api/backtest?symbol=${encodeURIComponent(
          symbol
        )}&timeframe=${encodeURIComponent(timeframe)}`
      );
      if (!res.ok) return null;
      const data = await res.json();
      if (data.found && data.pair) {
        return data.pair;
      }
      return null;
    } catch (err) {
      return null;
    }
  };

  // Handle next step after upload
  /*const handleNextStep = async (nextSymbol: string, nextTimeframe: string) => {
    // Only proceed if both symbol and timeframe are present
    if (!nextSymbol || !nextTimeframe) {
      alert('Symbol and Timeframe must be present in the Properties sheet.');
      return;
    }
    setSymbol(nextSymbol);
    setTimeframe(nextTimeframe);
    const existing = await checkBacktestExists(nextSymbol, nextTimeframe);
    if (existing) {
      setFormData(existing);
      setStep('update');
    } else {
      setFormData({ symbol: nextSymbol, timeframe: nextTimeframe });
      setStep('form');
    }
    setIsModalOpen(false);
  };*/

  // Handle cancel button
  const handleCancel = () => {
    setUploadedFiles([]);
    setSymbol('');
    setTimeframe('');
    setStep('upload');
    setFormData(null);
  };

  // Remove sheetData/activeSheet effect (not needed for multi-file, no preview)

  // Separate add and update handlers
  const handleAddSubmit = async (values: any) => {
    try {
      // Attach metrics as empty object for now (multi-file mode)
      const payload = {
        ...values,
        metrics: {},
      };
      const response = await fetch('/api/backtest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) {
        toast.error(result.error || 'Failed to add backtest', {
          style: { background: '#ef4444', color: 'white' },
        });
        return;
      }
      toast.success('Backtest added successfully!', {
        style: { background: '#22c55e', color: 'white' },
      });
    } catch (err) {
      console.log(err);
      toast.error('Error adding backtest', {
        style: { background: '#ef4444', color: 'white' },
      });
      return;
    }
    setStep('upload');
    setFormData(null);
    setSymbol('');
    setTimeframe('');
    fetchAllBacktests();
  };

  // Removed handleUpdateSubmit

  return (
    <GradientBackground>
      <Toaster position="top-center" />
      <div className="min-h-screen flex flex-col justify-between p-0 md:p-4">
        {/* Page Title & Stats */}
        <div className="mb-0">
          <h1 className="text-3xl font-bold mb-6 text-white drop-shadow-lg">
            Backtest Data Management
          </h1>
          {/* TODO: Replace with real stats data */}
          <DashboardStats
            totalPairs={0}
            profitablePairs={0}
            totalProfit={0}
            bestPerformer={{ symbol: '', roi: 0 }}
            className="mb-0 opacity-95"
          />
        </div>

        {/* Actions Bar & Table Section */}
        <div className="flex flex-col justify-end mt-12">
          <div className="flex-1 min-h-0 space-y-4">
            {/* Actions Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
              <SortFilterBar
                filterBy="all"
                onFilterChange={() => {}}
                totalResults={0}
              />
              <Button
                onClick={() => setIsModalOpen(true)}
                className="bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold px-6 py-2 rounded-xl shadow-lg"
              >
                + Add New Backtest
              </Button>
            </div>

            {/* Upload Modal (separated component) */}
            <UploadDialog
              open={isModalOpen}
              onOpenChange={setIsModalOpen}
              uploadedFiles={uploadedFiles}
              setUploadedFiles={setUploadedFiles}
              onAddAllBacktest={async (files) => {
                let newFiles = [...uploadedFiles];
                for (const file of files) {
                  try {
                    const parsed: any = await parseFile(file);
                    const res = await fetch('/api/backtest', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(parsed),
                    });
                    if (res.ok) {
                      toast.success(
                        `Added: ${parsed.symbol} ${parsed.timeframe}`,
                        { style: { background: '#22c55e', color: 'white' } }
                      );
                      newFiles = newFiles.filter((f) => f !== file);
                    } else {
                      const err = await res.json();
                      toast.error(
                        `Failed: ${parsed.symbol} ${parsed.timeframe} - ${err.error}`,
                        { style: { background: '#ef4444', color: 'white' } }
                      );
                    }
                  } catch (err) {
                    toast.error(`Parse error: ${file.name}`, {
                      style: { background: '#ef4444', color: 'white' },
                    });
                  }
                }
                setUploadedFiles(newFiles);
                fetchAllBacktests();
              }}
              onUpdateAllBacktest={async (files) => {
                let newFiles = [...uploadedFiles];
                for (const file of files) {
                  try {
                    const parsed: any = await parseFile(file);
                    // Get id for update
                    let id = null;
                    try {
                      const res = await fetch(
                        `/api/backtest?symbol=${encodeURIComponent(
                          parsed.symbol
                        )}&timeframe=${encodeURIComponent(parsed.timeframe)}`
                      );
                      if (res.ok) {
                        const json = await res.json();
                        id = json.pair?.id;
                      }
                    } catch {}
                    if (!id) {
                      toast.error(
                        `No existing backtest for ${parsed.symbol} ${parsed.timeframe}`
                      );
                      continue;
                    }
                    const res = await fetch('/api/backtest', {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ ...parsed, id }),
                    });
                    if (res.ok) {
                      toast.success(
                        `Updated: ${parsed.symbol} ${parsed.timeframe}`,
                        { style: { background: '#22c55e', color: 'white' } }
                      );
                      newFiles = newFiles.filter((f) => f !== file);
                    } else {
                      const err = await res.json();
                      toast.error(
                        `Failed: ${parsed.symbol} ${parsed.timeframe} - ${err.error}`,
                        { style: { background: '#ef4444', color: 'white' } }
                      );
                    }
                  } catch (err) {
                    toast.error(`Parse error: ${file.name}`, {
                      style: { background: '#ef4444', color: 'white' },
                    });
                  }
                }
                setUploadedFiles(newFiles);
                fetchAllBacktests();
              }}
              onCancel={handleCancel}
            />

            {/* Show add or update form */}
            {step === 'form' && (
              <BacktestForm
                key={symbol ?? ''}
                defaultValues={formData}
                symbol={symbol}
                timeframe={timeframe}
                onSubmit={handleAddSubmit}
                onCancel={() => {
                  setStep('upload');
                  setFormData(null);
                  setSymbol('');
                  setTimeframe('');
                }}
              />
            )}
            {step === 'update' && (
              <UpdateBacktestForm
                key={formData?.id ?? symbol ?? ''}
                defaultValues={formData}
                symbol={symbol}
                timeframe={timeframe}
                onSubmit={handleUpdate}
                onCancel={() => {
                  setStep('upload');
                  setFormData(null);
                  setSymbol('');
                  setTimeframe('');
                }}
              />
            )}

            {/* Backtest Table */}
            <Card className="flex bg-white/5 backdrop-blur-md border-white/20 shadow-xl mt-0">
              <div className="flex-1 min-h-0 space-y-4">
                <ReusableTable
                  data={backtests}
                  columns={columns}
                  title="Backtest Files"
                  subtitle="List of uploaded backtests and their metrics."
                  itemsPerPage={10}
                  frozenColumnKey="symbol"
                  className=''
                />
                {/* Delete Modal */}
                <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Delete Backtest</DialogTitle>
                    </DialogHeader>
                    {deleteRow && (
                      <div className="space-y-4">
                        <div className="text-lg font-semibold text-red-600">
                          Are you sure you want to delete this backtest?
                        </div>
                        <div className="text-white/90">
                          Symbol:{' '}
                          <span className="font-mono">{deleteRow.symbol}</span>
                        </div>
                        <div className="text-white/90">
                          Timeframe:{' '}
                          <span className="font-mono">{deleteRow.timeframe}</span>
                        </div>
                        <div className="text-yellow-400 text-sm">
                          This action cannot be undone.
                        </div>
                        <div className="flex gap-4 justify-end mt-6">
                          <Button
                            variant="outline"
                            onClick={() => setDeleteModalOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={handleDeleteConfirm}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </GradientBackground>
  );
};

export default ConsolePage;
