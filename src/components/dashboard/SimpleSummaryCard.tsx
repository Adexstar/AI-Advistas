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
    default: 'border-l-primary',
    warning: 'border-l-destructive',
    success: 'border-l-green-500'
  };

  return (
    <Card className={cn('border-l-4 hover:shadow-lg transition-shadow', variantStyles[variant])}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
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
