import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock } from "lucide-react";

export type TimeRange = "1m" | "10m" | "1h";

interface TimeRangeOption {
  value: TimeRange;
  label: string;
  description: string;
}

const timeRangeOptions: TimeRangeOption[] = [
  { value: "1m", label: "1m", description: "Last minute" },
  { value: "10m", label: "10m", description: "Last 10 minutes" },
  { value: "1h", label: "1h", description: "Last hour" },
];

interface TimeRangeSelectorProps {
  value: TimeRange;
  onValueChange: (value: TimeRange) => void;
  className?: string;
}

export const TimeRangeSelector = ({
  value,
  onValueChange,
  className = "",
}: TimeRangeSelectorProps) => {
  const selectedOption = timeRangeOptions.find(
    (option) => option.value === value
  );

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <Clock className="w-3 h-3 text-gray-500" />
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-28 h-7 text-xs">
          <SelectValue placeholder="Select time range" />
        </SelectTrigger>
        <SelectContent>
          {timeRangeOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
