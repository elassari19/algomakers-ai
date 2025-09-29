'use client';

import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { SortFilterBar } from '@/components/subscription/SortFilterBar';
import { ReusableTable, Column } from '@/components/ui/reusable-table';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
// Modal implementation (replace with your Modal component)
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { GradientBackground } from '@/components/ui/gradient-background';

// Dummy data for overview and table
const overviewStats = {
  totalPairs: 12,
  profitablePairs: 8,
  totalProfit: 15200,
  bestPerformer: { symbol: 'BTCUSD', roi: 32.5 },
};

const columns: Column[] = [
  { key: 'symbol', header: 'Symbol', sortable: true },
  { key: 'name', header: 'Name', sortable: true },
  { key: 'roi', header: 'ROI (%)', sortable: true, align: 'right' },
  { key: 'drawdown', header: 'Drawdown (%)', sortable: true, align: 'right' },
  { key: 'trades', header: 'Trades', sortable: true, align: 'right' },
  { key: 'created_at', header: 'Uploaded', sortable: true },
];

const backtestData = [
  {
    symbol: 'BTCUSD',
    name: 'Bitcoin/USD',
    roi: 32.5,
    drawdown: 12.1,
    trades: 120,
    created_at: '2025-09-28',
  },
  {
    symbol: 'ETHUSD',
    name: 'Ethereum/USD',
    roi: 28.7,
    drawdown: 10.4,
    trades: 98,
    created_at: '2025-09-27',
  },
  // ...more rows
];

const ConsolePage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [sheetData, setSheetData] = useState<Record<string, any[]>>({});
  const [activeSheet, setActiveSheet] = useState<string>('');

  // XLSX file upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setUploadedFile(file);
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target?.result;
      const workbook = XLSX.read(data, { type: 'array' });
      const sheets = workbook.SheetNames;
      const parsed: Record<string, any[]> = {};
      sheets.forEach((sheet) => {
        const json = XLSX.utils.sheet_to_json(workbook.Sheets[sheet], {
          defval: '',
        });
        parsed[sheet] = json;
      });
      setSheetData(parsed);
      setActiveSheet(sheets[0] || '');
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <GradientBackground>
      <div className="min-h-screen flex flex-col justify-between p-0 md:p-4">
        {/* Page Title & Stats */}
        <div className="mb-0">
          <h1 className="text-3xl font-bold mb-6 text-white drop-shadow-lg">
            Backtest Data Management
          </h1>
          <DashboardStats {...overviewStats} className="mb-0 opacity-95" />
        </div>

        {/* Actions Bar & Table Section */}
        <div className="flex flex-col justify-end my-12">
          <div className="flex-1 min-h-0 space-y-4">
            {/* Actions Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
              <SortFilterBar
                filterBy="all"
                onFilterChange={() => {}}
                totalResults={backtestData.length}
              />
              <Button
                onClick={() => setIsModalOpen(true)}
                className="bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold px-6 py-2 rounded-xl shadow-lg"
              >
                + Add New Backtest
              </Button>
            </div>

            {/* Upload Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogContent className="max-w-screen w-full md:w-[70vw] h-[90vh] overflow-auto bg-gradient-to-br from-black/40 to-black/60 border backdrop-blur-2xl border-white/30 shadow-2xl">
                <DialogHeader>
                  <DialogTitle className="text-white">
                    Upload Backtest File
                  </DialogTitle>
                </DialogHeader>
                {/* File Upload Input */}
                {!uploadedFile && (
                  <div className="my-4 relative">
                    <div className="mt-4 border-dashed border-2 border-white/30 rounded-xl p-0 bg-white/10 text-center text-white/80 backdrop-blur-md flex flex-col items-center justify-center min-h-[180px]">
                      {/* Absolute file input */}
                      <input
                        type="file"
                        accept=".xlsx,.csv"
                        onChange={handleFileUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="mb-2 text-base font-medium text-white/80">
                        Drag and drop file, or browse
                      </div>
                      <div className="text-xs text-white/50 mb-4">
                        CSV, XLSX, max size 25MB
                      </div>
                      {/* Progress bar placeholder */}
                      <div className="w-2/3 h-2 bg-white/20 rounded-full overflow-hidden mx-auto">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-blue-400 rounded-full transition-all duration-500"
                          style={{ width: uploadedFile ? '100%' : '0%' }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
                {/* File Data Preview with Tabs for Sheets */}
                {uploadedFile && Object.keys(sheetData).length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-semibold mb-4 text-white">
                      File Preview: {uploadedFile.name}
                    </h3>
                    {/* Tabs for sheets */}
                    <div className="flex gap-2 mb-4">
                      {Object.keys(sheetData).map((sheet) => (
                        <button
                          key={sheet}
                          onClick={() => setActiveSheet(sheet)}
                          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors border border-white/20 backdrop-blur-md ${
                            activeSheet === sheet
                              ? 'bg-purple-600 text-white'
                              : 'bg-white/10 text-white/70 hover:bg-purple-400/30'
                          }`}
                        >
                          {sheet}
                        </button>
                      ))}
                    </div>
                    {/* Table for active sheet */}
                    {activeSheet && sheetData[activeSheet] && (
                      <div className="w-full overflow-x-hidden">
                        <div className="min-w-[600px]">
                          <ReusableTable
                            data={sheetData[activeSheet]}
                            columns={Object.keys(
                              sheetData[activeSheet][0] || {}
                            ).map((key) => ({
                              key,
                              header: key,
                              sortable: true,
                            }))}
                            itemsPerPage={10}
                            title={activeSheet}
                            subtitle={`Sheet: ${activeSheet}`}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </DialogContent>
            </Dialog>

            {/* Backtest Table */}
            <Card className="bg-white/5 backdrop-blur-md border-white/20 shadow-xl mt-8">
              <ReusableTable
                data={backtestData}
                columns={columns}
                title="Backtest Files"
                subtitle="List of uploaded backtests and their metrics."
                itemsPerPage={10}
              />
            </Card>
          </div>
        </div>
      </div>
    </GradientBackground>
  );
};

export default ConsolePage;
