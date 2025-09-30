import React, { use, useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ReusableTable } from '@/components/ui/reusable-table';

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  uploadedFile: File | null;
  setUploadedFile: (file: File | null) => void;
  sheetData: Record<string, any[]>;
  setSheetData: (data: Record<string, any[]>) => void;
  activeSheet: string;
  setActiveSheet: (sheet: string) => void;
  onNextStep?: (symbol: string, timeframe: string, sheetData: any[]) => void;
  symbol: string;
  timeframe: string;
  onCancel: () => void;
}

const UploadDialog: React.FC<UploadDialogProps> = ({
  open,
  onOpenChange,
  uploadedFile,
  setUploadedFile,
  sheetData,
  setSheetData,
  activeSheet,
  setActiveSheet,
  onNextStep,
  symbol,
  timeframe,
  onCancel,
}) => {
  const [loading, setLoading] = useState(false);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-screen w-full md:w-[70vw] h-[90vh] overflow-auto bg-gradient-to-br from-black/40 to-black/60 border backdrop-blur-2xl border-white/30 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-white">Upload Backtest File</DialogTitle>
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
              <>
                <div className="w-full overflow-x-hidden">
                  <div className="min-w-[600px]">
                    <ReusableTable
                      data={sheetData[activeSheet]}
                      columns={Object.keys(sheetData[activeSheet][0] || {}).map(
                        (key) => ({
                          key,
                          header: key,
                          sortable: true,
                        })
                      )}
                      itemsPerPage={10}
                      title={activeSheet}
                      subtitle={`Sheet: ${activeSheet}`}
                    />
                  </div>
                </div>
                {/* Next Step & Cancel Buttons */}
                <div className="flex justify-end mt-6 gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="px-6 py-2 rounded-xl shadow-lg border border-white/30 text-white"
                    onClick={() => {
                      if (!loading) {
                        onCancel();
                        if (onOpenChange) onOpenChange(false);
                      }
                    }}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-6 py-2 rounded-xl shadow-lg"
                    onClick={async () => {
                      if (onNextStep && !loading) {
                        setLoading(true);
                        await onNextStep(
                          symbol,
                          timeframe,
                          sheetData[activeSheet]
                        );
                        setLoading(false);
                      }
                    }}
                    disabled={!symbol || !timeframe || loading}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <svg
                          className="animate-spin h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                          ></path>
                        </svg>
                        Next Step...
                      </span>
                    ) : (
                      'Next Step'
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UploadDialog;
