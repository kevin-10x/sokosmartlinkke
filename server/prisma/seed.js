const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Smart Soko database...');

  // 1. Seed Cities
  const citiesData = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'kenya-cities.json'), 'utf-8')
  );

  for (const city of citiesData) {
    await prisma.city.upsert({
      where: { name: city.name },
      update: {},
      create: {
        name: city.name,
        county: city.county,
        status: city.status,
        population: city.population,
        lat: city.lat,
        lng: city.lng,
      },
    });
  }
  console.log(`✅ Seeded ${citiesData.length} cities`);

  // 2. Seed Categories
  const categories = [
    { name: 'Market', slug: 'market', icon: 'store', color: '#e74c3c', sortOrder: 1 },
    { name: 'Shop', slug: 'shop', icon: 'shopping-bag', color: '#3498db', sortOrder: 2 },
    { name: 'Matatu Stage', slug: 'matatu-stage', icon: 'bus', color: '#27ae60', sortOrder: 3 },
    { name: 'Food & Restaurant', slug: 'food', icon: 'utensils', color: '#f39c12', sortOrder: 4 },
    { name: 'Service', slug: 'service', icon: 'wrench', color: '#9b59b6', sortOrder: 5 },
    { name: 'Health', slug: 'health', icon: 'heart-pulse', color: '#e91e63', sortOrder: 6 },
    { name: 'Education', slug: 'education', icon: 'graduation-cap', color: '#00bcd4', sortOrder: 7 },
    { name: 'Hardware', slug: 'hardware', icon: 'hammer', color: '#795548', sortOrder: 8 },
    { name: 'Electronics', slug: 'electronics', icon: 'smartphone', color: '#607d8b', sortOrder: 9 },
    { name: 'Beauty', slug: 'beauty', icon: 'sparkles', color: '#ff5722', sortOrder: 10 },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log(`✅ Seeded ${categories.length} categories`);

  // 3. Seed Sample Businesses (across multiple cities)
  const sampleBusinesses = [
    { name: "Gikomba Mitumba Market", lat: -1.2845, lng: 36.8456, city: "Nairobi", category: "market", address: "Gikomba, Nairobi", phone: "+254712345678", keywords: ["mitumba", "clothes", "wholesale"], desc: "Kenya's largest second-hand clothing market" },
    { name: "Marikiti Wet Market", lat: -1.2867, lng: 36.8219, city: "Nairobi", category: "market", address: "Moi Avenue, Nairobi", phone: "+254723456789", keywords: ["vegetables", "fruits", "fish", "meat"], desc: "Central fresh produce market" },
    { name: "Maasai Market Curios", lat: -1.2921, lng: 36.8219, city: "Nairobi", category: "market", address: "Kijabe Street, Nairobi", phone: "+254734567890", keywords: ["beads", "souvenirs", "handicrafts"], desc: "Authentic Maasai beadwork and wood carvings" },
    { name: "Mama Njoro's Salon", lat: -0.5217, lng: 39.6456, city: "Mombasa", category: "beauty", address: "Majengo, Mombasa", phone: "+254745678901", keywords: ["salon", "braiding", "manicure"], desc: "Professional hair and beauty services" },
    { name: "Kisumu Fish Market", lat: -0.0917, lng: 34.7680, city: "Kisumu", category: "market", address: "Lake Victoria, Kisumu", phone: "+254756789012", keywords: ["fish", "tilapia", "omena", "fresh"], desc: "Fresh lake fish direct from fishermen" },
    { name: "Eldoret Cereal Market", lat: 0.5200, lng: 35.2700, city: "Eldoret", category: "market", address: "Eldoret Town Centre", phone: "+254767890123", keywords: ["maize", "beans", "cereals", "grains"], desc: "Wholesale grain and cereal market" },
    { name: "Nakuru Veggie Market", lat: -0.3031, lng: 36.0800, city: "Nakuru", category: "market", address: "Nakuru Town Centre", phone: "+254778901234", keywords: ["vegetables", "potatoes", "cabbage"], desc: "Fresh farm produce from Rift Valley" },
    { name: "M-Pesa Agent — Baba Yusuf", lat: 3.1167, lng: 37.0000, city: "Lodwar", category: "service", address: "Lodwar Town Centre", phone: "+254789012345", keywords: ["mpesa", "money", "agent", "banking"], desc: "M-Pesa withdrawals, deposits, and airtime" },
    { name: "Kakamega Herbal Market", lat: 0.2827, lng: 34.7519, city: "Kakamega", category: "market", address: "Kakamega Town Centre", phone: "+254701234567", keywords: ["herbs", "medicine", "traditional"], desc: "Traditional herbal medicines and remedies" },
    { name: "Thika Machinery Market", lat: -1.0388, lng: 37.0834, city: "Thika", category: "hardware", address: "Thika Town Centre", phone: "+254712345679", keywords: ["machinery", "tools", "hardware"], desc: "Industrial machinery and farming tools" },
    { name: "Malindi Beach Curios", lat: -3.2176, lng: 40.1191, city: "Malindi", category: "market", address: "Malindi Beach Road", phone: "+254723456780", keywords: ["souvenirs", "beach", "shells"], desc: "Beachfront curio shops and souvenirs" },
    { name: "Kitale Agrovet", lat: 1.0157, lng: 35.0067, city: "Kitale", category: "service", address: "Kitale Town Centre", phone: "+254734567891", keywords: ["agrovet", "fertilizer", "seeds", "pesticides"], desc: "Agricultural supplies and veterinary products" },
    { name: "Meru Miraa Market", lat: 0.0463, lng: 37.6559, city: "Meru", category: "market", address: "Meru Town Centre", phone: "+254745678902", keywords: ["miraa", "khat", "stimulant"], desc: "Miraa trading and wholesale market" },
    { name: "Kericho Tea Market", lat: -0.3689, lng: 35.2863, city: "Kericho", category: "market", address: "Kericho Town Centre", phone: "+254756789013", keywords: ["tea", "leaves", "green"], desc: "Tea leaves and processed tea sales" },
    { name: "Kisii Soapstone Market", lat: -0.6773, lng: 34.7796, city: "Kisii", category: "market", address: "Kisii Town Centre", phone: "+254767890124", keywords: ["soapstone", "carvings", "art"], desc: "Hand-carved soapstone sculptures and art" },
  ];

  for (const biz of sampleBusinesses) {
    const cityRecord = await prisma.city.findFirst({ where: { name: biz.city } });
    const catRecord = await prisma.category.findFirst({ where: { slug: biz.category } });
    if (cityRecord && catRecord) {
      await prisma.business.create({
        data: {
          name: biz.name,
          slug: biz.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
          description: biz.desc,
          lat: biz.lat,
          lng: biz.lng,
          address: biz.address,
          county: cityRecord.county,
          cityId: cityRecord.id,
          categoryId: catRecord.id,
          keywords: biz.keywords,
          phonePrimary: biz.phone,
          status: 'active',
          isVerified: true,
          rating: +(Math.random() * 2 + 3).toFixed(1),
          reviewCount: Math.floor(Math.random() * 200) + 10,
          isOpenNow: Math.random() > 0.3,
          businessHours: JSON.stringify({
            monday: { open: "06:00", close: "18:00" },
            tuesday: { open: "06:00", close: "18:00" },
            wednesday: { open: "06:00", close: "18:00" },
            thursday: { open: "06:00", close: "18:00" },
            friday: { open: "06:00", close: "18:00" },
            saturday: { open: "07:00", close: "17:00" },
            sunday: { open: "08:00", close: "14:00" },
          }),
          photos: JSON.stringify([
            { url: `https://picsum.photos/400/300?random=${biz.name.length}`, caption: "Exterior" },
            { url: `https://picsum.photos/400/300?random=${biz.name.length + 1}`, caption: "Interior" },
          ]),
        },
      });
    }
  }
  console.log(`✅ Seeded ${sampleBusinesses.length} sample businesses`);

  // 4. Seed Matatu Stages
  const matatuStages = [
    { name: "Kenyatta Hospital Stage", lat: -1.3012, lng: 36.8065, city: "Nairobi", commonNames: ["KNH Stage"], type: "stage", facilities: { shelter: true, lighting: true, security: true }, address: "Kenyatta Hospital, Nairobi" },
    { name: "Odeon Cinema Stage", lat: -1.2833, lng: 36.8219, city: "Nairobi", commonNames: ["Odeon"], type: "terminal", facilities: { shelter: true, lighting: true, security: true, toilet: true }, address: "Odeon, Nairobi CBD" },
    { name: "Ambassadeur Stage", lat: -1.2833, lng: 36.8333, city: "Nairobi", commonNames: ["Ambassadeur"], type: "stage", facilities: { shelter: true, lighting: true }, address: "Ambassadeur, Nairobi" },
    { name: "Koja Stage", lat: -1.2833, lng: 36.8167, city: "Nairobi", commonNames: ["Koja"], type: "stage", facilities: { shelter: true }, address: "Koja, Nairobi" },
    { name: "Muthurwa Stage", lat: -1.2833, lng: 36.8500, city: "Nairobi", commonNames: ["Muthurwa"], type: "terminal", facilities: { shelter: true, lighting: true, security: true }, address: "Muthurwa, Nairobi" },
    { name: "Mombasa CBD Stage", lat: -4.0435, lng: 39.6682, city: "Mombasa", commonNames: ["Mombasa Terminal"], type: "terminal", facilities: { shelter: true, lighting: true, security: true, toilet: true }, address: "Mombasa CBD" },
    { name: "Kisumu Bus Park", lat: -0.1022, lng: 34.7617, city: "Kisumu", commonNames: ["Kisumu Stage"], type: "terminal", facilities: { shelter: true, lighting: true, security: true }, address: "Kisumu Town Centre" },
    { name: "Nakuru Stage", lat: -0.3031, lng: 36.0800, city: "Nakuru", commonNames: ["Nakuru Terminal"], type: "terminal", facilities: { shelter: true, lighting: true }, address: "Nakuru Town Centre" },
    { name: "Eldoret Stage", lat: 0.5143, lng: 35.2698, city: "Eldoret", commonNames: ["Eldoret Terminal"], type: "terminal", facilities: { shelter: true, lighting: true, security: true }, address: "Eldoret Town Centre" },
  ];

  for (const stage of matatuStages) {
    const cityRecord = await prisma.city.findFirst({ where: { name: stage.city } });
    if (cityRecord) {
      await prisma.matatuStage.create({
        data: {
          name: stage.name,
          commonNames: stage.commonNames,
          lat: stage.lat,
          lng: stage.lng,
          address: stage.address,
          county: cityRecord.county,
          cityId: cityRecord.id,
          stageType: stage.type,
          facilities: JSON.stringify(stage.facilities),
          safetyRating: +(Math.random() * 2 + 3).toFixed(1),
          crowdLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
          operatingHours: "05:00-23:00",
          isActive: true,
        },
      });
    }
  }
  console.log(`✅ Seeded ${matatuStages.length} matatu stages`);

  // 5. Seed Matatu Routes
  const stageRecords = await prisma.matatuStage.findMany();
  const routes = [
    { stage: "Kenyatta Hospital Stage", number: "4W", destination: "Westlands", sacco: "KBS", fare: 80 },
    { stage: "Kenyatta Hospital Stage", number: "46", destination: "Yaya Centre", sacco: "City Hoppa", fare: 50 },
    { stage: "Odeon Cinema Stage", number: "11", destination: "Kibra", sacco: "KBS", fare: 40 },
    { stage: "Odeon Cinema Stage", number: "15", destination: "Langata", sacco: "City Hoppa", fare: 60 },
    { stage: "Ambassadeur Stage", number: "9", destination: "Eastleigh", sacco: "Forward", fare: 50 },
    { stage: "Ambassadeur Stage", number: "14", destination: "Buruburu", sacco: "City Hoppa", fare: 60 },
    { stage: "Koja Stage", number: "17", destination: "Thika Road", sacco: "KBS", fare: 50 },
    { stage: "Muthurwa Stage", number: "32", destination: "Kasarani", sacco: "KBS", fare: 60 },
    { stage: "Mombasa CBD Stage", number: "M1", destination: "Nyali", sacco: "Mombasa Raha", fare: 50 },
    { stage: "Kisumu Bus Park", number: "K1", destination: "Ahero", sacco: "Kisumu Sacco", fare: 100 },
  ];

  for (const route of routes) {
    const stage = stageRecords.find(s => s.name === route.stage);
    if (stage) {
      await prisma.matatuRoute.create({
        data: {
          routeNumber: route.number,
          saccoName: route.sacco,
          originStageId: stage.id,
          destination: route.destination,
          estimatedFare: route.fare,
          estimatedDuration: Math.floor(Math.random() * 30) + 15,
          operatingHours: "05:00-23:00",
          frequency: "every_10_min",
        },
      });
    }
  }
  console.log(`✅ Seeded ${routes.length} matatu routes`);

  console.log('\n🎉 Database seeded successfully!');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
