import { NextRequest, NextResponse } from 'next/server'
import { getMeterReadings } from '@/lib/data'

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const url = new URL(request.url)
    
    // Parse date range
    const fromParam = url.searchParams.get('from')
    const toParam = url.searchParams.get('to')
    const from = fromParam ? new Date(fromParam) : undefined
    const to = toParam ? new Date(toParam) : undefined
    
    // Parse other filters
    const meteringPoint = url.searchParams.get('meteringPoint') || undefined
    const readingType = url.searchParams.get('readingType') || undefined
    const aggregation = url.searchParams.get('aggregation') as 'day' | 'week' | 'month' | 'hour' | '15min' || 'day'
    
    // Fetch the data
    const readings = await getMeterReadings(
      from,
      to,
      meteringPoint,
      readingType,
      aggregation
    )
    
    // Return the data
    return NextResponse.json(readings)
  } catch (error) {
    console.error('Error in readings API route:', error)
    return NextResponse.json(
      { error: 'Failed to fetch readings' },
      { status: 500 }
    )
  }
} 