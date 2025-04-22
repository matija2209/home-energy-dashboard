import { PrismaClient } from '@prisma/client'
import { cache } from 'react'

const prisma = new PrismaClient()

export type MeteringPointWithName = {
  gsrn: string
  name: string | null
}

export type ReadingDataResponse = {
  timestamp: string
  value: number
  meteringPointId: string
  readingTypeCode: string
}

// Cache the database queries for better performance
export const getMeteringPoints = cache(async (): Promise<MeteringPointWithName[]> => {
  try {
    const meteringPoints = await prisma.meteringPoint.findMany({
      select: {
        gsrn: true,
        name: true
      }
    })
    return meteringPoints
  } catch (error) {
    console.error('Error fetching metering points:', error)
    return []
  }
})

export const getReadingTypes = cache(async (): Promise<string[]> => {
  try {
    const readings = await prisma.meterReading.findMany({
      select: {
        readingTypeCode: true
      },
      distinct: ['readingTypeCode']
    })
    return readings.map(r => r.readingTypeCode)
  } catch (error) {
    console.error('Error fetching reading types:', error)
    return ['consumption'] // Default fallback
  }
})

export const getMeterReadings = cache(async (
  from?: Date,
  to?: Date,
  meteringPoint?: string,
  readingType?: string,
  aggregation: 'day' | 'week' | 'month' | 'hour' | '15min' = 'day'
): Promise<ReadingDataResponse[]> => {
  try {
    // Set default date range if not provided
    const startDate = from || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const endDate = to || new Date()

    // Build the query
    const whereClause: any = {
      timestamp: {
        gte: startDate,
        lte: endDate
      }
    }

    // Add metering point filter if specified
    if (meteringPoint && meteringPoint !== 'all') {
      whereClause.meteringPointId = meteringPoint
    }

    // Add reading type filter if specified
    if (readingType) {
      whereClause.readingTypeCode = readingType
    }

    // Get the raw data
    const readings = await prisma.meterReading.findMany({
      where: whereClause,
      orderBy: {
        timestamp: 'asc'
      },
      select: {
        timestamp: true,
        value: true,
        readingTypeCode: true,
        meteringPointId: true
      }
    })

    // Format the dates and apply aggregation if needed
    if (aggregation === '15min') {
      // No aggregation needed, return raw 15-minute data
      return readings.map(reading => ({
        timestamp: reading.timestamp.toISOString(),
        value: Number(reading.value),
        meteringPointId: reading.meteringPointId,
        readingTypeCode: reading.readingTypeCode
      }))
    }

    // For other aggregations, we need to group and aggregate the data
    const aggregatedData: { [key: string]: ReadingDataResponse } = {}
    
    readings.forEach(reading => {
      // Create a key based on the aggregation period
      let periodKey: string
      const date = reading.timestamp
      
      switch (aggregation) {
        case 'hour':
          periodKey = new Date(
            date.getFullYear(), 
            date.getMonth(), 
            date.getDate(), 
            date.getHours()
          ).toISOString()
          break
        case 'day':
          periodKey = new Date(
            date.getFullYear(), 
            date.getMonth(), 
            date.getDate()
          ).toISOString()
          break
        case 'week':
          // Get the first day of the week (Sunday)
          const dayOfWeek = date.getDay()
          const diffToStartOfWeek = date.getDate() - dayOfWeek
          periodKey = new Date(
            date.getFullYear(), 
            date.getMonth(), 
            diffToStartOfWeek
          ).toISOString()
          break
        case 'month':
          periodKey = new Date(
            date.getFullYear(), 
            date.getMonth(), 
            1
          ).toISOString()
          break
        default:
          periodKey = date.toISOString()
      }
      
      // Combine read values with the same period key
      const key = `${periodKey}-${reading.meteringPointId}-${reading.readingTypeCode}`
      
      if (!aggregatedData[key]) {
        aggregatedData[key] = {
          timestamp: periodKey,
          value: Number(reading.value),
          meteringPointId: reading.meteringPointId,
          readingTypeCode: reading.readingTypeCode
        }
      } else {
        // Sum the values for the same period
        aggregatedData[key].value += Number(reading.value)
      }
    })
    
    return Object.values(aggregatedData)
    
  } catch (error) {
    console.error('Error fetching meter readings:', error)
    return []
  }
}) 