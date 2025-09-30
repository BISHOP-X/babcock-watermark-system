import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  description: string;
  trend: string;
}

export const StatCard = ({ title, value, icon: Icon, description, trend }: StatCardProps) => {
  return (
    <Card className="shadow-card border-0 bg-card/80 backdrop-blur-sm hover:shadow-elevated transition-all duration-300 hover:scale-[1.02] touch-manipulation">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 px-4 sm:px-6 pt-4 sm:pt-6">
        <CardTitle className="text-sm sm:text-base font-medium text-muted-foreground leading-tight">
          {title}
        </CardTitle>
        <div className="p-2 sm:p-3 bg-primary-light rounded-lg flex-shrink-0">
          <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
        </div>
      </CardHeader>
      <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
        <div className="text-2xl sm:text-3xl font-bold text-foreground mb-2 leading-none">{value}</div>
        <p className="text-xs sm:text-sm text-muted-foreground mb-3 leading-relaxed">
          {description}
        </p>
        <p className="text-xs sm:text-sm text-primary font-medium leading-tight">
          {trend}
        </p>
      </CardContent>
    </Card>
  );
};