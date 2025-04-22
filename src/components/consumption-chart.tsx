"use client"

import * as React from "react"
import { 
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  ReferenceLine, ReferenceArea
} from "recharts"
import { 
  ChartContainer, ChartTooltip, ChartTooltipContent, 
  ChartLegend, ChartLegendContent 
} from "@/components/ui/chart"
import { useFilterStore } from "@/store/filter-store"
import { format, parse, getHours, startOfDay, isSameDay, addDays } from "date-fns"

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

// Peak hours configuration
const PEAK_HOURS = [
  { start: 6, end: 14 },  // 06:00 - 14:00
  { start: 16, end: 22 }, // 16:00 - 22:00
]

export function ConsumptionChart({ 
  readings, 
  meteringPointNames 
}: ConsumptionChartProps) {
  // Get the current chart type and aggregation from the filter store
  const { chartType, readingType, aggregation } = useFilterStore()
  
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
    return data.map(reading => {
      // Parse the timestamp to a Date object
      const date = new Date(reading.timestamp)
      const hour = getHours(date)
      
      // Check if this reading falls within a peak hour
      const isPeakHour = PEAK_HOURS.some(
        period => hour >= period.start && hour < period.end
      )
      
      return {
        ...reading,
        date,
        hour,
        isPeakHour,
        // Format the timestamp based on aggregation level
        formattedTime: aggregation === '15min' 
          ? format(date, 'HH:mm') 
          : aggregation === 'hour'
            ? format(date, 'HH:00')
            : format(date, 'yyyy-MM-dd HH:mm'),
        // Add the metering point name if available
        meteringPointName: meteringPointNames[reading.meteringPointId] || reading.meteringPointId
      }
    })
  }

  const formattedData = formatData(readings)

  // Determine if peak hour overlays should be shown (only in 15min or hourly view)
  const showPeakHours = aggregation === '15min' || aggregation === 'hour'

  // Render a simple colored reference area for peak hours
  const renderSimplePeakHours = () => {
    if (!showPeakHours || formattedData.length === 0) return null;
    
    // For simplicity, we'll color the background of data points occurring during peak hours
    // This works better with the x-axis which may not use actual date values
    return formattedData.map((reading, index) => {
      if (reading.isPeakHour) {
        return (
          <ReferenceArea
            key={`peak-${index}`}
            x1={reading.formattedTime}
            x2={reading.formattedTime}
            y1={0}
            y2={Math.max(...formattedData.map(d => d.value)) * 1.1} // Slightly higher than max value
            fill="#FFA500"
            fillOpacity={0.2}
            ifOverflow="extendDomain"
          />
        );
      }
      return null;
    }).filter(Boolean);
  };

  // Function to render the appropriate chart based on the chartType
  const renderChart = () => {
    // Get peak hour overlays
    const peakHourOverlays = renderSimplePeakHours();
    
    // Apply different styling to peak hour data points
    const enhancedData = formattedData.map(d => ({
      ...d,
      // Add a different color for peak hour data points
      peakValue: d.isPeakHour ? d.value : undefined,
      normalValue: d.isPeakHour ? undefined : d.value
    }));
    
    switch (chartType) {
      case "line":
        return (
          <LineChart 
            data={enhancedData}
            margin={{ top: 10, right: 30, left: 10, bottom: 50 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="formattedTime" 
              tick={{ fontSize: 10 }}
              angle={-45}
              textAnchor="end"
              height={60}
              interval="preserveStartEnd"
            />
            <YAxis 
              tickFormatter={(value) => `${value} kWh`}
              tick={{ fontSize: 12 }}
            />
            {showPeakHours && peakHourOverlays}
            <ChartTooltip 
              content={<ChartTooltipContent />}
              labelFormatter={(label) => {
                const item = formattedData.find(d => d.formattedTime === label)
                return item ? format(item.date, 'PPpp') : label
              }}
            />
            <ChartLegend content={<ChartLegendContent />} />
            {/* Main line for all data */}
            <Line 
              type="monotone" 
              dataKey="value" 
              name={readingType} 
              stroke={getChartColor()}
              strokeWidth={2}
              dot={{ fill: getChartColor() }}
              activeDot={{ r: 6 }}
            />
            {/* Highlight line for peak hours */}
            {showPeakHours && (
              <Line 
                type="monotone" 
                dataKey="peakValue" 
                name="Peak Hours" 
                stroke="#FFA500"
                strokeWidth={3}
                dot={{ fill: "#FFA500", r: 4 }}
                activeDot={{ r: 6 }}
              />
            )}
          </LineChart>
        )
      
      case "area":
        return (
          <AreaChart 
            data={enhancedData}
            margin={{ top: 10, right: 30, left: 10, bottom: 50 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="formattedTime" 
              tick={{ fontSize: 10 }}
              angle={-45}
              textAnchor="end"
              height={60}
              interval="preserveStartEnd"
            />
            <YAxis 
              tickFormatter={(value) => `${value} kWh`}
              tick={{ fontSize: 12 }}
            />
            {showPeakHours && peakHourOverlays}
            <ChartTooltip 
              content={<ChartTooltipContent />}
              labelFormatter={(label) => {
                const item = formattedData.find(d => d.formattedTime === label)
                return item ? format(item.date, 'PPpp') : label
              }}
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Area 
              type="monotone" 
              dataKey="value" 
              name={readingType} 
              fill={`var(--color-${readingType})`}
              stroke={`var(--color-${readingType})`}
              fillOpacity={0.6}
            />
            {/* Optional: Add a highlight for peak data points */}
            {showPeakHours && (
              <Area 
                type="monotone" 
                dataKey="peakValue" 
                name="Peak Hours" 
                fill="#FFA500"
                stroke="#FFA500"
                fillOpacity={0.4}
              />
            )}
          </AreaChart>
        )
      
      case "bar":
        return (
          <BarChart 
            data={enhancedData}
            margin={{ top: 10, right: 30, left: 10, bottom: 50 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="formattedTime" 
              tick={{ fontSize: 10 }}
              angle={-45}
              textAnchor="end"
              height={60}
              interval="preserveStartEnd"
            />
            <YAxis 
              tickFormatter={(value) => `${value} kWh`}
              tick={{ fontSize: 12 }}
            />
            {showPeakHours && peakHourOverlays}
            <ChartTooltip 
              content={<ChartTooltipContent />} 
              labelFormatter={(label) => {
                const item = formattedData.find(d => d.formattedTime === label)
                return item ? format(item.date, 'PPpp') : label
              }}
            />
            <ChartLegend content={<ChartLegendContent />} />
            {/* Regular bars */}
            <Bar 
              dataKey="normalValue" 
              name={readingType} 
              fill={`var(--color-${readingType})`}
            />
            {/* Peak hour bars */}
            {showPeakHours && (
              <Bar 
                dataKey="peakValue" 
                name="Peak Hours" 
                fill="#FFA500"
              />
            )}
          </BarChart>
        )
      
      default:
        return (
          <LineChart 
            data={enhancedData}
            margin={{ top: 10, right: 30, left: 10, bottom: 50 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="formattedTime" 
              tick={{ fontSize: 10 }}
              angle={-45}
              textAnchor="end"
              height={60}
              interval="preserveStartEnd"
            />
            <YAxis tickFormatter={(value) => `${value} kWh`} />
            {showPeakHours && peakHourOverlays}
            <ChartTooltip 
              formatter={(value) => `${value} kWh`}
              
              content={<ChartTooltipContent />}
              labelFormatter={(label) => {
                const item = formattedData.find(d => d.formattedTime === label)
                return item ? format(item.date, "dd.MM.yyyy HH:mm") : "label"
              }}
            />
            <ChartLegend  content={<ChartLegendContent />} />
            <Line 
              type="monotone" 
              dataKey="value" 
              name={readingType} 
              stroke={getChartColor()}
              dot={{ fill: getChartColor() }}
              activeDot={{ r: 6 }}
            />
            {showPeakHours && (
              <Line 
                type="monotone" 
                dataKey="peakValue" 
                name="Peak Hours" 
                stroke="#FFA500"
                strokeWidth={3}
                dot={{ fill: "#FFA500", r: 4 }}
                activeDot={{ r: 6 }}
              />
            )}
          </LineChart>
        )
    }
  }

  return (
    <div className="w-full border rounded-lg p-4 bg-background overflow-scroll">
      <h2 className="text-xl font-semibold mb-4">
        Energy {readingType.charAt(0).toUpperCase() + readingType.slice(1)}
        {showPeakHours && (
          <span className="text-sm font-normal text-orange-500 ml-2">
            (Peak hours: 06:00-14:00, 16:00-22:00)
          </span>
        )}
      </h2>
      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ChartContainer config={chartConfig} className="h-full">
            {renderChart()}
          </ChartContainer>
        </ResponsiveContainer>
      </div>
    </div>
  )
} 