'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import * as XLSX from 'xlsx';
import { OverviewSection, OverviewDataItem } from '@/components/dashboard/DashboardStats';
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
import { Eye, Pencil, Trash2, BarChart3, Target, DollarSign, Award, TrendingUp } from 'lucide-react';
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

// Helper to parse file and extract fields (symbol/timeframe from Properties, separate columns for different data types)
const parseFile = async (file: File) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        let symbol = '';
        let timeframe = '';
        let strategy = '';
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
          strategy = data['Properties'][9]?.value || '';
        }
        
        // Split data into separate columns based on sheet names and stringify them
        const performance = data['Performance'] ? JSON.stringify(data['Performance']) : null;
        const tradesAnalysis = data['Trades analysis'] ? JSON.stringify(data['Trades analysis']) : null;
        const riskPerformanceRatios = data['Risk performance ratios'] ? JSON.stringify(data['Risk performance ratios']) : null;
        const listOfTrades = data['List of trades'] ? JSON.stringify(data['List of trades']) : null;
        const properties = data['Properties'] ? JSON.stringify(data['Properties']) : null;
        
        resolve({
          symbol,
          timeframe,
          strategy,
          performance,
          tradesAnalysis,
          riskPerformanceRatios,
          listOfTrades,
          properties,
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [step, setStep] = useState<'upload' | 'form' | 'update'>('upload');
  const [formData, setFormData] = useState<any>(null);
  // Remove formMode, always add
  const [symbol, setSymbol] = useState<string>('');
  const [timeframe, setTimeframe] = useState<string>('');
  const [backtests, setBacktests] = useState<any[]>([]);
  
  // Stats state for overview
  const [stats, setStats] = useState({
    totalBacktests: 0,
    profitableBacktests: 0,
    totalProfit: 0,
    bestPerformer: { symbol: 'N/A', roi: 0 },
    averageROI: 0,
  });

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
      // console.log(err);
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
    { key: 'strategy', header: 'Strategy', sortable: true },
    {
      key: 'oneMonth',
      header: '1 Month',
      sortable: false,
      align: 'center',
      render: (_, row) => {
        const price = row.priceOneMonth;
        const discount = row.discountOneMonth;
        return (
          <div className="text-center">
            <div className="font-medium">${price || '0'}</div>
            {discount !== undefined && discount !== null && (
              <div className="text-xs text-green-400">{discount}% off</div>
            )}
          </div>
        );
      },
    },
    {
      key: 'threeMonths',
      header: '3 Months',
      sortable: false,
      align: 'center',
      render: (_, row) => {
        const price = row.priceThreeMonths;
        const discount = row.discountThreeMonths;
        return (
          <div className="text-center">
            <div className="font-medium">${price || '0'}</div>
            {discount !== undefined && discount !== null && (
              <div className="text-xs text-green-400">{discount}% off</div>
            )}
          </div>
        );
      },
    },
    {
      key: 'sixMonths',
      header: '6 Months',
      sortable: false,
      align: 'center',
      render: (_, row) => {
        const price = row.priceSixMonths;
        const discount = row.discountSixMonths;
        return (
          <div className="text-center">
            <div className="font-medium">${price || '0'}</div>
            {discount !== undefined && discount !== null && (
              <div className="text-xs text-green-400">{discount}% off</div>
            )}
          </div>
        );
      },
    },
    {
      key: 'twelveMonths',
      header: '12 Months',
      sortable: false,
      align: 'center',
      render: (_, row) => {
        const price = row.priceTwelveMonths;
        const discount = row.discountTwelveMonths;
        return (
          <div className="text-center">
            <div className="font-medium">${price || '0'}</div>
            {discount !== undefined && discount !== null && (
              <div className="text-xs text-green-400">{discount}% off</div>
            )}
          </div>
        );
      },
    },
    { key: 'id', header: 'ID', sortable: false },
    { 
      key: 'createdAt', 
      header: 'Created At', 
      sortable: true,
      render: (value) => {
        if (!value) return '';
        const date = new Date(value);
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    },
    { 
      key: 'updatedAt', 
      header: 'Updated At', 
      sortable: true,
      render: (value) => {
        if (!value) return '';
        const date = new Date(value);
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    },
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

  // Calculate stats from backtest data
  const calculateStats = (pairs: any[]) => {
    if (!pairs || pairs.length === 0) {
      return {
        totalBacktests: 0,
        profitableBacktests: 0,
        totalProfit: 0,
        bestPerformer: { symbol: 'N/A', roi: 0 },
        averageROI: 0,
      };
    }

    // Calculate profitable pairs using separate columns (parse stringified JSON)
    const profitablePairs = pairs.filter(pair => {
      let roi = 0;
      try {
        // Try to get ROI from tradesAnalysis or performance columns
        if (pair.tradesAnalysis && typeof pair.tradesAnalysis === 'string') {
          const tradesAnalysisData = JSON.parse(pair.tradesAnalysis);
          roi = tradesAnalysisData[9]?.value || 0;
        } else if (pair.performance && typeof pair.performance === 'string') {
          const performanceData = JSON.parse(pair.performance);
          roi = performanceData[4]?.value || 0;
        }
      } catch (e) {
        // Handle JSON parse errors gracefully
        roi = 0;
      }
      return roi > 0;
    });

    // Calculate total profit and best performer
    let totalProfit = 0;
    let bestPerformer = { symbol: 'N/A', roi: 0 };
    let totalROI = 0;

    pairs.forEach(pair => {
      let roi = 0;
      let profit = 0;
      
      try {
        // Try to get values from separate columns (parse stringified JSON)
        if (pair.tradesAnalysis && typeof pair.tradesAnalysis === 'string') {
          const tradesAnalysisData = JSON.parse(pair.tradesAnalysis);
          roi = tradesAnalysisData[9]?.value || 0;
          profit = tradesAnalysisData[8]?.value || 0;
        } else if (pair.performance && typeof pair.performance === 'string') {
          const performanceData = JSON.parse(pair.performance);
          roi = performanceData[4]?.value || 0;
          profit = performanceData[2]?.value || 0;
        }
      } catch (e) {
        // Handle JSON parse errors gracefully
        roi = 0;
        profit = 0;
      }
      
      totalProfit += profit;
      totalROI += roi;
      
      if (roi > bestPerformer.roi) {
        bestPerformer = { symbol: pair.symbol, roi };
      }
    });

    const averageROI = pairs.length > 0 ? totalROI / pairs.length : 0;

    return {
      totalBacktests: pairs.length,
      profitableBacktests: profitablePairs.length,
      totalProfit,
      bestPerformer,
      averageROI,
    };
  };

  const fetchAllBacktests = async () => {
    try {
      const res = await fetch('/api/backtest');
      const data = await res.json();
      if (res.ok && data.pairs) {
        setBacktests(data.pairs);
        
        // Calculate and set stats
        const calculatedStats = calculateStats(data.pairs);
        setStats(calculatedStats);
      }
    } catch (err) {
      // Optionally show a toast
    }
  };

  useEffect(() => {
    fetchAllBacktests();
  }, []);

  // Handle cancel button
  const handleCancel = () => {
    setUploadedFiles([]);
    setSymbol('');
    setTimeframe('');
    setStep('upload');
    setFormData(null);
  };

  // Separate add and update handlers
  const handleAddSubmit = async (values: any) => {
    try {
      const response = await fetch('/api/backtest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
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
      // console.log(err);
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

  return (
    <GradientBackground>
      <Toaster position="top-center" />
      <div className="min-h-screen flex flex-col justify-between p-0 md:p-4">
        {/* Page Title & Stats */}
        <div className="mb-4">
          <h1 className="text-3xl font-bold mb-2 text-white drop-shadow-lg">
            Backtest Data Management
          </h1>
          <OverviewSection overviewData={[
            {
              title: 'Total Backtests',
              currentValue: stats.totalBacktests,
              icon: BarChart3,
              description: 'Total backtest files',
              pastValue: 'All trading pairs',
              color: 'text-blue-300',
              bgColor: 'bg-blue-400/20',
            },
            {
              title: 'Profitable Backtests',
              currentValue: stats.profitableBacktests,
              icon: Target,
              description: `${stats.totalBacktests > 0 ? ((stats.profitableBacktests / stats.totalBacktests) * 100).toFixed(1) : '0'}% win rate`,
              pastValue: `${stats.profitableBacktests} of ${stats.totalBacktests} pairs`,
              color: 'text-green-300',
              bgColor: 'bg-green-400/20',
            },
            {
              title: 'Total Profit',
              currentValue: `$${stats.totalProfit.toLocaleString()}`,
              icon: DollarSign,
              description: 'Combined performance',
              pastValue: `Avg ROI: ${stats.averageROI.toFixed(1)}%`,
              color: 'text-emerald-300',
              bgColor: 'bg-emerald-400/20',
            },
            {
              title: 'Best Performer',
              currentValue: stats.bestPerformer.symbol,
              icon: Award,
              description: `${stats.bestPerformer.roi.toFixed(1)}% ROI`,
              pastValue: 'Top performing pair',
              color: 'text-amber-300',
              bgColor: 'bg-amber-400/20',
            },
          ]} className="mb-0 opacity-95" />
        </div>

        {/* Actions Bar & Table Section */}
        <div className="flex flex-col mt-0">
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
                      const queryParams = new URLSearchParams({
                        symbol: parsed.symbol,
                        timeframe: parsed.timeframe,
                      });
                      
                      // Only add strategy if it exists and is not empty
                      if (parsed.strategy && parsed.strategy.trim() !== '') {
                        queryParams.append('strategy', parsed.strategy);
                      }
                      
                      const res = await fetch(`/api/backtest?${queryParams.toString()}`);
                      if (res.ok) {
                        const json = await res.json();
                        if (json.found && json.pair) {
                          id = json.pair.id;
                        }
                      }
                    } catch (error) {
                      console.error('Error fetching existing pair:', error);
                    }
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
