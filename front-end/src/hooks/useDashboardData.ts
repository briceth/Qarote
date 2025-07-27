import { useMemo, useState, useEffect } from "react";
import {
  useOverview,
  useQueues,
  useNodes,
  useEnhancedMetrics,
  useTimeSeriesMetrics,
} from "./useApi";
import { RabbitMQAuthorizationError } from "@/types/apiErrors";
import { TimeRange } from "@/components/ThroughputChart";

interface ChartData {
  time: string;
  published: number;
  consumed: number;
}

export const useDashboardData = (selectedServerId: string | null) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>("1h");
  const [chartData, setChartData] = useState<ChartData[]>([
    { time: "00:00", published: 0, consumed: 0 },
    { time: "04:00", published: 0, consumed: 0 },
    { time: "08:00", published: 0, consumed: 0 },
    { time: "12:00", published: 0, consumed: 0 },
    { time: "16:00", published: 0, consumed: 0 },
    { time: "20:00", published: 0, consumed: 0 },
  ]);

  // API calls
  const { data: overviewData, isLoading: overviewLoading } =
    useOverview(selectedServerId);
  const { data: queuesData, isLoading: queuesLoading } =
    useQueues(selectedServerId);
  const { data: nodesData, isLoading: nodesLoading } =
    useNodes(selectedServerId);
  const { data: enhancedMetricsData } = useEnhancedMetrics(selectedServerId);
  const { data: timeSeriesData, isLoading: timeSeriesLoading } =
    useTimeSeriesMetrics(selectedServerId, selectedTimeRange);

  // Processed data
  const overview = overviewData?.overview;
  const queues = queuesData?.queues || [];
  const nodes = useMemo(() => nodesData?.nodes || [], [nodesData?.nodes]);
  const enhancedMetrics = enhancedMetricsData?.metrics;

  // Check for permission status instead of errors
  const metricsPermissionStatus = enhancedMetricsData?.permissionStatus;
  const timeSeriesPermissionStatus = timeSeriesData?.permissionStatus;

  // Create error objects for backward compatibility with UI components
  const enhancedMetricsError =
    metricsPermissionStatus && !metricsPermissionStatus.hasPermission
      ? new RabbitMQAuthorizationError({
          error: "insufficient_permissions",
          message: metricsPermissionStatus.message,
          code: "RABBITMQ_INSUFFICIENT_PERMISSIONS",
          requiredPermission: metricsPermissionStatus.requiredPermission,
        })
      : null;

  const timeSeriesError =
    timeSeriesPermissionStatus && !timeSeriesPermissionStatus.hasPermission
      ? new RabbitMQAuthorizationError({
          error: "insufficient_permissions",
          message: timeSeriesPermissionStatus.message,
          code: "RABBITMQ_INSUFFICIENT_PERMISSIONS",
          requiredPermission: timeSeriesPermissionStatus.requiredPermission,
        })
      : null;

  // Calculate metrics
  const metrics = useMemo(
    () => ({
      messagesPerSec: Math.round(
        (overview?.message_stats?.publish_details?.rate || 0) +
          (overview?.message_stats?.deliver_details?.rate || 0)
      ),
      activeQueues: overview?.object_totals?.queues || 0,
      avgLatency: enhancedMetrics?.avgLatency || 0,
      queueDepth: overview?.queue_totals?.messages || 0,
      connectedNodes: nodes.length,
      totalMemory: enhancedMetrics?.totalMemoryGB || 0,
      cpuUsage: enhancedMetrics?.avgCpuUsage || 0,
      diskUsage: enhancedMetrics?.diskUsage || 0,
    }),
    [overview, enhancedMetrics, nodes]
  );

  // Update chart data from time series API
  useEffect(() => {
    if (
      timeSeriesData?.aggregatedThroughput &&
      timeSeriesData.aggregatedThroughput.length > 1
    ) {
      // Filter out data points where both published and consumed are 0
      const filteredData = timeSeriesData.aggregatedThroughput.filter(
        (point) => {
          return point.publishRate > 0 || point.consumeRate > 0;
        }
      );

      // Only update chart data if we have actual activity
      if (filteredData.length > 0) {
        const formattedData = filteredData.map((point) => {
          const date = new Date(point.timestamp);

          // Format time based on time range
          let timeFormat: Intl.DateTimeFormatOptions;
          if (selectedTimeRange.includes("m")) {
            // For minute ranges, show seconds
            timeFormat = {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: false,
            };
          } else if (
            selectedTimeRange.includes("h") &&
            parseInt(selectedTimeRange) <= 8
          ) {
            // For hour ranges, show hours and minutes
            timeFormat = {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            };
          } else {
            // For day ranges, show date and time
            timeFormat = {
              month: "short",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            };
          }

          const time = date.toLocaleString([], timeFormat);

          return {
            time,
            published: Math.round(point.publishRate),
            consumed: Math.round(point.consumeRate),
          };
        });

        setChartData(formattedData);
      } else {
        // If no activity, show empty chart data
        setChartData([]);
      }
    } else if (timeSeriesData?.timeseries) {
      // Fallback to old format if aggregatedThroughput is not available
      const filteredData = timeSeriesData.timeseries.filter((point) => {
        return (point.messages || 0) > 0;
      });

      if (filteredData.length > 0) {
        setChartData(
          filteredData.map((point) => ({
            time: point.time,
            published: point.messages || 0,
            consumed: 0, // Old format doesn't have separate consume data
          }))
        );
      } else {
        setChartData([]);
      }
    }
  }, [timeSeriesData, selectedTimeRange]);

  const handleTimeRangeChange = (timeRange: TimeRange) => {
    setSelectedTimeRange(timeRange);
  };

  // Convert and filter available time ranges from API response to match TimeRange type
  const availableTimeRanges = useMemo(() => {
    const rawRanges = timeSeriesData?.metadata?.allowedTimeRanges;
    if (!rawRanges) return undefined;

    // Valid TimeRange values
    const validTimeRanges: TimeRange[] = [
      "1m",
      "10m",
      "1h",
      "8h",
      "24h",
      "7d",
      "30d",
      "90d",
      "1y",
    ];

    // Filter and cast to ensure type safety
    return rawRanges.filter((range): range is TimeRange =>
      validTimeRanges.includes(range as TimeRange)
    );
  }, [timeSeriesData?.metadata?.allowedTimeRanges]);

  const isLoading =
    overviewLoading || queuesLoading || nodesLoading || timeSeriesLoading;

  return {
    // Data
    overview,
    queues,
    nodes,
    metrics,
    chartData,

    // Loading states
    isLoading,
    overviewLoading,
    queuesLoading,
    nodesLoading,
    timeSeriesLoading,

    // Error states
    enhancedMetricsError,
    timeSeriesError,

    // Chart controls
    selectedTimeRange,
    handleTimeRangeChange,
    availableTimeRanges,
  };
};
