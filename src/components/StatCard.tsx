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
    <Card className="shadow-card border-0 bg-card/80 backdrop-blur-sm hover:shadow-elevated transition-all duration-300 hover:scale-[1.02]">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="p-2 bg-primary-light rounded-lg">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground mb-1">{value}</div>
        <p className="text-xs text-muted-foreground mb-2">
          {description}
        </p>
        <p className="text-xs text-primary font-medium">
          {trend}
        </p>
      </CardContent>
    </Card>
  );
};