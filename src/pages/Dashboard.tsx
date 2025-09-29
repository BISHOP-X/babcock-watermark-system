import { FileText, Upload, Activity, Users, Clock, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { StatCard } from "@/components/StatCard";
import { RecentActivity } from "@/components/RecentActivity";

const Dashboard = () => {
  const navigate = useNavigate();

  const stats = [
    {
      title: "Documents Processed Today",
      value: "12",
      icon: FileText,
      description: "3 batches completed",
      trend: "+15% from yesterday"
    },
    {
      title: "Total This Month",
      value: "284",
      icon: TrendingUp,
      description: "Across 45 batches",
      trend: "+23% from last month"
    },
    {
      title: "Active Batches",
      value: "2",
      icon: Activity,
      description: "Currently processing",
      trend: "2 pending review"
    },
    {
      title: "Staff Users",
      value: "8",
      icon: Users,
      description: "Active this week",
      trend: "All departments"
    }
  ];

  const recentActivity = [
    {
      id: 1,
      action: "Batch #2024-156 completed",
      description: "15 thesis documents watermarked",
      time: "2 minutes ago",
      status: "completed" as const
    },
    {
      id: 2,
      action: "New batch started",
      description: "8 project documents uploaded by Dr. Smith",
      time: "1 hour ago",
      status: "processing" as const
    },
    {
      id: 3,
      action: "Batch #2024-155 completed",
      description: "12 thesis documents watermarked",
      time: "3 hours ago",
      status: "completed" as const
    },
    {
      id: 4,
      action: "System maintenance completed",
      description: "All systems running optimally",
      time: "Yesterday",
      status: "info" as const
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-secondary">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Welcome to CPGS Document Watermarking
          </h1>
          <p className="text-muted-foreground text-lg">
            Professional document processing for Babcock University's College of Postgraduate School
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={stat.title} className="animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
              <StatCard {...stat} />
            </div>
          ))}
        </div>

        {/* Main Actions & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-1 animate-scale-in" style={{ animationDelay: "400ms" }}>
            <Card className="shadow-card border-0 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-primary" />
                  Quick Actions
                </CardTitle>
                <CardDescription>
                  Start processing documents
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  className="w-full bg-gradient-primary hover:scale-[1.02] transition-transform duration-200 shadow-elevated"
                  onClick={() => navigate('/upload')}
                  size="lg"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Start New Batch
                </Button>
                
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-3">Supported formats:</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-primary-light text-primary-dark text-xs rounded-md font-medium">
                      PDF
                    </span>
                    <span className="px-2 py-1 bg-primary-light text-primary-dark text-xs rounded-md font-medium">
                      DOCX
                    </span>
                    <span className="px-2 py-1 bg-primary-light text-primary-dark text-xs rounded-md font-medium">
                      DOC
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-2 animate-scale-in" style={{ animationDelay: "500ms" }}>
            <Card className="shadow-card border-0 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Latest document processing updates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RecentActivity activities={recentActivity} />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;