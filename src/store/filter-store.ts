"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export type DateRange = {
  from: Date | undefined
  to: Date | undefined
}

export type FilterState = {
  dateRange: DateRange
  meteringPoint: string
  readingType: string
  chartType: string
  aggregation: string
}

export type FilterActions = {
  setDateRange: (dateRange: DateRange) => void
  setMeteringPoint: (meteringPoint: string) => void
  setReadingType: (readingType: string) => void
  setChartType: (chartType: string) => void
  setAggregation: (aggregation: string) => void
  resetFilters: () => void
}

const defaultFilters: FilterState = {
  dateRange: {
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    to: new Date()
  },
  meteringPoint: "all",
  readingType: "consumption",
  chartType: "line",
  aggregation: "day"
}

export const useFilterStore = create<FilterState & FilterActions>()(
  persist(
    (set) => ({
      ...defaultFilters,
      
      setDateRange: (dateRange) => set({ dateRange }),
      setMeteringPoint: (meteringPoint) => set({ meteringPoint }),
      setReadingType: (readingType) => set({ readingType }),
      setChartType: (chartType) => set({ chartType }),
      setAggregation: (aggregation) => set({ aggregation }),
      resetFilters: () => set(defaultFilters)
    }),
    {
      name: "consumption-filters"
    }
  )
) 