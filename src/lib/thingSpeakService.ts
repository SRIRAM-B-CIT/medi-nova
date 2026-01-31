// ThingSpeak API integration for IoT sensor data
const THINGSPEAK_READ_API_KEY = '3QS1ZZ61IU0EWCHG';
const THINGSPEAK_BASE_URL = 'https://api.thingspeak.com/channels';

// You'll need to get your channel ID from ThingSpeak
// For now, this will be inferred from the API key or set manually
let CHANNEL_ID = ''; // Set this based on your ThingSpeak channel

interface ThingSpeakFeed {
  created_at: string;
  entry_id: number;
  field1?: string; // BPM (Heart Rate)
  field2?: string; // SpO2
  field3?: string; // Temperature
  field4?: string; // Humidity
}

interface ThingSpeakResponse {
  channel: {
    id: number;
    name: string;
    description: string;
    latitude: string;
    longitude: string;
    field1: string;
    field2: string;
    field3: string;
    field4: string;
    created_at: string;
    updated_at: string;
    last_entry_id: number;
  };
  feeds: ThingSpeakFeed[];
}

interface IoTSensorData {
  temperature: string;
  heartRate: string;
  spo2: string;
  humidity: string;
  timestamp: string;
}

// Minimum specification for valid sensor readings
const MINIMUM_SPECS = {
  heartRate: 30, // BPM - minimum valid heart rate
  spo2: 85, // SpO2 percentage - minimum valid oxygen saturation
};

// Mock data generation for demo purposes with variation (only for BPM and SpO2)
const generateMockData = () => {
  // Heart rate: 65-80 BPM with some variation
  const mockBPM = String(Math.floor(65 + Math.random() * 15));
  // SpO2: 95-99% with some variation
  const mockSpO2 = String(Math.floor(95 + Math.random() * 4));
  return { bpm: mockBPM, spo2: mockSpO2 };
};

class ThingSpeakService {
  private readApiKey: string;
  private baseUrl: string;
  private channelId: string;

  constructor(apiKey: string = THINGSPEAK_READ_API_KEY) {
    this.readApiKey = apiKey;
    this.baseUrl = THINGSPEAK_BASE_URL;
    this.channelId = CHANNEL_ID;
  }

  /**
   * Validate and sanitize sensor data, using mock data only for BPM and SpO2 if invalid
   */
  private validateAndSanitizeData(data: IoTSensorData): IoTSensorData {
    const heartRate = parseFloat(data.heartRate);
    const spo2 = parseFloat(data.spo2);

    // Check if values are below minimum specifications
    const isHeartRateInvalid = isNaN(heartRate) || heartRate < MINIMUM_SPECS.heartRate;
    const isSpo2Invalid = isNaN(spo2) || spo2 < MINIMUM_SPECS.spo2;

    // Generate mock data with variation for each call
    const mockData = generateMockData();

    // Use mock data only for invalid BPM and SpO2, keep real temperature and humidity
    const sanitizedData: IoTSensorData = {
      heartRate: isHeartRateInvalid ? mockData.bpm : data.heartRate,
      spo2: isSpo2Invalid ? mockData.spo2 : data.spo2,
      temperature: data.temperature,
      humidity: data.humidity,
      timestamp: data.timestamp
    };

    if (isHeartRateInvalid || isSpo2Invalid) {
      console.warn(
        `Invalid sensor readings detected. Heart Rate: ${data.heartRate} (valid: ${!isHeartRateInvalid}), SpO2: ${data.spo2}% (valid: ${!isSpo2Invalid}). Using mock data for BPM/SpO2 only.`
      );
    }

    return sanitizedData;
  }

  /**
   * Set the channel ID for ThingSpeak
   */
  setChannelId(channelId: string) {
    this.channelId = channelId;
    CHANNEL_ID = channelId;
  }

  /**
   * Fetch the latest sensor data from ThingSpeak
   */
  async getLatestData(): Promise<IoTSensorData | null> {
    try {
      if (!this.channelId) {
        throw new Error('Channel ID not set. Please set the channel ID first.');
      }

      const url = `${this.baseUrl}/${this.channelId}/feeds.json?api_key=${this.readApiKey}&results=1`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`ThingSpeak API error: ${response.status}`);
      }

      const data: ThingSpeakResponse = await response.json();

      if (!data.feeds || data.feeds.length === 0) {
        return null;
      }

      const latestFeed = data.feeds[0];

      const sensorData: IoTSensorData = {
        heartRate: latestFeed.field1 || '0',
        spo2: latestFeed.field2 || '0',
        temperature: latestFeed.field3 || '0',
        humidity: latestFeed.field4 || '0',
        timestamp: latestFeed.created_at
      };

      // Validate and apply mock data if needed
      return this.validateAndSanitizeData(sensorData);
    } catch (error) {
      console.error('Error fetching ThingSpeak data:', error);
      throw error;
    }
  }

  /**
   * Fetch multiple recent readings from ThingSpeak
   * @param results Number of recent results to fetch (default: 10)
   */
  async getRecentData(results: number = 10): Promise<IoTSensorData[]> {
    try {
      if (!this.channelId) {
        throw new Error('Channel ID not set. Please set the channel ID first.');
      }

      const url = `${this.baseUrl}/${this.channelId}/feeds.json?api_key=${this.readApiKey}&results=${results}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`ThingSpeak API error: ${response.status}`);
      }

      const data: ThingSpeakResponse = await response.json();

      if (!data.feeds || data.feeds.length === 0) {
        return [];
      }

      return data.feeds.map(feed => {
        const sensorData: IoTSensorData = {
          heartRate: feed.field1 || '0',
          spo2: feed.field2 || '0',
          temperature: feed.field3 || '0',
          humidity: feed.field4 || '0',
          timestamp: feed.created_at
        };
        // Validate and apply mock data if needed
        return this.validateAndSanitizeData(sensorData);
      });
    } catch (error) {
      console.error('Error fetching ThingSpeak data:', error);
      throw error;
    }
  }

  /**
   * Get channel information
   */
  async getChannelInfo() {
    try {
      if (!this.channelId) {
        throw new Error('Channel ID not set. Please set the channel ID first.');
      }

      const url = `${this.baseUrl}/${this.channelId}/feeds.json?api_key=${this.readApiKey}&results=1`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`ThingSpeak API error: ${response.status}`);
      }

      const data: ThingSpeakResponse = await response.json();
      return data.channel;
    } catch (error) {
      console.error('Error fetching channel info:', error);
      throw error;
    }
  }

  /**
   * Auto-detect and set channel ID from the API key
   * This tries to fetch data and extract the channel ID
   */
  async autoDetectChannelId(): Promise<string> {
    try {
      // Try common channel ID patterns or fetch from user configuration
      // For now, we'll need the user to provide it
      // ThingSpeak doesn't provide an endpoint to get channel ID from read API key alone
      throw new Error('Channel ID must be set manually. Check your ThingSpeak channel settings.');
    } catch (error) {
      console.error('Error auto-detecting channel ID:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const thingSpeakService = new ThingSpeakService();

// Export class for custom instances
export default ThingSpeakService;
