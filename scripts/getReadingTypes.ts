import { MojElektroClient } from '../src/lib/mojelektroClient.js'; // Adjust path if needed
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

async function fetchReadingTypes() {
    console.log("Fetching available reading types...");

    const apiKey = process.env.MOJ_ELEKTRO_API_KEY;
    const apiEnv = (process.env.MOJ_ELEKTRO_ENV === 'test' ? 'test' : 'production') as 'test' | 'production';

    if (!apiKey) {
        console.error("Error: MOJ_ELEKTRO_API_KEY is not defined in .env file.");
        process.exit(1);
    }

    try {
        const client = new MojElektroClient(apiKey, apiEnv);
        console.log(`Using API environment: ${apiEnv}`);

        const readingTypes = await client.getReadingTypes();

        console.log("\n--- Available Reading Types ---");
        console.log(JSON.stringify(readingTypes, null, 2)); // Pretty print the JSON response
        console.log("\n-----------------------------");
        console.log("\nLook for the 'readingType' code associated with the desired consumption metric (e.g., total energy).");
        console.log("Use that code for the TARGET_READING_TYPE_CODE environment variable in your .env file for the seeding script.");

    } catch (error: any) {
        console.error("\nError fetching reading types:", error.message || error);
        process.exit(1);
    }
}

fetchReadingTypes(); 