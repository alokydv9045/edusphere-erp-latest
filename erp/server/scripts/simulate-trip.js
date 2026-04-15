const axios = require('axios');
require('dotenv').config();

const API_BASE = 'http://localhost:5000/api';
const DRIVER_EMAIL = 'driver1@demoschool.com';
const PASSWORD = 'School123!';

async function simulate() {
    console.log('🚀 Starting Transport Simulation...');

    try {
        // 1. Authenticate
        console.log('🔑 Authenticating as Driver...');
        const loginRes = await axios.post(`${API_BASE}/auth/login`, {
            email: DRIVER_EMAIL,
            password: PASSWORD
        });

        const token = loginRes.data.token;
        const authHeader = { headers: { Authorization: `Bearer ${token}` } };
        console.log('✅ Logged in successfully.');

        // 2. Get Driver Assignment
        console.log('📋 Fetching driver assignment...');
        const assignmentRes = await axios.get(`${API_BASE}/transport/driver/assignment`, authHeader);
        const { vehicle, route } = assignmentRes.data;

        if (!vehicle || !route) {
            console.error('❌ No vehicle or route assigned to this driver.');
            return;
        }
        console.log(`🚌 Vehicle: ${vehicle.name} (${vehicle.registrationNumber})`);
        console.log(`🗺️ Route: ${route.name}`);

        // 3. Start Trip
        console.log('🏁 Starting Trip...');
        const tripRes = await axios.post(`${API_BASE}/transport/trips/start`, {
            vehicleId: vehicle.id,
            routeId: route.id,
            type: 'PICKUP'
        }, authHeader);

        const tripId = tripRes.data.trip.id;
        console.log(`✅ Trip Started. ID: ${tripId}`);

        // 4. Simulate Movement along stops
        const stops = route.stops;
        console.log(`📍 Simulating movement through ${stops.length} stops...`);

        for (let i = 0; i < stops.length; i++) {
            const currentStop = stops[i];
            const nextStop = stops[i + 1];

            console.log(`🚍 Arrived at Stop: ${currentStop.name}`);
            
            // Move from currentStop to nextStop in 5 increments
            if (nextStop) {
                for (let step = 0; step < 5; step++) {
                    const lat = currentStop.latitude + (nextStop.latitude - currentStop.latitude) * (step / 5);
                    const lng = currentStop.longitude + (nextStop.longitude - currentStop.longitude) * (step / 5);
                    
                    console.log(`📡 Sending Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
                    await axios.post(`${API_BASE}/transport/trips/update-location`, {
                        tripId,
                        latitude: lat,
                        longitude: lng,
                        speed: 40 + Math.random() * 10
                    }, authHeader);

                    await new Promise(r => setTimeout(r, 3000)); // 3 seconds between updates
                }
            } else {
                // Final stop
                await axios.post(`${API_BASE}/transport/trips/update-location`, {
                    tripId,
                    latitude: currentStop.latitude,
                    longitude: currentStop.longitude,
                    speed: 0
                }, authHeader);
                console.log('🎌 Reached final destination.');
            }
        }

        // 5. End Trip
        console.log('🏁 Ending Trip...');
        await axios.post(`${API_BASE}/transport/trips/${tripId}/stop`, {}, authHeader);
        console.log('✅ Trip Completed.');

    } catch (error) {
        console.error('❌ Simulation Error:', error.response?.data || error.message);
    }
}

simulate();
