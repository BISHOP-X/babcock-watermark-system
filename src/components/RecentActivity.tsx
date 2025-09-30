import { CheckCircle2, Clock, Info, AlertTriangle } from "lucide-react";

interface Activity {
  id: string | number;
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
    <div className="space-y-3 sm:space-y-4">
      {activities.map((activity, index) => (
        <div 
          key={activity.id} 
          className={`p-4 sm:p-5 rounded-lg border ${getStatusBg(activity.status)} hover:shadow-sm transition-all duration-200 animate-fade-in touch-manipulation`}
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="flex-shrink-0 mt-1">
              {getStatusIcon(activity.status)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                <h4 className="text-sm sm:text-base font-medium text-foreground leading-tight">
                  {activity.action}
                </h4>
                <time className="text-xs sm:text-sm text-muted-foreground flex-shrink-0 font-medium">
                  {activity.time}
                </time>
              </div>
              
              <p className="text-sm sm:text-base text-muted-foreground mt-2 leading-relaxed">
                {activity.description}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};