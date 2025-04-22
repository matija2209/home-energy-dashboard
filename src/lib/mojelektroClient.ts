import axios, { type AxiosInstance } from 'axios';
import type { paths, components, operations } from './mojelektro'; // Import generated types

// Define potential base URLs
const PRODUCTION_URL = 'https://api.informatika.si/mojelektro/v1';
const TEST_URL = 'https://api-test.informatika.si/mojelektro/v1';

// Define parameter and response types for cleaner method signatures
type GetMeterReadingsParams = operations['getMeterReadings']['parameters']['query'];
type GetMeterReadingsResponse = components['schemas']['MeterReadings'];
type GetMerilnoMestoParams = operations['getMerilnoMesto']['parameters']['path'];
type GetMerilnoMestoResponse = components['schemas']['MerilnoMestoPolno'];
type GetMerilnaTockaParams = operations['getMerilnaTocka']['parameters']['path'];
type GetMerilnaTockaResponse = components['schemas']['MerilnaTockaPolno'];
type GetReadingQualitiesResponse = components['schemas']['ReadingQualities'];
type GetReadingTypesResponse = components['schemas']['ReadingTypes'];
type ApiErrorResponse = components['schemas']['Napaka']; // Assuming Napaka is the common error schema

/**
 * Type guard to check if the response is an API error.
 * Adjust 'koda' and 'opis' if the actual error schema differs.
 */
function isApiError(data: any): data is ApiErrorResponse {
    return data && typeof data === 'object' && 'koda' in data && 'opis' in data;
}

export class MojElektroClient {
    private axiosInstance: AxiosInstance;
    public readonly environment: 'production' | 'test';

    /**
     * Creates an instance of the Moj Elektro API client.
     * @param apiKey - Your Moj Elektro API key.
     * @param env - The environment to target ('production' or 'test'). Defaults to 'production'.
     */
    constructor(apiKey: string, env: 'production' | 'test' = 'production') {
        if (!apiKey) {
            throw new Error('Moj Elektro API key is required.');
        }
        this.environment = env;
        const baseURL = env === 'production' ? PRODUCTION_URL : TEST_URL;

        this.axiosInstance = axios.create({
            baseURL,
            headers: {
                'X-API-TOKEN': apiKey,
                'Accept': 'application/json',
            },
            // Validate status to handle API errors gracefully
            validateStatus: (status) => status >= 200 && status < 300,
        });
    }

    /**
     * Fetches 15-minute meter readings and daily states.
     * Corresponds to GET /meter-readings
     */
    async getMeterReadings(params: GetMeterReadingsParams): Promise<GetMeterReadingsResponse> {
        try {
            // Manually construct the path, ensuring /v1/ is present
            const basePath = this.axiosInstance.defaults.baseURL?.replace(/\/$/, '') || ''; // Remove trailing slash if exists
            const fullPath = `${basePath}/meter-readings`;
            const url = new URL(fullPath);

            const searchParams = new URLSearchParams();
            // Check if params exist before iterating
            if (params) {
                for (const [key, value] of Object.entries(params)) {
                    if (value !== undefined && value !== null) {
                        // Handle array values for 'option' if necessary, based on actual type definition
                        if (key === 'option' && Array.isArray(value)) {
                            value.forEach(opt => searchParams.append(key, String(opt)));
                        } else {
                            searchParams.append(key, String(value));
                        }
                    }
                }
            }

            url.search = searchParams.toString();
            const fullUrlString = url.toString();

            const response = await this.axiosInstance.get<GetMeterReadingsResponse>(fullUrlString);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response && isApiError(error.response.data)) {
                    throw new Error(`API Error (${error.response.data.koda}): ${error.response.data.opis}`);
                }
            }
            // Re-throw original error if it's not a recognized API error or other type of error
            throw error;
        }
    }

    /**
     * Fetches details for a specific measuring point (Merilno Mesto).
     * Corresponds to GET /merilno-mesto/{identifikator}
     */
    async getMerilnoMesto(params: GetMerilnoMestoParams): Promise<GetMerilnoMestoResponse> {
         try {
            const response = await this.axiosInstance.get<GetMerilnoMestoResponse>(`/merilno-mesto/${params.identifikator}`);
            return response.data;
         } catch (error) {
            if (axios.isAxiosError(error) && error.response && isApiError(error.response.data)) {
                throw new Error(`API Error (${error.response.data.koda}): ${error.response.data.opis}`);
            }
            throw error;
        }
    }

    /**
     * Fetches contractual data for a specific metering point (Merilna Tocka).
     * Corresponds to GET /merilna-tocka/{gsrn}
     */
    async getMerilnaTocka(params: GetMerilnaTockaParams): Promise<GetMerilnaTockaResponse> {
         try {
            const response = await this.axiosInstance.get<GetMerilnaTockaResponse>(`/merilna-tocka/${params.gsrn}`);
            return response.data;
         } catch (error) {
            if (axios.isAxiosError(error) && error.response && isApiError(error.response.data)) {
                throw new Error(`API Error (${error.response.data.koda}): ${error.response.data.opis}`);
            }
            throw error;
        }
    }

    /**
     * Fetches the list of possible reading qualities.
     * Corresponds to GET /reading-qualities
     */
    async getReadingQualities(): Promise<GetReadingQualitiesResponse> {
         try {
            const response = await this.axiosInstance.get<GetReadingQualitiesResponse>('/reading-qualities');
            return response.data;
         } catch (error) {
            if (axios.isAxiosError(error) && error.response && isApiError(error.response.data)) {
                throw new Error(`API Error (${error.response.data.koda}): ${error.response.data.opis}`);
            }
            throw error;
        }
    }

    /**
     * Fetches the list of possible reading types.
     * Corresponds to GET /reading-type
     */
    async getReadingTypes(): Promise<GetReadingTypesResponse> {
         try {
            const response = await this.axiosInstance.get<GetReadingTypesResponse>('/reading-type');
            return response.data;
         } catch (error) {
            if (axios.isAxiosError(error) && error.response && isApiError(error.response.data)) {
                throw new Error(`API Error (${error.response.data.koda}): ${error.response.data.opis}`);
            }
            throw error;
        }
    }
}

// Example Usage (you would typically do this in your application code):
/*
import { MojElektroClient } from './mojelektroClient';
import dotenv from 'dotenv';

dotenv.config(); // Load .env file

const apiKey = process.env.MOJ_ELEKTRO_API_KEY;

if (!apiKey) {
  console.error("Error: MOJ_ELEKTRO_API_KEY not found in environment variables.");
  process.exit(1);
}

const client = new MojElektroClient(apiKey, 'production'); // Or 'test'

async function fetchData() {
  try {
    console.log('Fetching reading types...');
    const readingTypes = await client.getReadingTypes();
    console.log('Reading Types:', JSON.stringify(readingTypes, null, 2));

    // Add more calls as needed, e.g.:
    // const meterReadings = await client.getMeterReadings({ usagePoint: 'YOUR_GSRN', startTime: '2023-01-01', endTime: '2023-01-02' });
    // console.log('Meter Readings:', meterReadings);

  } catch (error) {
    console.error('Failed to fetch data:', error);
  }
}

fetchData();
*/ 