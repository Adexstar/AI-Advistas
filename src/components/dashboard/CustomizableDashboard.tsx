import { useCallback } from 'react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Download, Save, X } from 'lucide-react';
import { useDashboard } from '@/hooks/useDashboard';
import { DashboardLayout, WidgetKey } from '@/types/dashboard';
import { SummaryWidget } from './widgets/SummaryWidget';
import { TopCampaignsWidget } from './widgets/TopCampaignsWidget';
import { RecentActivityWidget } from './widgets/RecentActivityWidget';
import { ForecastWidget } from './widgets/ForecastWidget';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

const widgetComponents: Record<WidgetKey, React.ComponentType> = {
  summary: SummaryWidget,
  topCampaigns: TopCampaignsWidget,
  recentActivity: RecentActivityWidget,
  forecast: ForecastWidget,
};

const widgetTitles: Record<WidgetKey, string> = {
  summary: 'Summary Metrics',
  topCampaigns: 'Top Campaigns',
  recentActivity: 'Recent Activity',
  forecast: 'Performance Forecast',
};

export const CustomizableDashboard = () => {
  const {
    layout,
    layoutLoading,
    saveLayout,
    isCustomizing,
    toggleCustomizing,
    exportDashboard,
    isSaving,
    isExporting,
  } = useDashboard();

  const handleLayoutChange = useCallback((newLayout: Layout[]) => {
    if (!isCustomizing || !layout) return;

    const updatedLayout: DashboardLayout = layout.map(widget => {
      const gridItem = newLayout.find(item => item.i === widget.widget);
      if (gridItem) {
        return {
          ...widget,
          position: {
            x: gridItem.x,
            y: gridItem.y,
            w: gridItem.w,
            h: gridItem.h,
          },
        };
      }
      return widget;
    });

    saveLayout(updatedLayout);
  }, [layout, isCustomizing, saveLayout]);

  if (layoutLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="h-16 bg-muted" />
            <CardContent className="h-32 bg-muted/50" />
          </Card>
        ))}
      </div>
    );
  }

  if (!layout) return null;

  const gridLayout: Layout[] = layout.map(widget => ({
    i: widget.widget,
    x: widget.position.x,
    y: widget.position.y,
    w: widget.position.w,
    h: widget.position.h,
    minW: 2,
    minH: 2,
  }));

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            onClick={toggleCustomizing}
            variant={isCustomizing ? "destructive" : "outline"}
            size="sm"
          >
            {isCustomizing ? (
              <>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </>
            ) : (
              <>
                <Settings className="h-4 w-4 mr-2" />
                Customize
              </>
            )}
          </Button>
          
          {isCustomizing && (
            <Button
              onClick={toggleCustomizing}
              variant="default"
              size="sm"
              disabled={isSaving}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Done'}
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => exportDashboard('csv')}
            variant="outline"
            size="sm"
            disabled={isExporting}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button
            onClick={() => exportDashboard('pdf')}
            variant="outline"
            size="sm"
            disabled={isExporting}
          >
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Dashboard Grid */}
      <ResponsiveGridLayout
        className="layout"
        layouts={{ lg: gridLayout }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 8, md: 6, sm: 4, xs: 2, xxs: 1 }}
        rowHeight={120}
        isDraggable={isCustomizing}
        isResizable={isCustomizing}
        onLayoutChange={handleLayoutChange}
        margin={[16, 16]}
        containerPadding={[0, 0]}
      >
        {layout.map(widget => {
          const WidgetComponent = widgetComponents[widget.widget];
          return (
            <div key={widget.widget}>
              <Card className={`h-full ${isCustomizing ? 'ring-2 ring-primary/20' : ''}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    {widgetTitles[widget.widget]}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 h-[calc(100%-4rem)] overflow-hidden">
                  <WidgetComponent />
                </CardContent>
              </Card>
            </div>
          );
        })}
      </ResponsiveGridLayout>

      {isCustomizing && (
        <div className="text-sm text-muted-foreground text-center p-4 bg-muted/50 rounded-lg">
          Drag and resize widgets to customize your dashboard layout
        </div>
      )}
    </div>
  );
};