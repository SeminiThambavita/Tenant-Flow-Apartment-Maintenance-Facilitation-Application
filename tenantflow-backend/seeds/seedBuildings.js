import "dotenv/config";
import connectDB from "../config/db.js";
import Building from "../models/Building.js";
import User from "../models/User.js";

const seedDatabase = async () => {
  try {
    await connectDB();
    console.log("✓ Connected to database");

    // Create property managers (admin users)
    const managers = [];
    const managerData = [
      {
        name: "Rajesh Kumar",
        email: "rajesh.kumar@propertymanagement.com",
        phone: "0771234567",
        role: "admin"
      },
      {
        name: "Priya Sharma",
        email: "priya.sharma@propertymanagement.com",
        phone: "0772345678",
        role: "admin"
      },
      {
        name: "Anil Perera",
        email: "anil.perera@propertymanagement.com",
        phone: "0773456789",
        role: "admin"
      }
    ];

    for (const data of managerData) {
      let manager = await User.findOne({ email: data.email });
      if (!manager) {
        // Don't hash here - let the User model pre-save hook handle it
        manager = await User.create({
          ...data,
          password: "password123", // Will be hashed by User model pre-save hook
          status: "approved",
          buildings: []
        });
        console.log(`✓ Created property manager: ${manager.name}`);
      } else {
        console.log(`~ Property manager already exists: ${manager.name}`);
      }
      managers.push(manager._id);
    }

    // Reset only seeded managers' building assignments before re-linking
    await User.updateMany(
      { _id: { $in: managers } },
      { $set: { buildings: [] } }
    );
    console.log("✓ Reset seeded property manager building assignments");

    // Building data with floors and units
    const buildingsData = [
      {
        name: "Emerald Towers",
        address: "123 Main Street",
        city: "Colombo",
        zipCode: "00100",
        totalFloors: 5,
        propertyManager: managers[0], // Rajesh Kumar
        floors: [
          {
            floorNumber: 1,
            units: [
              { unitNumber: "101" },
              { unitNumber: "102" },
              { unitNumber: "103" }
            ]
          },
          {
            floorNumber: 2,
            units: [
              { unitNumber: "201" },
              { unitNumber: "202" },
              { unitNumber: "203" }
            ]
          },
          {
            floorNumber: 3,
            units: [
              { unitNumber: "301" },
              { unitNumber: "302" },
              { unitNumber: "303" }
            ]
          },
          {
            floorNumber: 4,
            units: [
              { unitNumber: "401" },
              { unitNumber: "402" },
              { unitNumber: "403" }
            ]
          },
          {
            floorNumber: 5,
            units: [
              { unitNumber: "501" },
              { unitNumber: "502" },
              { unitNumber: "503" }
            ]
          }
        ]
      },
      {
        name: "Golden Heights",
        address: "456 Park Avenue",
        city: "Colombo",
        zipCode: "00200",
        totalFloors: 4,
        propertyManager: managers[1], // Priya Sharma
        floors: [
          {
            floorNumber: 1,
            units: [
              { unitNumber: "101" },
              { unitNumber: "102" },
              { unitNumber: "103" },
              { unitNumber: "104" }
            ]
          },
          {
            floorNumber: 2,
            units: [
              { unitNumber: "201" },
              { unitNumber: "202" },
              { unitNumber: "203" },
              { unitNumber: "204" }
            ]
          },
          {
            floorNumber: 3,
            units: [
              { unitNumber: "301" },
              { unitNumber: "302" },
              { unitNumber: "303" },
              { unitNumber: "304" }
            ]
          },
          {
            floorNumber: 4,
            units: [
              { unitNumber: "401" },
              { unitNumber: "402" },
              { unitNumber: "403" },
              { unitNumber: "404" }
            ]
          }
        ]
      },
      {
        name: "Silver Springs",
        address: "789 Garden Road",
        city: "Kandy",
        zipCode: "20100",
        totalFloors: 3,
        propertyManager: managers[2], // Anil Perera
        floors: [
          {
            floorNumber: 1,
            units: [
              { unitNumber: "101" },
              { unitNumber: "102" }
            ]
          },
          {
            floorNumber: 2,
            units: [
              { unitNumber: "201" },
              { unitNumber: "202" }
            ]
          },
          {
            floorNumber: 3,
            units: [
              { unitNumber: "301" },
              { unitNumber: "302" }
            ]
          }
        ]
      },
      {
        name: "Crystal Plaza",
        address: "321 Business Street",
        city: "Colombo",
        zipCode: "00300",
        totalFloors: 6,
        propertyManager: managers[0], // Rajesh Kumar (manages 2 buildings)
        floors: [
          {
            floorNumber: 1,
            units: [
              { unitNumber: "101" },
              { unitNumber: "102" },
              { unitNumber: "103" },
              { unitNumber: "104" },
              { unitNumber: "105" }
            ]
          },
          {
            floorNumber: 2,
            units: [
              { unitNumber: "201" },
              { unitNumber: "202" },
              { unitNumber: "203" },
              { unitNumber: "204" },
              { unitNumber: "205" }
            ]
          },
          {
            floorNumber: 3,
            units: [
              { unitNumber: "301" },
              { unitNumber: "302" },
              { unitNumber: "303" },
              { unitNumber: "304" },
              { unitNumber: "305" }
            ]
          },
          {
            floorNumber: 4,
            units: [
              { unitNumber: "401" },
              { unitNumber: "402" },
              { unitNumber: "403" },
              { unitNumber: "404" },
              { unitNumber: "405" }
            ]
          },
          {
            floorNumber: 5,
            units: [
              { unitNumber: "501" },
              { unitNumber: "502" },
              { unitNumber: "503" },
              { unitNumber: "504" },
              { unitNumber: "505" }
            ]
          },
          {
            floorNumber: 6,
            units: [
              { unitNumber: "601" },
              { unitNumber: "602" },
              { unitNumber: "603" },
              { unitNumber: "604" },
              { unitNumber: "605" }
            ]
          }
        ]
      }
    ];

    // Upsert buildings and assign managers.
    // This keeps existing building _id values stable and prevents breaking tenant building references.
    const createdBuildings = [];
    let createdCount = 0;
    let updatedCount = 0;
    for (const buildingData of buildingsData) {
      const { propertyManager, floors, ...rest } = buildingData;

      // Format floors and units
      const formattedFloors = floors.map(floor => ({
        floorNumber: floor.floorNumber,
        units: floor.units.map(unit => ({
          unitNumber: unit.unitNumber,
          occupied: false,
          occupiedBy: null,
          occupiedAt: null
        }))
      }));

      const existing = await Building.findOne({ name: rest.name, city: rest.city });
      const building = await Building.findOneAndUpdate(
        { name: rest.name, city: rest.city },
        {
          $set: {
            ...rest,
            floors: formattedFloors,
            propertyManagers: [propertyManager],
            isActive: true
          }
        },
        { new: true, upsert: true }
      );

      // Update property manager with this building
      await User.findByIdAndUpdate(
        propertyManager,
        { $addToSet: { buildings: building._id } },
        { new: true }
      );

      createdBuildings.push(building);
      if (existing) {
        updatedCount += 1;
        console.log(`~ Updated building: ${building.name}`);
      } else {
        createdCount += 1;
        console.log(`✓ Created building: ${building.name}`);
      }
    }

    // Summary
    console.log("\n====== SEEDING SUMMARY ======");
    console.log(`✓ Created ${managers.length} property managers`);
    console.log(`✓ Buildings upserted: ${createdBuildings.length}`);
    console.log(`  - Created: ${createdCount}`);
    console.log(`  - Updated: ${updatedCount}`);
    
    let totalUnits = 0;
    createdBuildings.forEach(b => {
      const unitCount = b.floors.reduce((sum, f) => sum + f.units.length, 0);
      totalUnits += unitCount;
      console.log(`  - ${b.name}: ${b.totalFloors} floors, ${unitCount} units`);
    });
    console.log(`✓ Total units: ${totalUnits}`);
    console.log("\n✓ Database seeding completed successfully!");

    process.exit(0);
  } catch (error) {
    console.error("✗ Seeding failed:", error.message);
    process.exit(1);
  }
};

seedDatabase();
