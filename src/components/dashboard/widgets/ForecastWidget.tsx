import { TrendingUp, TrendingDown } from 'lucide-react';

export const ForecastWidget = () => {
  const forecasts = [
    { metric: 'Spend', current: '$12.4K', predicted: '$15.2K', trend: 'up' as const },
    { metric: 'Conversions', current: '1,205', predicted: '1,580', trend: 'up' as const },
    { metric: 'CPC', current: '$0.85', predicted: '$0.78', trend: 'down' as const },
    { metric: 'CTR', current: '2.1%', predicted: '2.4%', trend: 'up' as const },
  ];

  return (
    <div className="space-y-2 h-full overflow-auto">
      {forecasts.map((forecast, index) => (
        <div key={index} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
          <div className="flex-1">
            <div className="text-sm font-medium">{forecast.metric}</div>
            <div className="text-xs text-muted-foreground">
              {forecast.current} → {forecast.predicted}
            </div>
          </div>
          <div className={`flex items-center ${forecast.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
            {forecast.trend === 'up' ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
          </div>
        </div>
      ))}
    </div>
  );
};