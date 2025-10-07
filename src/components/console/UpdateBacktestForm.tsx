import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Controller } from 'react-hook-form';

export type UpdateBacktestFormValues = {
  symbol: string;
  timeframe: string;
  version?: string;
  performance?: string | null;
  tradesAnalysis?: string | null;
  riskPerformanceRatios?: string | null;
  listOfTrades?: string | null;
  properties?: string | null;
  priceOneMonth: string | number;
  priceThreeMonths: string | number;
  priceSixMonths: string | number;
  priceTwelveMonths: string | number;
  discountOneMonth: string | number;
  discountThreeMonths: string | number;
  discountSixMonths: string | number;
  discountTwelveMonths: string | number;
  createdAt?: Date;
};

interface UpdateBacktestFormProps {
  defaultValues?: Partial<UpdateBacktestFormValues>;
  onSubmit: (values: UpdateBacktestFormValues) => void;
  onCancel: () => void;
  symbol: string;
  timeframe: string;
}

const UpdateBacktestForm: React.FC<UpdateBacktestFormProps> = ({
  defaultValues,
  onSubmit,
  onCancel,
  symbol,
  timeframe,
}) => {
  const [loading, setLoading] = React.useState(false);
  const form = useForm<UpdateBacktestFormValues>({
    defaultValues: {
      symbol: symbol || defaultValues?.symbol || '',
      version: defaultValues?.version || '',
      performance: defaultValues?.performance || null,
      tradesAnalysis: defaultValues?.tradesAnalysis || null,
      riskPerformanceRatios: defaultValues?.riskPerformanceRatios || null,
      listOfTrades: defaultValues?.listOfTrades || null,
      properties: defaultValues?.properties || null,
      priceOneMonth: defaultValues?.priceOneMonth ?? 0,
      priceThreeMonths: defaultValues?.priceThreeMonths ?? 0,
      priceSixMonths: defaultValues?.priceSixMonths ?? 0,
      priceTwelveMonths: defaultValues?.priceTwelveMonths ?? 0,
      discountOneMonth: defaultValues?.discountOneMonth ?? 0,
      discountThreeMonths: defaultValues?.discountThreeMonths ?? 0,
      discountSixMonths: defaultValues?.discountSixMonths ?? 0,
      discountTwelveMonths: defaultValues?.discountTwelveMonths ?? 0,
      timeframe: timeframe || defaultValues?.timeframe || '',
      createdAt: defaultValues?.createdAt || new Date(),
      ...defaultValues,
    },
  });

  useEffect(() => {
    form.reset({
      symbol: symbol || defaultValues?.symbol || '',
      timeframe: timeframe || defaultValues?.timeframe || '',
      version: defaultValues?.version || '',
      performance: defaultValues?.performance || null,
      tradesAnalysis: defaultValues?.tradesAnalysis || null,
      riskPerformanceRatios: defaultValues?.riskPerformanceRatios || null,
      listOfTrades: defaultValues?.listOfTrades || null,
      properties: defaultValues?.properties || null,
      priceOneMonth: defaultValues?.priceOneMonth ?? 0,
      priceThreeMonths: defaultValues?.priceThreeMonths ?? 0,
      priceSixMonths: defaultValues?.priceSixMonths ?? 0,
      priceTwelveMonths: defaultValues?.priceTwelveMonths ?? 0,
      discountOneMonth: defaultValues?.discountOneMonth ?? 0,
      discountThreeMonths: defaultValues?.discountThreeMonths ?? 0,
      discountSixMonths: defaultValues?.discountSixMonths ?? 0,
      discountTwelveMonths: defaultValues?.discountTwelveMonths ?? 0,
      createdAt: defaultValues?.createdAt || new Date(),
    });
  }, [defaultValues, symbol, timeframe]);

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-screen w-full md:max-w-[70vw] h-[90vh] overflow-auto bg-gradient-to-br from-black/40 to-black/60 border backdrop-blur-2xl border-white/30 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-white text-2xl font-bold mb-4">
            Update Backtest
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(async (data) => {
              setLoading(true);
              try {
                await Promise.resolve(onSubmit(data));
              } finally {
                setLoading(false);
              }
            })}
          >
            {/* First row: Symbol and Timeframe */}
            <div className="flex gap-4 mb-6">
              <FormField
                control={form.control}
                name="symbol"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Symbol</FormLabel>
                    <FormControl>
                      <Input {...field} readOnly={true} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="timeframe"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Timeframe</FormLabel>
                    <FormControl>
                      <Input {...field} readOnly={true} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="version"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Version</FormLabel>
                    <FormControl>
                      <Input {...field} readOnly={true} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Enhanced Pricing Table Layout */}
            <div className="mb-6">
              {/* Period Headers */}
              <div className="grid grid-cols-5 gap-4 mb-4">
                <div></div> {/* Empty space for row labels */}
                <div className="text-center">
                  <h3 className="text-sm font-semibold text-white/90 bg-blue-600/20 py-2 px-3 rounded-lg border border-blue-500/30">
                    1 Month
                  </h3>
                </div>
                <div className="text-center">
                  <h3 className="text-sm font-semibold text-white/90 bg-green-600/20 py-2 px-3 rounded-lg border border-green-500/30">
                    3 Months
                  </h3>
                </div>
                <div className="text-center">
                  <h3 className="text-sm font-semibold text-white/90 bg-purple-600/20 py-2 px-3 rounded-lg border border-purple-500/30">
                    6 Months
                  </h3>
                </div>
                <div className="text-center">
                  <h3 className="text-sm font-semibold text-white/90 bg-orange-600/20 py-2 px-3 rounded-lg border border-orange-500/30">
                    12 Months
                  </h3>
                </div>
              </div>

              {/* Price Row */}
              <div className="grid grid-cols-5 gap-4 mb-4 items-end">
                <div className="flex items-center justify-end pr-2">
                  <label className="text-sm font-medium text-white/90 bg-slate-700/50 py-2 px-4 rounded-lg">
                    Price ($)
                  </label>
                </div>
                <FormField
                  control={form.control}
                  name="priceOneMonth"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input {...field} type="number" step="0.01" min="0" className="text-center" placeholder="0.00" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="priceThreeMonths"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input {...field} type="number" step="0.01" min="0" className="text-center" placeholder="0.00" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="priceSixMonths"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input {...field} type="number" step="0.01" min="0" className="text-center" placeholder="0.00" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="priceTwelveMonths"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input {...field} type="number" step="0.01" min="0" className="text-center" placeholder="0.00" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Discount Row */}
              <div className="grid grid-cols-5 gap-4 mb-4 items-end">
                <div className="flex items-center justify-end pr-2">
                  <label className="text-sm font-medium text-white/90 bg-slate-700/50 py-2 px-4 rounded-lg">
                    Discount (%)
                  </label>
                </div>
                <FormField
                  control={form.control}
                  name="discountOneMonth"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input {...field} type="number" step="0.01" min="0" max="100" className="text-center" placeholder="0" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="discountThreeMonths"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input {...field} type="number" step="0.01" min="0" max="100" className="text-center" placeholder="0" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="discountSixMonths"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input {...field} type="number" step="0.01" min="0" max="100" className="text-center" placeholder="0" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="discountTwelveMonths"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input {...field} type="number" step="0.01" min="0" max="100" className="text-center" placeholder="0" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Final Price Row (Display Only) */}
              <div className="grid grid-cols-5 gap-4 mb-4 items-center">
                <div className="flex items-center justify-end pr-2">
                  <label className="text-sm font-medium text-white/90 bg-slate-800/70 py-2 px-4 rounded-lg border border-slate-600">
                    Final Price
                  </label>
                </div>
                <div>
                  <Input 
                    readOnly={true} 
                    value={(() => {
                      const price = Number(form.watch('priceOneMonth')) || 0;
                      const discount = Number(form.watch('discountOneMonth')) || 0;
                      return (price - (price * discount / 100)).toFixed(2);
                    })()} 
                    className="bg-slate-800/50 border-slate-600 text-white/80 cursor-not-allowed text-center font-semibold"
                  />
                </div>
                <div>
                  <Input 
                    readOnly={true} 
                    value={(() => {
                      const price = Number(form.watch('priceThreeMonths')) || 0;
                      const discount = Number(form.watch('discountThreeMonths')) || 0;
                      return (price - (price * discount / 100)).toFixed(2);
                    })()} 
                    className="bg-slate-800/50 border-slate-600 text-white/80 cursor-not-allowed text-center font-semibold"
                  />
                </div>
                <div>
                  <Input 
                    readOnly={true} 
                    value={(() => {
                      const price = Number(form.watch('priceSixMonths')) || 0;
                      const discount = Number(form.watch('discountSixMonths')) || 0;
                      return (price - (price * discount / 100)).toFixed(2);
                    })()} 
                    className="bg-slate-800/50 border-slate-600 text-white/80 cursor-not-allowed text-center font-semibold"
                  />
                </div>
                <div>
                  <Input 
                    readOnly={true} 
                    value={(() => {
                      const price = Number(form.watch('priceTwelveMonths')) || 0;
                      const discount = Number(form.watch('discountTwelveMonths')) || 0;
                      return (price - (price * discount / 100)).toFixed(2);
                    })()} 
                    className="bg-slate-800/50 border-slate-600 text-white/80 cursor-not-allowed text-center font-semibold"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <Button
                type="submit"
                className="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-6 py-2 rounded-xl shadow-lg"
                disabled={loading}
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
                    Updating...
                  </span>
                ) : (
                  'Update Backtest'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateBacktestForm;
