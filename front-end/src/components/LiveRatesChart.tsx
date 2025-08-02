import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RabbitMQPermissionError } from "@/components/RabbitMQPermissionError";
import { isRabbitMQAuthError } from "@/types/apiErrors";

interface LiveRates {
  timestamp: number;
  rates: {
    publish: number;
    deliver: number;
    ack: number;
    deliver_get: number;
    confirm: number;
    get: number;
    get_no_ack: number;
    redeliver: number;
    reject: number;
    return_unroutable: number;
    disk_reads: number;
    disk_writes: number;
  };
}

interface LiveRatesChartProps {
  liveRates?: LiveRates;
  isLoading: boolean;
  error?: Error | null;
}

export const LiveRatesChart = ({
  liveRates,
  isLoading,
  error,
}: LiveRatesChartProps) => {
  // Handle permission errors
  if (error && isRabbitMQAuthError(error)) {
    return (
      <RabbitMQPermissionError
        requiredPermission={error.requiredPermission}
        message={error.message}
        title="Cannot View Live Rates"
      />
    );
  }

  // Chart data with colors
  const chartData = [
    {
      name: "Ack",
      value: liveRates?.rates.ack || 0,
      fill: "#10B981",
    },
    {
      name: "Deliver",
      value: liveRates?.rates.deliver || 0,
      fill: "#3B82F6",
    },
    {
      name: "Deliver get",
      value: liveRates?.rates.deliver_get || 0,
      fill: "#EC4899",
    },
    {
      name: "Confirm",
      value: liveRates?.rates.confirm || 0,
      fill: "#F59E0B",
    },
    {
      name: "Get",
      value: liveRates?.rates.get || 0,
      fill: "#06B6D4",
    },
    {
      name: "Get no ack",
      value: liveRates?.rates.get_no_ack || 0,
      fill: "#C4B5FD",
    },
    {
      name: "Publish",
      value: liveRates?.rates.publish || 0,
      fill: "#F97316",
    },
    {
      name: "Redeliver",
      value: liveRates?.rates.redeliver || 0,
      fill: "#8B5CF6",
    },
    {
      name: "Reject",
      value: liveRates?.rates.reject || 0,
      fill: "#6366F1",
    },
    {
      name: "Return unroutable",
      value: liveRates?.rates.return_unroutable || 0,
      fill: "#06B6D4",
    },
    {
      name: "Dedup",
      value: 0,
      fill: "#059669",
    },
  ];

  return (
    <Card className="border-0 shadow-md bg-card-unified backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">
          Rates
        </CardTitle>
        <p className="text-sm text-gray-500">
          Live message operation rates (msgs/s)
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-96 w-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
              <p className="text-sm text-gray-500">Loading live rates...</p>
            </div>
          </div>
        ) : (
          <div>
            {/* Legend */}
            <div className="flex flex-wrap gap-4 justify-center text-xs mb-2">
              {chartData.map((item) => (
                <div key={item.name} className="flex items-center gap-1">
                  <div
                    className="w-3 h-3"
                    style={{ backgroundColor: item.fill }}
                  />
                  <span>{item.name}</span>
                </div>
              ))}
            </div>

            {/* Chart */}
            <div className="h-96 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 40, bottom: 80 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    fontSize={11}
                    interval={0}
                  />
                  <YAxis
                    domain={[0, (dataMax: number) => Math.max(dataMax, 10)]}
                    label={{
                      value: "msgs/s",
                      angle: -90,
                      position: "insideLeft",
                    }}
                  />
                  <Tooltip
                    formatter={(value: number) => [
                      `${value.toFixed(2)} msgs/s`,
                      "Rate",
                    ]}
                    labelFormatter={(name: string) => `Operation: ${name}`}
                  />
                  <Bar dataKey="value" minPointSize={5}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Live indicator */}
            <div className="flex items-center justify-center gap-2 -mt-4">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-500">
                Live data • Updates every 5 seconds
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
