const mongoose = require('mongoose');
const Court = require('../models/Court');

const sampleCourts = [
  {
    name: 'Court A - Indoor',
    type: 'indoor',
    location: 'Building 1, Ground Floor',
    capacity: 10,
    hourlyRate: 50,
    available: true,
    maintenanceMode: false,
    features: ['LED Lighting', 'Air Conditioning', 'Scoreboard', 'Wood Floor'],
    description: 'Premium indoor court with professional lighting and climate control',
    imageUrl: 'https://example.com/court-a.jpg'
  },
  {
    name: 'Court B - Outdoor',
    type: 'outdoor',
    location: 'Sports Complex, Field 1',
    capacity: 12,
    hourlyRate: 40,
    available: true,
    maintenanceMode: false,
    features: ['Flood Lights', 'Covered Area', 'Bleachers', 'Artificial Turf'],
    description: 'Spacious outdoor court with covered seating area',
    imageUrl: 'https://example.com/court-b.jpg'
  },
  {
    name: 'Court C - Indoor',
    type: 'indoor',
    location: 'Building 2, First Floor',
    capacity: 8,
    hourlyRate: 45,
    available: true,
    maintenanceMode: false,
    features: ['LED Lighting', 'Air Conditioning', 'Sound System', 'Wood Floor'],
    description: 'Cozy indoor court perfect for small groups',
    imageUrl: 'https://example.com/court-c.jpg'
  },
  {
    name: 'Court D - Rooftop',
    type: 'outdoor',
    location: 'Rooftop Sports Area',
    capacity: 10,
    hourlyRate: 60,
    available: true,
    maintenanceMode: false,
    features: ['Panoramic View', 'Flood Lights', 'Premium Surface', 'Wind Barriers'],
    description: 'Exclusive rooftop court with stunning city views',
    imageUrl: 'https://example.com/court-d.jpg'
  }
];

const seedCourts = async () => {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mydatabase';
    await mongoose.connect(mongoURI);
    
    console.log('Connected to MongoDB');
    
    // Clear existing courts
    await Court.deleteMany({});
    console.log('Cleared existing courts');
    
    // Insert sample courts
    const courts = await Court.insertMany(sampleCourts);
    console.log(`Created ${courts.length} courts:`);
    courts.forEach(court => {
      console.log(`- ${court.name} (${court.type}) - $${court.hourlyRate}/hour`);
    });
    
    console.log('Court seeding completed successfully!');
    
  } catch (error) {
    console.error('Error seeding courts:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the seeder
if (require.main === module) {
  seedCourts();
}

module.exports = seedCourts;
