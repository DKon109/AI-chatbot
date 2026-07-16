# Google Maps API Setup Guide

This guide will help you set up Google Maps API integration for the pharmacy finder feature.

## Prerequisites

- Google Cloud Platform account
- Billing enabled on your Google Cloud project
- Domain name or localhost for testing

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Note your project ID

## Step 2: Enable Required APIs

Enable these APIs in your Google Cloud project:

1. **Maps JavaScript API**
   - Go to "APIs & Services" > "Library"
   - Search for "Maps JavaScript API"
   - Click "Enable"

2. **Places API**
   - Search for "Places API"
   - Click "Enable"

3. **Directions API** (optional, for navigation)
   - Search for "Directions API"
   - Click "Enable"

## Step 3: Create API Key

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy the generated API key
4. **IMPORTANT**: Click "Restrict Key" to secure it

## Step 4: Restrict API Key (Security)

1. Click on your API key to edit it
2. Under "Application restrictions":
   - Select "HTTP referrers (web sites)"
   - Add your domains:
     - `http://localhost:3000/*` (for development)
     - `https://yourdomain.com/*` (for production)
3. Under "API restrictions":
   - Select "Restrict key"
   - Choose only the APIs you enabled above
4. Save the restrictions

## Step 5: Update Code

1. Open `frontend/src/components/GoogleMapsPharmacyFinder.tsx`
2. Add the browser-restricted key to `frontend/.env`:

```env
VITE_GOOGLE_MAPS_API_KEY=your_browser_restricted_key
```

## Step 6: Test the Integration

1. Start your development server: `npm start`
2. Navigate to the "Prescriptions" tab
3. Allow location access when prompted
4. You should see:
   - Interactive Google Map
   - Your current location marker
   - Nearby pharmacy markers
   - Pharmacy list with details

## Features Included

✅ **Geolocation**: Requests user's current location  
✅ **Interactive Map**: Google Maps with custom markers  
✅ **Places Search**: Finds pharmacies within 2km radius  
✅ **Real-time Data**: Pharmacy hours, ratings, phone numbers  
✅ **Directions**: Opens Google Maps for navigation  
✅ **Call Integration**: Direct phone calls to pharmacies  
✅ **Error Handling**: Graceful fallbacks for denied location  
✅ **Retry Functionality**: "Retry Location" button  
✅ **Responsive Design**: Works on mobile and desktop  

## Security Best Practices

1. **Never commit API keys to version control**
2. **Use environment variables in production**
3. **Restrict API key by HTTP referrer**
4. **Monitor API usage in Google Cloud Console**
5. **Set up billing alerts**

## Environment Variables (Production)

For production, use environment variables:

```bash
# .env
REACT_APP_GOOGLE_MAPS_API_KEY=your_api_key_here
```

Then update the code:

```typescript
const YOUR_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY';
```

## Troubleshooting

### "This page can't load Google Maps correctly"
- Check if API key is correct
- Verify APIs are enabled
- Check API key restrictions

### "Geolocation error"
- Ensure site is served over HTTPS (or localhost)
- Check browser permissions
- Fallback to Sydney CBD works

### "No pharmacies found"
- Check if Places API is enabled
- Verify API key has Places API access
- Try different location

### "API key not valid"
- Regenerate API key
- Check restrictions
- Verify billing is enabled

## Cost Considerations

- **Maps JavaScript API**: $7 per 1,000 loads
- **Places API**: $17 per 1,000 requests
- **Directions API**: $5 per 1,000 requests

For development, you get $200 free credit monthly.

## Support

- [Google Maps Platform Documentation](https://developers.google.com/maps/documentation)
- [Places API Documentation](https://developers.google.com/maps/documentation/places/web-service)
- [Google Cloud Support](https://cloud.google.com/support)
