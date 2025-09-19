import { formatDistanceToNow } from 'date-fns';

export const RecentActivityWidget = () => {
  const activities = [
    { action: 'Campaign "Holiday Special" started', timestamp: new Date(Date.now() - 1800000) },
    { action: 'Budget increased for "Product Launch"', timestamp: new Date(Date.now() - 3600000) },
    { action: 'New ad creative uploaded', timestamp: new Date(Date.now() - 7200000) },
    { action: 'Performance alert: CTR dropped', timestamp: new Date(Date.now() - 10800000) },
  ];

  return (
    <div className="space-y-2 h-full overflow-auto">
      {activities.map((activity, index) => (
        <div key={index} className="border-l-2 border-primary/20 pl-3 py-1">
          <div className="text-sm">{activity.action}</div>
          <div className="text-xs text-muted-foreground">
            {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
          </div>
        </div>
      ))}
    </div>
  );
};