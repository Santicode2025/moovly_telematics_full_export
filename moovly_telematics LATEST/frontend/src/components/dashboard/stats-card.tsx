import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  change: string;
  changeLabel: string;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  iconColor,
  iconBg,
  change,
  changeLabel,
}: StatsCardProps) {
  const isPositive = change.startsWith("+");

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
          <div className={`w-12 h-12 ${iconBg} rounded-lg flex items-center justify-center`}>
            <Icon className={`h-6 w-6 ${iconColor}`} />
          </div>
        </div>
        <div className="mt-4 flex items-center text-sm">
          <span className={`font-medium ${isPositive ? "text-green-600" : "text-red-600"}`}>
            {change}
          </span>
          <span className="text-gray-600 ml-1">{changeLabel}</span>
        </div>
      </CardContent>
    </Card>
  );
}
