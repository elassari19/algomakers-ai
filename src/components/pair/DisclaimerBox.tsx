import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Info, Shield, TrendingDown } from 'lucide-react';

export function DisclaimerBox() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white mb-4">
        Important Disclaimers
      </h3>

      <div className="grid gap-4">
        {/* Performance Disclaimer */}
        <Alert className="bg-red-900/20 border-red-600/30">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-red-200">
            <strong>Past Performance Warning:</strong> Historical backtest
            results are not indicative of future performance. Market conditions
            change constantly, and strategies that performed well in the past
            may not continue to do so.
          </AlertDescription>
        </Alert>

        {/* Risk Disclaimer */}
        <Alert className="bg-orange-900/20 border-orange-600/30">
          <TrendingDown className="h-4 w-4 text-orange-400" />
          <AlertDescription className="text-orange-200">
            <strong>Trading Risk:</strong> All trading involves substantial risk
            of loss. You should carefully consider whether trading is suitable
            for you in light of your circumstances, knowledge, and financial
            resources. You may lose all or more of your initial investment.
          </AlertDescription>
        </Alert>

        {/* Simulation Disclaimer */}
        <Alert className="bg-blue-900/20 border-blue-600/30">
          <Info className="h-4 w-4 text-blue-400" />
          <AlertDescription className="text-blue-200">
            <strong>Simulated Results:</strong> The performance data shown
            represents backtested results, which are simulated and do not
            represent actual trading. Simulated trading does not involve
            financial risk, and no trading record can completely account for the
            impact of financial risk in actual trading.
          </AlertDescription>
        </Alert>

        {/* General Disclaimer */}
        <Alert className="bg-slate-800/50 border-slate-600/30">
          <Shield className="h-4 w-4 text-slate-400" />
          <AlertDescription className="text-slate-300">
            <strong>Educational Purpose:</strong> This information is provided
            for educational and informational purposes only. It is not intended
            as investment advice or as a recommendation to buy or sell any
            security. Always consult with a qualified financial advisor before
            making any investment decisions.
          </AlertDescription>
        </Alert>
      </div>

      {/* Additional Risk Factors */}
      <Card className="bg-slate-900 border-slate-700 mt-6">
        <CardContent className="p-6">
          <h4 className="font-semibold text-white mb-3">
            Key Risk Factors to Consider:
          </h4>
          <ul className="space-y-2 text-sm text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-red-400 mt-1">•</span>
              <span>
                Market volatility can result in significant losses beyond the
                shown drawdown levels
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 mt-1">•</span>
              <span>
                Slippage and trading costs are not fully reflected in backtest
                results
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 mt-1">•</span>
              <span>
                Strategy performance may deteriorate as market conditions change
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 mt-1">•</span>
              <span>
                Past winning streaks do not guarantee future profitability
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 mt-1">•</span>
              <span>
                Emotional factors in live trading can lead to deviations from
                the strategy
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>

      <div className="text-center text-xs text-slate-500 mt-4">
        <p>
          By subscribing to our signals, you acknowledge that you understand and
          accept these risks.
        </p>
        <p className="mt-1">
          For full terms and conditions, please review our{' '}
          <a
            href="/legal"
            className="text-blue-400 hover:text-blue-300 underline"
          >
            Terms of Service
          </a>{' '}
          and{' '}
          <a
            href="/legal"
            className="text-blue-400 hover:text-blue-300 underline"
          >
            Risk Disclosure
          </a>
          .
        </p>
      </div>
    </div>
  );
}
