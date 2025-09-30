import { useEffect, useState, useCallback } from "react";
import { FileText, Upload, Activity, Users, Clock, TrendingUp, Database, RefreshCw, AlertTriangle, ChevronDown } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { StatCard } from "@/components/StatCard";
import { RecentActivity } from "@/components/RecentActivity";
import { useToast } from "@/hooks/use-toast";
import { dashboardService, DashboardStats, ActivityItem } from "@/lib/dashboardService";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [systemHealth, setSystemHealth] = useState<{ status: 'healthy' | 'warning' | 'error'; message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isPullToRefresh, setIsPullToRefresh] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);

  useEffect(() => {
    loadDashboardData();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadDashboardData(true); // Silent refresh
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async (silent: boolean = false) => {
    try {
      if (!silent) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      
      // Load all dashboard data concurrently
      const [dashboardStats, recentActivity, healthStatus] = await Promise.all([
        dashboardService.getDashboardStats(),
        dashboardService.getRecentActivity(6),
        dashboardService.getSystemHealth()
      ]);
      
      setStats(dashboardStats);
      setActivities(recentActivity);
      setSystemHealth(healthStatus);
      setLastUpdated(new Date());
      
      // Haptic feedback for mobile (skip on initial load to avoid browser warnings)
      if ('vibrate' in navigator && !silent) {
        try {
          navigator.vibrate(50);
        } catch (e) {
          // Silently ignore if user hasn't interacted yet
        }
      }
      
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      if (!silent) {
        toast({
          title: "Failed to load dashboard",
          description: "There was an error loading the dashboard data. Please try refreshing.",
          variant: "destructive",
        });
        
        // Error vibration pattern for mobile
        if ('vibrate' in navigator) {
          try {
            navigator.vibrate([100, 50, 100]);
          } catch (e) {
            // Silently ignore if user hasn't interacted yet
          }
        }
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    // Haptic feedback for button press
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(30);
      } catch (e) {
        // Silently ignore if user hasn't interacted yet
      }
    }
    
    await loadDashboardData();
    toast({
      title: "✨ Dashboard refreshed",
      description: "All data has been updated with the latest information.",
    });
  };

  // Pull-to-refresh functionality for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      const touch = e.touches[0];
      setPullDistance(0);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (window.scrollY === 0 && !isLoading) {
      const touch = e.touches[0];
      const startY = 0;
      const currentY = touch.clientY;
      const distance = Math.max(0, currentY - startY);
      
      if (distance > 20) {
        setPullDistance(Math.min(distance, 100));
        if (distance > 80) {
          setIsPullToRefresh(true);
        }
      }
    }
  }, [isLoading]);

  const handleTouchEnd = useCallback(async () => {
    if (isPullToRefresh && !isRefreshing) {
      setIsRefreshing(true);
      
      // Haptic feedback for pull-to-refresh
      if ('vibrate' in navigator) {
        try {
          navigator.vibrate(50);
        } catch (e) {
          // Silently ignore if user hasn't interacted yet
        }
      }
      
      await loadDashboardData();
      toast({
        title: "🔄 Dashboard refreshed",
        description: "Data updated successfully",
      });
    }
    setPullDistance(0);
    setIsPullToRefresh(false);
  }, [isPullToRefresh, isRefreshing, loadDashboardData, toast]);

  const getStatsCards = () => {
    if (!stats) return [];
    
    return [
      {
        title: "Documents Processed Today",
        value: stats.documentsProcessedToday.toString(),
        icon: FileText,
        description: `${Math.floor(stats.documentsProcessedToday / Math.max(stats.activeBatches, 1))} avg per batch`,
        trend: stats.trends.dailyChange >= 0 ? `+${stats.trends.dailyChange}% from yesterday` : `${stats.trends.dailyChange}% from yesterday`
      },
      {
        title: "Total This Month",
        value: stats.totalThisMonth.toString(),
        icon: TrendingUp,
        description: `${stats.totalFiles} total files processed`,
        trend: stats.trends.monthlyChange >= 0 ? `+${stats.trends.monthlyChange}% from last month` : `${stats.trends.monthlyChange}% from last month`
      },
      {
        title: "Active Batches",
        value: stats.activeBatches.toString(),
        icon: Activity,
        description: "Currently processing",
        trend: `${stats.trends.pendingCount} pending review`
      },
      {
        title: "Success Rate",
        value: `${stats.successRate}%`,
        icon: Users,
        description: "Overall completion rate",
        trend: `${stats.totalBatches} total batches`
      }
    ];
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-secondary">
        <Header />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="mb-6 sm:mb-8 animate-fade-in">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2 leading-tight">
              Welcome to CPGS Document Watermarking
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
              Loading dashboard data...
            </p>
          </div>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-6">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto"></div>
                <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-primary/20 mx-auto"></div>
              </div>
              <div className="space-y-2">
                <p className="text-muted-foreground font-medium">Loading dashboard statistics...</p>
                <p className="text-sm text-muted-foreground">This may take a few moments</p>
              </div>
              {/* Loading skeleton for mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 max-w-md mx-auto">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-card/50 rounded-lg p-4 animate-pulse">
                    <div className="h-4 bg-muted rounded mb-2"></div>
                    <div className="h-8 bg-muted rounded mb-2"></div>
                    <div className="h-3 bg-muted rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const statsCards = getStatsCards();

  return (
    <div 
      className="min-h-screen bg-gradient-secondary"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <Header />
      
      {/* Pull-to-refresh indicator */}
      {pullDistance > 20 && (
        <div 
          className="fixed top-0 left-0 right-0 z-40 bg-primary/10 backdrop-blur-sm transition-all duration-200"
          style={{ 
            height: `${Math.min(pullDistance, 80)}px`,
            transform: `translateY(-${80 - Math.min(pullDistance, 80)}px)`
          }}
        >
          <div className="flex items-center justify-center h-full">
            <div className="flex items-center gap-2 text-primary">
              <RefreshCw 
                className={`h-5 w-5 ${isPullToRefresh ? 'animate-spin' : ''}`} 
              />
              <span className="text-sm font-medium">
                {isPullToRefresh ? 'Release to refresh' : 'Pull to refresh'}
              </span>
            </div>
          </div>
        </div>
      )}
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Welcome Section */}
        <div className="mb-6 sm:mb-8 animate-fade-in">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2 leading-tight">
                Welcome to CPGS Document Watermarking
              </h1>
              <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
                Professional document processing for Babcock University's College of Postgraduate School
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mt-4 sm:mt-0">
              {/* System Health */}
              {systemHealth && (
                <div className="flex items-center gap-2 order-2 sm:order-1">
                  <Badge 
                    variant={systemHealth.status === 'healthy' ? 'default' : systemHealth.status === 'warning' ? 'secondary' : 'destructive'}
                    className="px-3 py-2 text-xs sm:text-sm font-medium"
                  >
                    <span className="mr-2">
                      {systemHealth.status === 'healthy' && '🟢'}
                      {systemHealth.status === 'warning' && '🟡'}
                      {systemHealth.status === 'error' && '🔴'}
                    </span>
                    {systemHealth.status.charAt(0).toUpperCase() + systemHealth.status.slice(1)}
                  </Badge>
                </div>
              )}
              
              {/* Refresh Button */}
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="w-full sm:w-auto min-h-[44px] order-1 sm:order-2 touch-manipulation"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
          
          {/* Last Updated */}
          <div className="mt-4 pt-4 border-t border-border/30">
            <p className="text-xs text-muted-foreground">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {statsCards.map((stat, index) => (
            <div key={stat.title} className="animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
              <StatCard {...stat} />
            </div>
          ))}
        </div>

        {/* Main Actions & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-1 animate-scale-in" style={{ animationDelay: "400ms" }}>
            <Card className="shadow-card border-0 bg-card/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Upload className="h-5 w-5 text-primary" />
                  Quick Actions
                </CardTitle>
                <CardDescription className="text-sm">
                  Single file or batch processing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  className="w-full bg-gradient-primary hover:scale-[1.02] transition-transform duration-200 shadow-elevated min-h-[52px] text-base font-medium touch-manipulation"
                  onClick={() => navigate('/upload')}
                  size="lg"
                >
                  <Upload className="mr-2 h-5 w-5" />
                  Upload Documents
                </Button>

                {/* System Health Message */}
                {systemHealth && systemHealth.status !== 'healthy' && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                      <span className="text-sm font-medium text-yellow-800">System Notice</span>
                    </div>
                    <p className="text-sm text-yellow-700 leading-relaxed">
                      {systemHealth.message}
                    </p>
                  </div>
                )}
                
                <div className="pt-4 border-t border-border/30">
                  <p className="text-sm text-muted-foreground mb-3">Supported formats:</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-2 bg-primary-light text-primary-dark text-xs font-medium rounded-lg">
                      PDF
                    </span>
                    <span className="px-3 py-2 bg-primary-light text-primary-dark text-xs font-medium rounded-lg">
                      DOCX
                    </span>
                    <span className="px-3 py-2 bg-primary-light text-primary-dark text-xs font-medium rounded-lg">
                      DOC
                    </span>
                  </div>
                </div>
                
                {/* Quick Stats */}
                {stats && (
                  <div className="pt-4 border-t border-border/30">
                    <p className="text-sm text-muted-foreground mb-3">Quick stats:</p>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Active batches:</span>
                        <span className="font-medium text-base">{stats.activeBatches}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Success rate:</span>
                        <span className="font-medium text-green-600 text-base">{stats.successRate}%</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Total files:</span>
                        <span className="font-medium text-base">{stats.totalFiles}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-2 animate-scale-in" style={{ animationDelay: "500ms" }}>
            <Card className="shadow-card border-0 bg-card/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="h-5 w-5 text-primary" />
                  Recent Activity
                </CardTitle>
                <CardDescription className="text-sm">
                  Latest document processing updates
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                {activities.length > 0 ? (
                  <RecentActivity 
                    activities={activities.map((activity, index) => ({
                      id: `${activity.id}_${index}`, // Use string ID to avoid duplicate numerical keys
                      action: activity.action,
                      description: activity.description,
                      time: activity.relativeTime,
                      status: activity.status === 'failed' ? 'warning' : activity.status as 'completed' | 'processing' | 'info' | 'warning'
                    }))}
                  />
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-base font-medium mb-2">No recent activity</p>
                    <p className="text-sm leading-relaxed max-w-sm mx-auto">
                      Start processing documents to see activity updates here
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;