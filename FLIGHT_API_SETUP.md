# Flight API Setup Guide

## Overview
The flight import feature uses AeroDataBox API via RapidAPI to fetch real-time flight information. This API provides 300-600 free API calls per month, which is sufficient for personal use.

## Setup Instructions

### Step 1: Create a RapidAPI Account
1. Go to [RapidAPI](https://rapidapi.com/auth/sign-up)
2. Sign up for a free account (you can use Google/GitHub for quick signup)
3. Verify your email address

### Step 2: Subscribe to AeroDataBox API
1. Visit the [AeroDataBox API page](https://rapidapi.com/aedbx-aedbx/api/aerodatabox)
2. Click on "Subscribe to Test" button
3. Select the "Basic" plan (Free - 300 requests/month)
4. Click "Subscribe" (no credit card required)

### Step 3: Get Your API Key
1. On the AeroDataBox API page, click on any endpoint in the left sidebar
2. Look for the "Code Snippets" section on the right
3. Find the `X-RapidAPI-Key` value in the headers
4. Copy this key

### Step 4: Configure Your Application
1. Open the `.env` file in your project root
2. Replace `your_rapidapi_key_here` with your actual API key:
   ```
   RAPIDAPI_KEY=your_actual_rapidapi_key_here
   ```
3. Save the file
4. Restart your Flask application

## Testing the Integration
1. Navigate to the "Add Flight" page
2. Click "Import Flight"
3. Enter a flight number (e.g., UA328, BA283, DL142)
4. Enter the flight date
5. Click "Search Flight"

If configured correctly, the flight details will be automatically populated.

## API Limits
- **Free Tier**: 300-600 requests per month
- **Rate Limit**: Check RapidAPI dashboard for current limits
- **Data Coverage**: Global flight data with real-time updates

## Troubleshooting

### Common Issues

1. **502 Bad Gateway Error**
   - Verify your API key is correctly set in `.env`
   - Check if you've exceeded your monthly API limit
   - Ensure you're subscribed to the AeroDataBox API on RapidAPI

2. **Flight Not Found**
   - Verify the flight number format (e.g., UA328)
   - Check if the date is correct (YYYY-MM-DD format)
   - Some smaller airlines may not be covered

3. **Rate Limit Exceeded**
   - Check your usage on the RapidAPI dashboard
   - Consider upgrading to a paid plan if needed

## Alternative APIs

If AeroDataBox doesn't meet your needs, consider these alternatives:

1. **FlightAware AeroAPI**: 500 calls/month free (personal use only)
2. **FlightLabs**: 7-day free trial, then paid
3. **OpenSky Network**: Free but doesn't support flight number lookup

## Support
For API-specific issues, contact RapidAPI support or check the AeroDataBox documentation.