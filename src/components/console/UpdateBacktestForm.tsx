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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
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
  strategy?: string;
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
      strategy: defaultValues?.strategy || '',
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
      strategy: defaultValues?.strategy || '',
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
      <DialogContent className="max-w-screen w-full md:w-[70vw] h-[90vh] overflow-auto bg-gradient-to-br from-black/40 to-black/60 border backdrop-blur-2xl border-white/30 shadow-2xl">
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
              <Controller
                name="timeframe"
                control={form.control}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Timeframe</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={true}
                      >
                        <SelectTrigger className="w-full">
                          <span className="text-white/80">
                            {field.value || 'Select timeframe'}
                          </span>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1m">1m</SelectItem>
                          <SelectItem value="5m">5m</SelectItem>
                          <SelectItem value="15m">15m</SelectItem>
                          <SelectItem value="1h">1h</SelectItem>
                          <SelectItem value="4h">4h</SelectItem>
                          <SelectItem value="1d">1d</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {/* Second row: Period Prices */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <FormField
                control={form.control}
                name="priceOneMonth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price (1 Month)</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                    <FormLabel>Price (3 Months)</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                    <FormLabel>Price (6 Months)</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                    <FormLabel>Price (12 Months)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {/* Third row: Period Discounts */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <FormField
                control={form.control}
                name="discountOneMonth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discount (1 Month)</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                    <FormLabel>Discount (3 Months)</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                    <FormLabel>Discount (6 Months)</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                    <FormLabel>Discount (12 Months)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
