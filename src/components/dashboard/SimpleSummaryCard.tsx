import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface SimpleSummaryCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  variant?: 'default' | 'warning' | 'success';
}

export const SimpleSummaryCard = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  variant = 'default' 
}: SimpleSummaryCardProps) => {
  const variantStyles = {
    default: 'border-l-primary bg-gradient-to-br from-white via-white to-secondary/45',
    warning: 'border-l-destructive bg-gradient-to-br from-white via-white to-destructive/5',
    success: 'border-l-green-500 bg-gradient-to-br from-white via-white to-green-500/5'
  };

  return (
    <Card className={cn('surface-outline border-l-4 shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-soft', variantStyles[variant])}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="rounded-xl bg-primary/10 p-2 text-primary">
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <p className="text-xs text-muted-foreground mt-1">
            {trend}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
