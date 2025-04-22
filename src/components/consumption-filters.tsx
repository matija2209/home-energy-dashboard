"use client"

import { useState, useEffect } from "react"
import { DateRangePicker } from "@/components/ui/date-range-picker" // Assuming you have this component
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select" // Assuming you have these components
import { 
  useFilterStore, 
  type DateRange 
} from "@/store/filter-store"
import { Button } from "@/components/ui/button" // Assuming you have this component

type MeteringPoint = {
  gsrn: string
  name: string | null
}

type ConsumptionFiltersProps = {
  meteringPoints: MeteringPoint[]
  readingTypes: string[]
}

export function ConsumptionFilters({ 
  meteringPoints, 
  readingTypes 
}: ConsumptionFiltersProps) {
  const { 
    dateRange, 
    meteringPoint, 
    readingType, 
    chartType,
    aggregation,
    setDateRange, 
    setMeteringPoint, 
    setReadingType, 
    setChartType,
    setAggregation,
    resetFilters
  } = useFilterStore()

  // Handle date range changes
  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range)
  }

  return (
    <div className="space-y-6 mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:flex lg:flex-wrap gap-4 items-center">
        <div className="w-full sm:col-span-2 md:col-span-3 lg:w-auto">
          <DateRangePicker
            value={dateRange}
            onChange={handleDateRangeChange}
          />
        </div>
        
        <div className="w-full lg:w-auto">
          <Select value={meteringPoint} onValueChange={setMeteringPoint}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select point" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Points</SelectItem>
              {meteringPoints.map((point) => (
                <SelectItem key={point.gsrn} value={point.gsrn}>
                  {point.name || point.gsrn}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="w-full lg:w-auto">
          <Select value={readingType} onValueChange={setReadingType}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Reading type" />
            </SelectTrigger>
            <SelectContent>
              {readingTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="w-full lg:w-auto">
          <Select value={chartType} onValueChange={setChartType}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Chart type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="line">Line Chart</SelectItem>
              <SelectItem value="area">Area Chart</SelectItem>
              <SelectItem value="bar">Bar Chart</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-full lg:w-auto">
          <Select value={aggregation} onValueChange={setAggregation}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Aggregation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15min">15 Minutes</SelectItem>
              <SelectItem value="hour">Hourly</SelectItem>
              <SelectItem value="day">Daily</SelectItem>
              <SelectItem value="week">Weekly</SelectItem>
              <SelectItem value="month">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-full lg:w-auto mt-2 lg:mt-0">
          <Button variant="outline" onClick={resetFilters} className="w-full lg:w-auto">
            Reset Filters
          </Button>
        </div>
      </div>
    </div>
  )
} 