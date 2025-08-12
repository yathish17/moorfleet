import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

type TimeRange = "1day" | "7days" | "1month" | "1year"

interface UnitKPICardsProps {
  kpiData: any
  selectedRange: TimeRange
  onRangeChange: (range: TimeRange) => void
}

const RANGE_LABELS: Record<TimeRange, string> = {
  "1day": "Last 24 Hours",
  "7days": "Last 7 Days",
  "1month": "Last 30 Days",
  "1year": "Last 12 Months"
}

export function UnitKPICards({ kpiData, selectedRange, onRangeChange }: UnitKPICardsProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Performance Metrics</h2>
        <Select value={selectedRange} onValueChange={(val: TimeRange) => onRangeChange(val)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Select Range">
              {RANGE_LABELS[selectedRange]}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {Object.entries(RANGE_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Availability</p>
            <p className="text-2xl font-bold">
              {kpiData?.availability != null ? `${kpiData.availability}%` : "--"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">MTBF</p>
            <p className="text-2xl font-bold">
              {kpiData?.mtbf === Infinity
                ? "∞"
                : kpiData?.mtbf != null
                  ? `${kpiData.mtbf} hrs`
                  : "--"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Utilization</p>
            <p className="text-2xl font-bold">
              {kpiData?.utilization != null ? `${kpiData.utilization}%` : "--"}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
