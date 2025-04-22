import { PrismaClient, Prisma } from '@prisma/client';
import * as dotenv from 'dotenv';
import { format, addDays, parseISO, isBefore, isEqual } from 'date-fns';
import { MojElektroClient } from '@/lib/mojelektroClient';

// Load environment variables from .env file
dotenv.config();

const prisma = new PrismaClient();

// --- Configuration ---
const apiKey = process.env.MOJ_ELEKTRO_API_KEY;
const targetGsrn = process.env.TARGET_GSRN; // Your metering point GSRN
const targetReadingTypeCode = process.env.TARGET_READING_TYPE_CODE; // The specific reading type code for consumption
const defaultStartDate = '2025-04-11';
const seedStartDateStr = process.env.SEED_START_DATE || defaultStartDate;
const apiEnv = "production"

// --- Helper Functions ---

// Basic delay function to avoid hitting API rate limits
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Define simple interfaces for type checking API response parts
interface IntervalReading {
    timestamp?: string | number | Date; // Allow flexibility, will be converted to Date
    value?: string | number;          // Allow flexibility, Prisma handles Decimal conversion
    readingQualities?: any[];         // Keep as any or define further if structure known
}
  
interface IntervalBlock {
    readingType?: string;
    intervalReadings?: IntervalReading[];
}

// --- Main Seeding Logic ---

