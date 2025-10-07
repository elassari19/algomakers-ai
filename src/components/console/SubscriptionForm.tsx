'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { RefreshCw, Plus, Trash2, Search, User, TrendingUp } from 'lucide-react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

// Type definitions for autocomplete data
interface UserOption {
  id: string;
  name: string;
  email: string;
}

interface PairOption {
  id: string;
  symbol: string;
  timeframe: string;
  version: string;
}

// Individual pair schema
const pairSubscriptionSchema = z.object({
  pairId: z.string().min(1, 'Please select a trading pair'),
  period: z.enum(['ONE_MONTH', 'THREE_MONTHS', 'SIX_MONTHS', 'TWELVE_MONTHS'], {
    message: 'Please select a subscription period',
  }),
  endDate: z.string().min(1, 'End date is required'),
  basePrice: z.string().optional().refine(
    (price) => !price || (!isNaN(Number(price)) && Number(price) >= 0),
    'Base price must be a valid positive number'
  ),
  discountRate: z.string().optional().refine(
    (discount) => !discount || (!isNaN(Number(discount)) && Number(discount) >= 0 && Number(discount) <= 100),
    'Discount rate must be between 0 and 100'
  ),
});

// Main subscription schema for multiple pairs
const subscriptionSchema = z.object({
  userId: z.string().min(1, 'Please select a user'),
  startDate: z.string().min(1, 'Start date is required').refine(
    (date) => new Date(date) >= new Date(new Date().toDateString()),
    'Start date cannot be in the past'
  ),
  pairs: z.array(pairSubscriptionSchema).min(1, 'At least one trading pair is required'),
});

export type SubscriptionFormData = z.infer<typeof subscriptionSchema>;

