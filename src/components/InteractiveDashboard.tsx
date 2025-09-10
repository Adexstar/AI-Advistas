import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { 
  TrendingUp, 
  Users, 
  MousePointer, 
  DollarSign,
  Bell,
  Activity,
  ArrowRight
} from "lucide-react";

export const InteractiveDashboard = () => {
  const navigate = useNavigate();
  const { state, actions } = useApp();
  const [notifications, setNotifications] = useState([
    {
      id: "1",
      type: "performance",
      title: "Campaign Performance Alert",
      message: "Summer Sale Campaign is outperforming by 25%",
      time: "2 min ago",
      actionable: true
    },
    {
      id: "2", 
      type: "budget",
      title: "Budget Optimization",
      message: "Consider reallocating budget to Instagram",
      time: "1 hour ago",
      actionable: true
    }
  ]);

  // Real-time data simulation
  const [liveMetrics, setLiveMetrics] = useState({
    activeUsers: 1247,
    conversionRate: 3.2,
    revenue: 8750,
    impressions: 145200
  });

  useEffect(() => {
    // Simulate live updates every 10 seconds
    const interval = setInterval(() => {
      setLiveMetrics(prev => ({
        activeUsers: prev.activeUsers + Math.floor(Math.random() * 10 - 5),
        conversionRate: Math.max(0, prev.conversionRate + (Math.random() * 0.2 - 0.1)),
        revenue: prev.revenue + Math.floor(Math.random() * 100),
        impressions: prev.impressions + Math.floor(Math.random() * 500)
      }));
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleNotificationAction = (notification: any) => {
    if (notification.type === "performance") {
      navigate("/campaigns");
    } else if (notification.type === "budget") {
      navigate("/billing");
    }
    dismissNotification(notification.id);
  };

  return (
    <div className="space-y-6">
      {/* Live Notifications */}
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="fixed top-4 right-4 z-50 w-80"
          >
            <Card className="border-l-4 border-l-primary bg-background/95 backdrop-blur shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Bell className="h-5 w-5 text-primary mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm">{notification.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">{notification.time}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {notification.actionable && (
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleNotificationAction(notification)}
                      >
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => dismissNotification(notification.id)}
                    >
                      ×
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Live Metrics Bar */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-500" />
              Live Performance
            </CardTitle>
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              Real-time
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div 
              className="text-center p-3 bg-muted/50 rounded-lg"
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div className="flex items-center justify-center gap-2 mb-1">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="text-xs text-muted-foreground">Active Users</span>
              </div>
              <p className="text-xl font-bold text-blue-600">{liveMetrics.activeUsers.toLocaleString()}</p>
            </motion.div>
            
            <motion.div 
              className="text-center p-3 bg-muted/50 rounded-lg"
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            >
              <div className="flex items-center justify-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-xs text-muted-foreground">Conv. Rate</span>
              </div>
              <p className="text-xl font-bold text-green-600">{liveMetrics.conversionRate.toFixed(1)}%</p>
            </motion.div>
            
            <motion.div 
              className="text-center p-3 bg-muted/50 rounded-lg"
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: 1 }}
            >
              <div className="flex items-center justify-center gap-2 mb-1">
                <DollarSign className="h-4 w-4 text-purple-600" />
                <span className="text-xs text-muted-foreground">Revenue</span>
              </div>
              <p className="text-xl font-bold text-purple-600">${liveMetrics.revenue.toLocaleString()}</p>
            </motion.div>
            
            <motion.div 
              className="text-center p-3 bg-muted/50 rounded-lg"
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
            >
              <div className="flex items-center justify-center gap-2 mb-1">
                <MousePointer className="h-4 w-4 text-orange-600" />
                <span className="text-xs text-muted-foreground">Impressions</span>
              </div>
              <p className="text-xl font-bold text-orange-600">{(liveMetrics.impressions / 1000).toFixed(1)}K</p>
            </motion.div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button 
              variant="outline" 
              className="h-auto p-4 flex-col"
              onClick={() => navigate('/create-ad')}
            >
              <span className="text-2xl mb-2">🎨</span>
              <span className="text-sm">Create Ad</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto p-4 flex-col"
              onClick={() => navigate('/campaigns')}
            >
              <span className="text-2xl mb-2">📊</span>
              <span className="text-sm">View Campaigns</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto p-4 flex-col"
              onClick={() => navigate('/audience')}
            >
              <span className="text-2xl mb-2">👥</span>
              <span className="text-sm">Audience</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto p-4 flex-col"
              onClick={() => navigate('/ai-video-generator')}
            >
              <span className="text-2xl mb-2">🎬</span>
              <span className="text-sm">AI Video</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InteractiveDashboard;