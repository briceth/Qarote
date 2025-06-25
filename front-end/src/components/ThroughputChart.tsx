import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock } from "lucide-react";

export type TimeRange = "1m" | "10m" | "1h" | "8h" | "24h";

interface TimeRangeOption {
  value: TimeRange;
  label: string;
  description: string;
}

const timeRangeOptions: TimeRangeOption[] = [
  { value: "1m", label: "Last minute", description: "Real-time data" },
  { value: "10m", label: "Last 10 minutes", description: "Recent activity" },
  { value: "1h", label: "Last hour", description: "Short-term trends" },
  { value: "8h", label: "Last 8 hours", description: "Daily patterns" },
  { value: "24h", label: "Last 24 hours", description: "Full day overview" },
];

interface ThroughputChartProps {
  data: Array<{
    time: string;
    published: number;
    consumed: number;
  }>;
  onTimeRangeChange?: (timeRange: TimeRange) => void;
  selectedTimeRange?: TimeRange;
  isLoading?: boolean;
}

// Custom tooltip component
const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border rounded-lg shadow-lg">
        <p className="font-medium text-gray-900">{label}</p>
        {payload.map((entry, index: number) => (
          <p key={index} style={{ color: entry.color }}>
            {entry.name}: {entry.value.toLocaleString()} messages/sec
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const ThroughputChart = ({
  data,
  onTimeRangeChange,
  selectedTimeRange = "24h",
  isLoading = false,
}: ThroughputChartProps) => {
  const [localTimeRange, setLocalTimeRange] =
    useState<TimeRange>(selectedTimeRange);

  const handleTimeRangeChange = (newTimeRange: TimeRange) => {
    setLocalTimeRange(newTimeRange);
    onTimeRangeChange?.(newTimeRange);
  };

  const selectedOption = timeRangeOptions.find(
    (option) => option.value === selectedTimeRange
  );

  if (isLoading) {
    return (
      <div className="h-64 w-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Time Range Selector */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Time Range</span>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={selectedTimeRange}
            onValueChange={handleTimeRangeChange}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              {timeRangeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex flex-col">
                    <span className="font-medium">{option.label}</span>
                    <span className="text-xs text-gray-500">
                      {option.description}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <defs>
              <linearGradient
                id="publishGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#1d4ed8" />
              </linearGradient>
              <linearGradient
                id="consumeGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="time"
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => {
                if (value >= 1000) {
                  return `${(value / 1000).toFixed(0)}k`;
                }
                return value.toString();
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="published"
              name="Published"
              stroke="url(#publishGradient)"
              strokeWidth={3}
              dot={{ fill: "#3b82f6", r: 4 }}
              activeDot={{ r: 6, fill: "#3b82f6" }}
            />
            <Line
              type="monotone"
              dataKey="consumed"
              name="Consumed"
              stroke="url(#consumeGradient)"
              strokeWidth={3}
              dot={{ fill: "#10b981", r: 4 }}
              activeDot={{ r: 6, fill: "#10b981" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Time Range Info */}
      <div className="text-xs text-gray-500 text-center">
        {selectedOption && (
          <span>Showing {selectedOption.description.toLowerCase()}</span>
        )}
      </div>
    </div>
  );
};
