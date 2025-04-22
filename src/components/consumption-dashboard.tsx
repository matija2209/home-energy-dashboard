"use client"

import { useState, useEffect } from "react"
import { ConsumptionFilters } from "@/components/consumption-filters"
import { ConsumptionChart, type ReadingData } from "@/components/consumption-chart"
import { useFilterStore } from "@/store/filter-store"
import { MeteringPointWithName } from "@/lib/data"

type ConsumptionDashboardProps = {
  initialReadings: ReadingData[]
  meteringPoints: MeteringPointWithName[]
  readingTypes: string[]
}

export function ConsumptionDashboard({
  initialReadings,
  meteringPoints,
  readingTypes
}: ConsumptionDashboardProps) {
  // Local state for readings data
  const [readings, setReadings] = useState<ReadingData[]>(initialReadings)
  const [isLoading, setIsLoading] = useState(false)

  // Get filter state
  const { 
    dateRange, 
    meteringPoint, 
    readingType, 
    aggregation 
  } = useFilterStore()

  // Convert metering points to a lookup object for display names
  const meteringPointNames = meteringPoints.reduce<Record<string, string>>(
    (acc, point) => {
      acc[point.gsrn] = point.name || point.gsrn
      return acc
    }, 
    {}
  )

  // Fetch data when filters change
  useEffect(() => {
    // Don't fetch if we don't have valid date range
    if (!dateRange.from || !dateRange.to) {
      return
    }

    const fetchData = async () => {
      try {
        setIsLoading(true)
        
        // Build query params
        const params = new URLSearchParams()
        // Using ! assertion as we already checked for undefined above
        params.append('from', dateRange.from!.toISOString())
        params.append('to', dateRange.to!.toISOString())
        
        if (meteringPoint !== 'all') {
          params.append('meteringPoint', meteringPoint)
        }
        
        if (readingType) {
          params.append('readingType', readingType)
        }
        
        if (aggregation) {
          params.append('aggregation', aggregation)
        }
        
        // Fetch data
        const response = await fetch(`/api/readings?${params.toString()}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch readings')
        }
        
        const data = await response.json()
        setReadings(data)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [dateRange, meteringPoint, readingType, aggregation])

  return (
    <div className="space-y-6">
      <ConsumptionFilters 
        meteringPoints={meteringPoints} 
        readingTypes={readingTypes} 
      />
      
      {isLoading ? (
        <div className="flex justify-center items-center h-[400px] border rounded-lg">
          <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : (
        <ConsumptionChart 
          readings={readings}
          meteringPointNames={meteringPointNames}
        />
      )}
    </div>
  )
} 