async function main() {
    console.log("Starting database seeding...");

    // --- Validation ---
    if (!apiKey) {
        throw new Error("MOJ_ELEKTRO_API_KEY is not defined in .env file.");
    }
    if (!targetGsrn) {
        throw new Error("TARGET_GSRN is not defined in .env file.");
    }
    if (!targetReadingTypeCode) {
        throw new Error("TARGET_READING_TYPE_CODE is not defined in .env file.");
    }

    // --- Find or Create User and MeteringPoint ---
    // Upsert a default user for seeding purposes
    const seedUserEmail = 'matijazib@gmail.com';
    const user = await prisma.user.upsert({
        where: { email: seedUserEmail },
        update: {},
        create: {
            email: seedUserEmail,
            name: 'Seed User',
        },
    });
    console.log(`Using User: ${user.email} (ID: ${user.id})`);

    // Find the MeteringPoint, or create it if it doesn't exist
    let meteringPoint = await prisma.meteringPoint.findUnique({
        where: { gsrn: targetGsrn },
    });

    if (!meteringPoint) {
        console.log(`MeteringPoint with GSRN ${targetGsrn} not found. Creating it...`);
        meteringPoint = await prisma.meteringPoint.create({
            data: {
                gsrn: targetGsrn,
                userId: user.id, // Link to the seed user
                name: `Seed Metering Point ${targetGsrn.slice(-4)}` // Optional: Give it a default name
            }
        });
        console.log(`Created MeteringPoint: ${meteringPoint.gsrn}`);
    } else {
        console.log(`Found existing MeteringPoint: ${meteringPoint.gsrn} (User: ${meteringPoint.userId})`);
    }

    // --- Client Initialization ---
    const mojElektroClient = new MojElektroClient(apiKey, apiEnv);
    console.log(`MojElektroClient initialized for ${apiEnv} environment.`);

    // --- Date Range Setup ---
    const startDate = parseISO(seedStartDateStr);
    const endDate = new Date(); // Today
    let currentDate = startDate;

    console.log(`Fetching data from ${format(startDate, 'yyyy-MM-dd')} to ${format(endDate, 'yyyy-MM-dd')}`);

    // --- Data Fetching Loop ---
    while (isBefore(currentDate, endDate) || isEqual(currentDate, endDate)) {
        const startTimeStr = format(currentDate, 'yyyy-MM-dd');
        // Get data up to the end of the current day, so endTime is start of next day
        const endTimeStr = format(addDays(currentDate, 1), 'yyyy-MM-dd');

        console.log(`
Fetching data for ${startTimeStr}...`);

        try {
            // Log the parameters before making the API call
            console.log(`Calling getMeterReadings with:`);
            console.log(`  usagePoint: ${targetGsrn}`);
            console.log(`  startTime: ${startTimeStr}`);
            console.log(`  endTime: ${endTimeStr}`);
            console.log(`  option: ReadingType=${targetReadingTypeCode}`); // Re-added option parameter

            const meterReadingsResponse = await mojElektroClient.getMeterReadings({
                usagePoint: targetGsrn,
                startTime: startTimeStr,
                endTime: endTimeStr, // Fetch up to the start of the next day
                option: [`ReadingType=${targetReadingTypeCode}`] // Re-added option parameter
            });

            if (!meterReadingsResponse || !meterReadingsResponse.intervalBlocks) {
                console.log(`No data returned for ${startTimeStr}.`);
                currentDate = addDays(currentDate, 1); // Move to next day
                await delay(250); // Small delay even if no data
                continue;
            }

            // Find the specific block for our target reading type
            const relevantBlock: IntervalBlock | undefined = meterReadingsResponse.intervalBlocks.find(
                (block: IntervalBlock) => block.readingType === targetReadingTypeCode
            );

            if (!relevantBlock || !relevantBlock.intervalReadings || relevantBlock.intervalReadings.length === 0) {
                console.log(`No interval readings found for ${targetReadingTypeCode} on ${startTimeStr}.`);
            } else {
                // --- Data Transformation --- 
                // Filter out readings with missing timestamp or value *before* mapping
                const validReadings = relevantBlock.intervalReadings.filter(
                    (reading: IntervalReading) => reading.timestamp !== undefined && reading.value !== undefined
                );
                
                const readingsToCreate: Prisma.MeterReadingCreateManyInput[] = validReadings.map((reading: IntervalReading) => ({
                    // We know timestamp and value are defined here due to the filter above
                    timestamp: new Date(reading.timestamp!),
                    value: reading.value!, // Prisma handles string -> Decimal conversion
                    readingTypeCode: targetReadingTypeCode,
                    // Store the quality array as JSON
                    quality: reading.readingQualities ? reading.readingQualities : Prisma.JsonNull,
                    meteringPointId: targetGsrn, // Link to the existing MeteringPoint
                    userId: user.id // Add the user ID from the upserted user
                }));

                let insertionResult: Prisma.BatchPayload | null = null;
                try {
                    // --- Database Insertion ---
                    if (readingsToCreate.length > 0) {
                        console.log(`Inserting ${readingsToCreate.length} readings for ${startTimeStr} using GRSN ${targetGsrn} and ReadingType ${targetReadingTypeCode}...`);
                        insertionResult = await prisma.meterReading.createMany({
                            data: readingsToCreate,
                            skipDuplicates: true, // Important for idempotency
                        });
                        console.log(`Inserted ${insertionResult.count} new readings.`);
                    }
                } catch (dbError: any) {
                    console.error(`Error inserting data into database for ${startTimeStr}:`, dbError.message || dbError);
                    // Decide if you want to stop or continue on DB error
                    // For now, we log and continue to the next day
                }
            }

        } catch (apiError: any) {
            // This catch block now primarily handles API errors or data processing errors before insertion
            console.error(`Error fetching data from API or processing response for ${startTimeStr}:`, apiError.message || apiError);
            // Log status code if available (for API errors)
            if (apiError.response?.status) {
                console.error(`API returned status code: ${apiError}`);
            }
            // Decide if you want to stop or continue on API error
            // For now, we log and continue to the next day
        }

        // Move to the next day
        currentDate = addDays(currentDate, 1);

        // Add a small delay to be kind to the API
        await delay(500); // 0.5 second delay between daily requests
    }

    console.log("Database seeding finished.");
}

// --- Execute Main Function ---
main()
    .catch((e) => {
        console.error("Error during seeding:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        console.log("Prisma client disconnected.");
    }); 