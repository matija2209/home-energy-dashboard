import { 
  getMeteringPoints, 
  getReadingTypes, 
  getMeterReadings 
} from "@/lib/data"
import { ConsumptionDashboard } from "@/components/consumption-dashboard"

export default async function Home() {
  // Fetch initial data on the server
  const meteringPoints = await getMeteringPoints()
  const readingTypes = await getReadingTypes()
  
  // Get initial readings with default filters
  const initialReadings = await getMeterReadings(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
    new Date(),
    undefined, // All metering points
    readingTypes.length > 0 ? readingTypes[0] : 'consumption', // First reading type
    'day' // Daily aggregation
  )

  return (
    <main className="container max-w-7xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Darči Elektro Postaja</h1>
      
      <ConsumptionDashboard
        initialReadings={initialReadings}
        meteringPoints={meteringPoints}
        readingTypes={readingTypes}
      />
    </main>
  )
}
