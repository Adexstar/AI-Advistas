import { useApp } from '@/contexts/AppContext';

export const SummaryWidget = () => {
  const { state } = useApp();

  const metrics = [
    { label: 'Spend', value: `$${state.campaigns.reduce((acc, c) => acc + c.budget, 0).toLocaleString()}` },
    { label: 'Impressions', value: `${(state.campaigns.length * 125000).toLocaleString()}` },
    { label: 'CTR', value: '2.1%' },
    { label: 'ROAS', value: '3.2x' },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 h-full">
      {metrics.map((metric, index) => (
        <div key={index} className="text-center">
          <div className="text-lg font-bold text-primary">{metric.value}</div>
          <div className="text-xs text-muted-foreground">{metric.label}</div>
        </div>
      ))}
    </div>
  );
};