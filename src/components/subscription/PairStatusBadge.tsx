'use client';

import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';

interface PairStatusBadgeProps {
  status: 'active' | 'expiring' | 'expired' | 'pending';
  expiryDate?: Date;
  className?: string;
}

export function PairStatusBadge({
  status,
  expiryDate,
  className,
}: PairStatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'active':
        return {
          label: 'Active',
          variant: 'default' as const,
          className: 'bg-green-500/10 text-green-400 border-green-500/20',
          icon: CheckCircle,
        };
      case 'expiring':
        return {
          label: 'Expiring Soon',
          variant: 'secondary' as const,
          className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
          icon: AlertCircle,
        };
      case 'expired':
        return {
          label: 'Expired',
          variant: 'destructive' as const,
          className: 'bg-red-500/10 text-red-400 border-red-500/20',
          icon: XCircle,
        };
      case 'pending':
        return {
          label: 'Pending',
          variant: 'outline' as const,
          className: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
          icon: Clock,
        };
      default:
        return {
          label: 'Unknown',
          variant: 'outline' as const,
          className: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
          icon: AlertCircle,
        };
    }
  };

  const config = getStatusConfig();
  const IconComponent = config.icon;

  const getDaysUntilExpiry = () => {
    if (!expiryDate) return null;
    const now = new Date();
    const diffTime = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysLeft = getDaysUntilExpiry();

  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      <Badge className={config.className}>
        <IconComponent className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
      {daysLeft !== null && status === 'expiring' && (
        <span className="text-xs text-slate-400">{daysLeft} days left</span>
      )}
      {expiryDate && status === 'active' && (
        <span className="text-xs text-slate-400">
          Until {expiryDate.toLocaleDateString()}
        </span>
      )}
    </div>
  );
}
