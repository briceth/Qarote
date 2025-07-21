import React from "react";
import { MessageSquare, MessageCircle, Users, BarChart3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

// Dashboard card component
interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => (
  <Card>
    <CardContent className="pt-6">
      <div className="flex justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <h3 className="text-2xl font-semibold mt-1">{value}</h3>
        </div>
        <div
          className="flex items-center justify-center w-14 h-14 rounded-full"
          style={{ backgroundColor: `${color}20` }}
        >
          <div style={{ color }}>{icon}</div>
        </div>
      </div>
    </CardContent>
  </Card>
);

const Dashboard: React.FC = () => {
  // Mock data (would come from API in production)
  const stats = [
    {
      title: "Total Feedback",
      value: 24,
      icon: <MessageSquare size={24} />,
      color: "#4CAF50",
    },
    {
      title: "New Today",
      value: 3,
      icon: <MessageCircle size={24} />,
      color: "#2196F3",
    },
    {
      title: "Active Workspaces",
      value: 8,
      icon: <Users size={24} />,
      color: "#FF9800",
    },
    {
      title: "Response Rate",
      value: "92%",
      icon: <BarChart3 size={24} />,
      color: "#9C27B0",
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      <div className="mt-6">
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-xl font-semibold mb-4">Recent Activity</h3>

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              • New feedback submitted from workspace "TechCorp" - 2 hours ago
            </p>
            <p className="text-sm text-muted-foreground">
              • New feedback submitted from workspace "DevTeam" - 4 hours ago
            </p>
            <p className="text-sm text-muted-foreground">
              • New user registered - 1 day ago
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-xl font-semibold mb-4">System Status</h3>

          <div className="space-y-2">
            <p className="text-green-600 font-medium">
              All systems operational
            </p>
            <p className="text-sm text-muted-foreground">
              Last checked: Today at 12:45 PM
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
