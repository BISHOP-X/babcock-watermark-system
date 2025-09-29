import { CheckCircle2, Clock, Info, AlertTriangle } from "lucide-react";

interface Activity {
  id: number;
  action: string;
  description: string;
  time: string;
  status: 'completed' | 'processing' | 'info' | 'warning';
}

interface RecentActivityProps {
  activities: Activity[];
}

export const RecentActivity = ({ activities }: RecentActivityProps) => {
  const getStatusIcon = (status: Activity['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBg = (status: Activity['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-200';
      case 'processing':
        return 'bg-blue-50 border-blue-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-4">
      {activities.map((activity, index) => (
        <div 
          key={activity.id} 
          className={`p-4 rounded-lg border ${getStatusBg(activity.status)} hover:shadow-sm transition-all duration-200 animate-fade-in`}
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              {getStatusIcon(activity.status)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-foreground truncate">
                  {activity.action}
                </h4>
                <time className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                  {activity.time}
                </time>
              </div>
              
              <p className="text-sm text-muted-foreground mt-1">
                {activity.description}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};