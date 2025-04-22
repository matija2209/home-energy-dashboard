"use client"

import { 
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer
} from "recharts"
import { 
  ChartContainer, ChartTooltip, ChartTooltipContent, 
  ChartLegend, ChartLegendContent 
} from "@/components/ui/chart"
import { useFilterStore } from "@/store/filter-store"
import { format } from "date-fns"

// Define the reading data type
export type ReadingData = {
  timestamp: string
  value: number
  meteringPointId: string
  readingTypeCode: string
}

// Props for the component
type ConsumptionChartProps = {
  readings: ReadingData[]
  meteringPointNames: Record<string, string>
}

// Separate interface for our color config
interface ColorConfig {
  [key: string]: {
    color: string;
  }
}

export function ConsumptionChart({ 
  readings, 
  meteringPointNames 
}: ConsumptionChartProps) {
  // Get the current chart type from the filter store
  const { chartType, readingType } = useFilterStore()
  
  // Chart configuration for the ChartContainer
  const chartConfig = {
    consumption: {
      label: "Consumption",
      theme: { light: "#2563eb", dark: "#3b82f6" },
    },
    production: {
      label: "Production",
      theme: { light: "#16a34a", dark: "#22c55e" },
    },
    // Add more reading types as needed
  }

  // Direct color configuration for the charts
  const colorConfig: ColorConfig = {
    consumption: {
      color: "#3b82f6"
    },
    production: {
      color: "#22c55e"
    }
  }

  // Get the color for the current reading type
  const getChartColor = () => {
    if (readingType in colorConfig) {
      return colorConfig[readingType].color
    }
    return "#3b82f6" // Default blue fallback
  }

  // Format the data for the chart
  const formatData = (data: ReadingData[]) => {
    return data.map(reading => ({
      ...reading,
      // Format the timestamp for display
      formattedTime: format(new Date(reading.timestamp), 'yyyy-MM-dd HH:mm'),
      // Add the metering point name if available
      meteringPointName: meteringPointNames[reading.meteringPointId] || reading.meteringPointId
    }))
  }

  const formattedData = formatData(readings)

  // Function to render the appropriate chart based on the chartType
  const renderChart = () => {
    switch (chartType) {
      case "line":
        return (
          <LineChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="formattedTime" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
            />
            <YAxis 
              tickFormatter={(value) => `${value} kWh`}
              tick={{ fontSize: 12 }}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Line 
              type="monotone" 
              dataKey="value" 
              name={readingType} 
              stroke={getChartColor()}
              strokeWidth={2}
              dot={{ fill: getChartColor() }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        )
      
      case "area":
        return (
          <AreaChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="formattedTime" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
            />
            <YAxis 
              tickFormatter={(value) => `${value} kWh`}
              tick={{ fontSize: 12 }}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Area 
              type="monotone" 
              dataKey="value" 
              name={readingType} 
              fill={`var(--color-${readingType})`}
              stroke={`var(--color-${readingType})`}
              fillOpacity={0.6}
            />
          </AreaChart>
        )
      
      case "bar":
        return (
          <BarChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="formattedTime" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
            />
            <YAxis 
              tickFormatter={(value) => `${value} kWh`}
              tick={{ fontSize: 12 }}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar 
              dataKey="value" 
              name={readingType} 
              fill={`var(--color-${readingType})`}
            />
          </BarChart>
        )
      
      default:
        return (
          <LineChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="formattedTime" />
            <YAxis tickFormatter={(value) => `${value} kWh`} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Line 
              type="monotone" 
              dataKey="value" 
              name={readingType} 
              stroke={getChartColor()}
              dot={{ fill: getChartColor() }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        )
    }
  }

  return (
    <div className="w-full border rounded-lg p-4 bg-background">
      <h2 className="text-xl font-semibold mb-4">
        Energy {readingType.charAt(0).toUpperCase() + readingType.slice(1)}
      </h2>
      <div className="h-[400px] w-full">
        <ChartContainer config={chartConfig} className="h-full">
          {renderChart()}
        </ChartContainer>
      </div>
    </div>
  )
} 