interface SubscriptionFormProps {
  onSubmit: (data: SubscriptionFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  users?: UserOption[];
  pairs?: PairOption[];
  onSearchUsers?: (query: string) => Promise<UserOption[]>;
  onSearchPairs?: (query: string) => Promise<PairOption[]>;
}

export function SubscriptionForm({ 
  onSubmit, 
  onCancel, 
  loading = false, 
  users = [], 
  pairs = [], 
  onSearchUsers, 
  onSearchPairs 
}: SubscriptionFormProps) {
  const form = useForm<SubscriptionFormData>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      userId: '',
      startDate: new Date().toISOString().split('T')[0], // Today's date
      pairs: [
        {
          pairId: '',
          period: 'ONE_MONTH',
          endDate: '',
          basePrice: '',
          discountRate: '',
        }
      ],
    },
  });

  const handleSubmit = async (data: SubscriptionFormData) => {
    await onSubmit(data);
    if (!loading) {
      form.reset();
    }
  };

  // Auto-calculate end date based on start date and period
  const calculateEndDate = (startDate: string, period: string) => {
    if (!startDate) return '';
    
    const start = new Date(startDate);
    let end = new Date(start);
    
    switch (period) {
      case 'ONE_MONTH':
        end.setMonth(end.getMonth() + 1);
        break;
      case 'THREE_MONTHS':
        end.setMonth(end.getMonth() + 3);
        break;
      case 'SIX_MONTHS':
        end.setMonth(end.getMonth() + 6);
        break;
      case 'TWELVE_MONTHS':
        end.setFullYear(end.getFullYear() + 1);
        break;
    }
    
    return end.toISOString().split('T')[0];
  };

  // Add new pair section
  const addPair = () => {
    const currentPairs = form.getValues('pairs');
    const startDate = form.getValues('startDate');
    form.setValue('pairs', [
      ...currentPairs,
      {
        pairId: '',
        period: 'ONE_MONTH',
        endDate: calculateEndDate(startDate, 'ONE_MONTH'),
        basePrice: '',
        discountRate: '',
      }
    ]);
  };

  // Remove pair section
  const removePair = (index: number) => {
    const currentPairs = form.getValues('pairs');
    if (currentPairs.length > 1) {
      form.setValue('pairs', currentPairs.filter((_, i) => i !== index));
    }
  };

  // State for search and autocomplete
  const [userSearch, setUserSearch] = React.useState('');
  const [userOpen, setUserOpen] = React.useState(false);
  const [userOptions, setUserOptions] = React.useState<UserOption[]>(users);
  const [selectedUser, setSelectedUser] = React.useState<UserOption | null>(null);

  const [pairSearches, setPairSearches] = React.useState<Record<number, string>>({});
  const [pairOpens, setPairOpens] = React.useState<Record<number, boolean>>({});
  const [pairOptions, setPairOptions] = React.useState<Record<number, PairOption[]>>({});
  const [selectedPairs, setSelectedPairs] = React.useState<Record<number, PairOption | null>>({});

  // Watch pairs and start date for dynamic rendering and calculations
  const watchedPairs = form.watch('pairs');
  const watchedStartDate = form.watch('startDate');

  // Auto-update end dates when start date changes
  React.useEffect(() => {
    if (watchedStartDate) {
      const updatedPairs = watchedPairs.map(pair => ({
        ...pair,
        endDate: calculateEndDate(watchedStartDate, pair.period)
      }));
      form.setValue('pairs', updatedPairs);
    }
  }, [watchedStartDate, form]);

  // Auto-update individual pair end date when period changes
  const updatePairEndDate = (index: number, period: string) => {
    const startDate = form.getValues('startDate');
    if (startDate) {
      const newEndDate = calculateEndDate(startDate, period);
      form.setValue(`pairs.${index}.endDate`, newEndDate);
    }
  };

  // Handle user search
  const handleUserSearch = React.useCallback(async (query: string) => {
    setUserSearch(query);
    if (onSearchUsers && query.length >= 2) {
      const results = await onSearchUsers(query);
      setUserOptions(results);
    } else {
      // For empty query or 1 character, show initial users data
      setUserOptions(users);
    }
  }, [onSearchUsers, users]);

  // Handle pair search
  const handlePairSearch = React.useCallback(async (index: number, query: string) => {
    setPairSearches(prev => ({ ...prev, [index]: query }));
    if (onSearchPairs && query.length >= 2) {
      const results = await onSearchPairs(query);
      setPairOptions(prev => ({ ...prev, [index]: results }));
    } else {
      // For empty query or 1 character, show initial pairs data
      setPairOptions(prev => ({ ...prev, [index]: pairs }));
    }
  }, [onSearchPairs, pairs]);

  // Initialize options when props change
  React.useEffect(() => {
    setUserOptions(users);
  }, [users]);

  // Initialize pair options
  React.useEffect(() => {
    watchedPairs.forEach((_, index) => {
      if (!pairOptions[index]) {
        setPairOptions(prev => ({ ...prev, [index]: pairs }));
      }
    });
  }, [watchedPairs, pairs, pairOptions]);

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* User Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-slate-700 pb-2">
              User Information
            </h3>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="userId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-slate-300">Select User</FormLabel>
                    <Popover open={userOpen} onOpenChange={setUserOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={userOpen}
                            className="w-full justify-between bg-slate-800/50 border-slate-600 text-white hover:bg-slate-800 hover:text-white"
                          >
                            {selectedUser ? (
                              <div className="flex items-center gap-2">
                                <User size={16} />
                                <div className="text-left">
                                  <div className="font-medium">{selectedUser.name}</div>
                                  <div className="text-xs text-slate-400">{selectedUser.email}</div>
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-500">Search by name or email...</span>
                            )}
                            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0 bg-slate-800 border-slate-600">
                        <Command>
                          <CommandInput
                            placeholder="Search users by name or email..."
                            value={userSearch}
                            onValueChange={handleUserSearch}
                            className="text-white"
                          />
                          <CommandList>
                            <CommandEmpty>No users found.</CommandEmpty>
                            <CommandGroup>
                              {userOptions.map((user) => (
                                <CommandItem
                                  key={user.id}
                                  value={user.id}
                                  onSelect={() => {
                                    setSelectedUser(user);
                                    field.onChange(user.id);
                                    setUserOpen(false);
                                  }}
                                  className="text-white hover:bg-slate-700"
                                >
                                  <div className="flex items-center gap-2">
                                    <User size={16} />
                                    <div>
                                      <div className="font-medium">{user.name}</div>
                                      <div className="text-xs text-slate-400">{user.email}</div>
                                    </div>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormDescription className="text-xs text-slate-400">
                      Search and select the user who will receive this subscription
                    </FormDescription>
                    <FormMessage className="text-red-400 text-xs" />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-slate-300">Start Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        className="bg-slate-800/50 border-slate-600 text-white focus:border-purple-500 focus:ring-purple-500/20"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-xs text-slate-400">
                      Start date for all subscriptions
                    </FormDescription>
                    <FormMessage className="text-red-400 text-xs" />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Trading Pairs Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white border-b border-slate-700 pb-2 flex-1">
                Trading Pairs & Subscriptions
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addPair}
                className="ml-4 border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                <Plus size={16} className="mr-1" />
                Add Pair
              </Button>
            </div>
            
            <div className="space-y-6">
              {watchedPairs.map((pair, index) => (
                <div key={index} className="bg-slate-800/30 border border-slate-600 rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-md font-medium text-slate-200">
                      Trading Pair #{index + 1}
                    </h4>
                    {watchedPairs.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removePair(index)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 size={16} />
                      </Button>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name={`pairs.${index}.pairId`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-slate-300">Select Trading Pair</FormLabel>
                          <Popover 
                            open={pairOpens[index]} 
                            onOpenChange={(open) => setPairOpens(prev => ({ ...prev, [index]: open }))}
                          >
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  aria-expanded={pairOpens[index]}
                                  className="w-full justify-between bg-slate-800/50 border-slate-600 text-white hover:bg-slate-800 hover:text-white"
                                >
                                  {selectedPairs[index] ? (
                                    <div className="flex items-center gap-2">
                                      <TrendingUp size={16} />
                                      <div className="text-left">
                                        <div className="font-medium">{selectedPairs[index]!.symbol}</div>
                                        <div className="text-xs text-slate-400">
                                          {selectedPairs[index]!.timeframe} • {selectedPairs[index]!.version}
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-slate-500">Search by symbol, timeframe, or version...</span>
                                  )}
                                  <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0 bg-slate-800 border-slate-600">
                              <Command>
                                <CommandInput
                                  placeholder="Search pairs by symbol, timeframe, or version..."
                                  value={pairSearches[index] || ''}
                                  onValueChange={(value) => handlePairSearch(index, value)}
                                  className="text-white"
                                />
                                <CommandList>
                                  <CommandEmpty>No trading pairs found.</CommandEmpty>
                                  <CommandGroup>
                                    {(pairOptions[index] || []).map((pair) => (
                                      <CommandItem
                                        key={pair.id}
                                        value={pair.id}
                                        onSelect={() => {
                                          setSelectedPairs(prev => ({ ...prev, [index]: pair }));
                                          field.onChange(pair.id);
                                          setPairOpens(prev => ({ ...prev, [index]: false }));
                                        }}
                                        className="text-white hover:bg-slate-700"
                                      >
                                        <div className="flex items-center gap-2">
                                          <TrendingUp size={16} />
                                          <div>
                                            <div className="font-medium">{pair.symbol}</div>
                                            <div className="text-xs text-slate-400">
                                              {pair.timeframe} • {pair.version}
                                            </div>
                                          </div>
                                        </div>
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          <FormDescription className="text-xs text-slate-400">
                            Search and select the trading version/pair for this subscription
                          </FormDescription>
                          <FormMessage className="text-red-400 text-xs" />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`pairs.${index}.period`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-slate-300">Subscription Period</FormLabel>
                            <Select 
                              onValueChange={(value) => {
                                field.onChange(value);
                                updatePairEndDate(index, value);
                              }} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white focus:border-purple-500 focus:ring-purple-500/20">
                                  <SelectValue placeholder="Select subscription period" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-slate-800 border-slate-600">
                                <SelectItem value="ONE_MONTH" className="text-white hover:bg-slate-700">1 Month</SelectItem>
                                <SelectItem value="THREE_MONTHS" className="text-white hover:bg-slate-700">3 Months</SelectItem>
                                <SelectItem value="SIX_MONTHS" className="text-white hover:bg-slate-700">6 Months</SelectItem>
                                <SelectItem value="TWELVE_MONTHS" className="text-white hover:bg-slate-700">12 Months</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-red-400 text-xs" />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name={`pairs.${index}.endDate`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-slate-300">End Date</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                className="bg-slate-800/50 border-slate-600 text-white focus:border-purple-500 focus:ring-purple-500/20"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription className="text-xs text-slate-400">
                              Auto-calculated based on start date and period
                            </FormDescription>
                            <FormMessage className="text-red-400 text-xs" />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`pairs.${index}.basePrice`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-slate-300">Base Price ($)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="99.99"
                                className="bg-slate-800/50 border-slate-600 text-white placeholder-slate-500 focus:border-purple-500 focus:ring-purple-500/20"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription className="text-xs text-slate-400">
                              Leave empty to use pair's default price
                            </FormDescription>
                            <FormMessage className="text-red-400 text-xs" />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name={`pairs.${index}.discountRate`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-slate-300">Discount Rate (%)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="15"
                                min="0"
                                max="100"
                                className="bg-slate-800/50 border-slate-600 text-white placeholder-slate-500 focus:border-purple-500 focus:ring-purple-500/20"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription className="text-xs text-slate-400">
                              Optional discount percentage (0-100)
                            </FormDescription>
                            <FormMessage className="text-red-400 text-xs" />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-700">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={loading}
              className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white font-semibold px-6 shadow-lg"
            >
              {loading ? <RefreshCw className="animate-spin mr-2" size={16} /> : null}
              Create Subscriptions ({watchedPairs.length})
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}