interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  uploadedFiles: File[];
  setUploadedFiles: (files: File[]) => void;
  onAddAllBacktest?: (files: File[]) => void;
  onUpdateAllBacktest?: (files: File[]) => void;
  onCancel: () => void;
}
import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ReusableTable } from '@/components/ui/reusable-table';

const UploadDialog: React.FC<UploadDialogProps> = ({
  open,
  onOpenChange,
  uploadedFiles,
  setUploadedFiles,
  onAddAllBacktest,
  onUpdateAllBacktest,
  onCancel,
}) => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'select' | 'review'>('select');
  const [addFiles, setAddFiles] = useState<any[]>([]);
  const [updateFiles, setUpdateFiles] = useState<any[]>([]);
  const [fileInfos, setFileInfos] = useState<any[]>([]); // [{file, symbol, timeframe, exists, data}]

  // Helper to wrap async button actions with loading
  const withLoading = async (fn: () => Promise<void>) => {
    setLoading(true);
    try {
      await fn();
    } finally {
      setLoading(false);
    }
  };

  // Multi-file upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadedFiles(files);
    setStep('select');
    setAddFiles([]);
    setUpdateFiles([]);
    setFileInfos([]);
  };

  // Parse file and extract symbol/timeframe from Properties sheet (XLSX or CSV)
  const parseFile = async (file: File) => {
    return new Promise<{ symbol: string; timeframe: string; strategy: string; data: any }>(
      (resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (evt) => {
          try {
            let symbol = '';
            let timeframe = '';
            let strategy = '';
            let data: any = {};
            if (file.name.endsWith('.csv')) {
              // Parse CSV as array of objects
              const text = evt.target?.result as string;
              const rows = XLSX.utils.sheet_to_json<{ [key: string]: any }>(
                XLSX.read(text, { type: 'string' }).Sheets.Sheet1,
                { defval: '' }
              );
              data = { Sheet1: rows };
              // Try to extract symbol/timeframe from first row
              if (rows[0]) {
                symbol = rows[0]['symbol'] || '';
                timeframe = rows[0]['timeframe'] || '';
                strategy = rows[0]['strategy'] || '';
              }
            } else {
              // XLSX
              const workbook = XLSX.read(evt.target?.result, { type: 'array' });
              const sheets = workbook.SheetNames;
              data = {};
              sheets.forEach((sheet) => {
                data[sheet] = XLSX.utils.sheet_to_json(workbook.Sheets[sheet], {
                  defval: '',
                });
              });
              // Try to extract symbol/timeframe from Properties sheet
              if (data['Properties']) {
                symbol = data['Properties'][2]?.value || '';
                timeframe = data['Properties'][3]?.value || '';
                strategy = data['Properties'][9]?.value || '';
              }
            }
            resolve({ symbol, timeframe, strategy, data });
          } catch (err) {
            reject(err);
          }
        };
        if (file.name.endsWith('.csv')) {
          reader.readAsText(file);
        } else {
          reader.readAsArrayBuffer(file);
        }
      }
    );
  };

  // Check existence for all files and group
  const handleNext = async () => {
    setLoading(true);
    const add: any[] = [];
    const update: any[] = [];
    const infos: any[] = [];
    for (const file of uploadedFiles) {
      try {
        const { symbol, timeframe, strategy, data } = await parseFile(file);
        let exists = false;
        let existingData = null;
        if (symbol && timeframe && strategy) {
          // Check existence via API
          const res = await fetch(
            `/api/backtest?symbol=${encodeURIComponent(
              symbol
            )}&timeframe=${encodeURIComponent(timeframe)}&strategy=${encodeURIComponent(strategy)}`
          );
          if (res.ok) {
            const json = await res.json();
            exists = !!json.found;
            existingData = json.pair || null;
          }
        }
        const info = { file, symbol, timeframe, exists, data, existingData };
        infos.push(info);
        if (exists) update.push(info);
        else add.push(info);
      } catch (err) {
        infos.push({
          file,
          symbol: '',
          timeframe: '',
          strategy: '',
          exists: false,
          data: null,
          error: true,
        });
        add.push({
          file,
          symbol: '',
          timeframe: '',
          strategy: '',
          exists: false,
          data: null,
          error: true,
        });
      }
    }
    setFileInfos(infos);
    setAddFiles(add);
    setUpdateFiles(update);
    setStep('review');
    setLoading(false);
  };

  // UI
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-screen w-full md:w-[80vw] h-[70vh] overflow-auto bg-gradient-to-br from-black/40 to-black/60 border backdrop-blur-2xl border-white/30 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-white">Upload Backtest File</DialogTitle>
        </DialogHeader>
        {step === 'select' && (
          <>
            {/* File Upload Input (multi-file) */}
            <div className="my-4 relative">
              <div className="mt-4 border-dashed border-2 border-white/30 rounded-xl p-0 bg-white/10 text-center text-white/80 backdrop-blur-md flex flex-col items-center justify-center min-h-[180px]">
                <input
                  type="file"
                  accept=".xlsx,.csv"
                  multiple
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="mb-2 text-base font-medium text-white/80">
                  Drag and drop files, or browse
                </div>
                <div className="text-xs text-white/50 mb-4">
                  CSV, XLSX, max size 25MB each
                </div>
                {/* Progress bar placeholder */}
                <div className="w-2/3 h-2 bg-white/20 rounded-full overflow-hidden mx-auto">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-blue-400 rounded-full transition-all duration-500"
                    style={{ width: uploadedFiles?.length > 0 ? '100%' : '0%' }}
                  ></div>
                </div>
              </div>
            </div>
            {/* File List (no preview, just name and size) */}
            {uploadedFiles?.length > 0 && (
              <div className="">
                <h3 className="font-semibold mb-4 text-white">
                  Selected Files
                </h3>
                <ul className="space-y-2">
                  {uploadedFiles?.map((file: File, idx: number) => (
                    <li
                      key={idx}
                      className="flex items-center justify-between bg-white/10 rounded-lg px-4 py-2 text-white/80"
                    >
                      <span
                        className="truncate max-w-[200px]"
                        title={file.name}
                      >
                        {file.name.length > 20
                          ? file.name.slice(0, 17) + '...'
                          : file.name}
                      </span>
                      <span className="text-xs text-white/60 ml-4">
                        {(file.size / 1024).toFixed(1)} KB
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {/* Modal Bottom Buttons */}
            <div className="flex justify-end mt-8 gap-4">
              <Button
                type="button"
                variant="outline"
                className="px-6 py-2 rounded-xl shadow-lg border border-white/30 text-white"
                onClick={() =>
                  withLoading(async () => {
                    onCancel();
                    if (onOpenChange) onOpenChange(false);
                  })
                }
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                className="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-6 py-2 rounded-xl shadow-lg"
                onClick={() => withLoading(handleNext)}
                disabled={uploadedFiles?.length === 0 || loading}
              >
                {loading ? 'Checking...' : 'Next'}
              </Button>
            </div>
          </>
        )}
        {step === 'review' && (
          <>
            {/* Add New Backtest Group */}
            <div className="">
              <h3 className="font-semibold mb-2 text-green-400">
                Add New Backtest
              </h3>
              {addFiles.length === 0 && (
                <div className="text-white/60 h-fit">
                  No new backtests to add.
                </div>
              )}
              <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {addFiles.map((info, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between bg-white/10 rounded-lg px-4 py-2 text-white/80"
                  >
                    <span
                      className="truncate max-w-[200px]"
                      title={info.file.name}
                    >
                      {info.file.name.length > 20
                        ? info.file.name.slice(0, 17) + '...'
                        : info.file.name}
                    </span>
                    <span className="text-xs text-white/60 ml-4">
                      {(info.file.size / 1024).toFixed(1)} KB
                    </span>
                    <span className="ml-4 text-xs text-white/80">
                      Symbol: <b>{info.symbol}</b> | Timeframe:{' '}
                      <b>{info.timeframe}</b>
                    </span>
                    <Button
                      size="sm"
                      className="ml-4"
                      onClick={() =>
                        withLoading(async () => {
                          if (onAddAllBacktest) {
                            await onAddAllBacktest([info.file]);
                            setAddFiles((prev) =>
                              prev.filter((f) => f.file !== info.file)
                            );
                            setFileInfos((prev) =>
                              prev.filter((f) => f.file !== info.file)
                            );
                          }
                        })
                      }
                      disabled={loading}
                    >
                      Add
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
            {/* Update Backtest Group */}
            <div className="mt-8">
              <h3 className="font-semibold mb-2 text-yellow-400">
                Update Existing Backtest
              </h3>
              {updateFiles.length === 0 && (
                <div className="text-white/60 h-fit">
                  No existing backtests to update.
                </div>
              )}
              <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {updateFiles.map((info, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between bg-white/10 rounded-lg px-4 py-2 text-white/80"
                  >
                    <span
                      className="truncate max-w-[200px]"
                      title={info.file.name}
                    >
                      {info.file.name.length > 20
                        ? info.file.name.slice(0, 17) + '...'
                        : info.file.name}
                    </span>
                    <span className="text-xs text-white/60 ml-4">
                      {(info.file.size / 1024).toFixed(1)} KB
                    </span>
                    <span className="ml-4 text-xs text-white/80">
                      Symbol: <b>{info.symbol}</b> | Timeframe:{' '}
                      <b>{info.timeframe}</b>
                    </span>
                    <Button
                      size="sm"
                      className="ml-4"
                      onClick={() =>
                        withLoading(async () => {
                          if (onUpdateAllBacktest) {
                            await onUpdateAllBacktest([info.file]);
                            setUpdateFiles((prev) =>
                              prev.filter((f) => f.file !== info.file)
                            );
                            setFileInfos((prev) =>
                              prev.filter((f) => f.file !== info.file)
                            );
                          }
                        })
                      }
                      disabled={loading}
                    >
                      Update
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
            {/* Modal Bottom Buttons */}
            <div className="flex justify-between mt-8 gap-4">
              {/* Left: Done button */}
              <div>
                <Button
                  type="button"
                  variant="secondary"
                  className="px-6 py-2 rounded-xl shadow-lg border border-white/30 text-white"
                  onClick={() =>
                    withLoading(async () => {
                      setStep('select');
                      setAddFiles([]);
                      setUpdateFiles([]);
                      setFileInfos([]);
                      setUploadedFiles([]);
                      if (onOpenChange) onOpenChange(false);
                    })
                  }
                  disabled={loading}
                >
                  Done
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="ml-2 px-6 py-2 rounded-xl shadow-lg border border-white/30 text-white"
                  onClick={() => {
                    setStep('select');
                    setAddFiles([]);
                    setUpdateFiles([]);
                    setFileInfos([]);
                  }}
                  disabled={loading}
                >
                  Back
                </Button>
              </div>
              {/* Right: Add/Update All */}
              <div className="flex gap-4">
                <Button
                  className="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-6 py-2 rounded-xl shadow-lg"
                  onClick={() =>
                    withLoading(async () => {
                      if (onAddAllBacktest) {
                        await onAddAllBacktest(addFiles.map((f) => f.file));
                        setAddFiles([]);
                        setFileInfos((prev) =>
                          prev.filter(
                            (f) => !addFiles.some((af) => af.file === f.file)
                          )
                        );
                      }
                    })
                  }
                  disabled={addFiles.length === 0 || loading}
                >
                  Add All Backtest
                </Button>
                <Button
                  className="bg-gradient-to-r from-blue-600 to-purple-500 text-white px-6 py-2 rounded-xl shadow-lg"
                  onClick={() =>
                    withLoading(async () => {
                      if (onUpdateAllBacktest) {
                        await onUpdateAllBacktest(
                          updateFiles.map((f) => f.file)
                        );
                        setUpdateFiles([]);
                        setFileInfos((prev) =>
                          prev.filter(
                            (f) => !updateFiles.some((uf) => uf.file === f.file)
                          )
                        );
                      }
                    })
                  }
                  disabled={updateFiles.length === 0 || loading}
                >
                  Update All Backtest
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UploadDialog;
