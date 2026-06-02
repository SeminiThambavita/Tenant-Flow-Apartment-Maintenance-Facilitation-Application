import Building from "../models/Building.js";
import User from "../models/User.js";

// Get all buildings
export const getBuildings = async (req, res) => {
  try {
    const buildings = await Building.find({ isActive: true })
      .populate("propertyManagers", "name email phone")
      .sort({ name: 1 });
    
    return res.json({ buildings });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch buildings", error: error.message });
  }
};

// Get building by ID
export const getBuildingById = async (req, res) => {
  try {
    const building = await Building.findById(req.params.id)
      .populate("propertyManagers", "name email phone");
    
    if (!building) {
      return res.status(404).json({ message: "Building not found" });
    }

    return res.json({ building });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch building", error: error.message });
  }
};

// Get available units for a building (not occupied)
export const getAvailableUnits = async (req, res) => {
  try {
    const { buildingId } = req.params;
    const building = await Building.findById(buildingId);

    if (!building) {
      return res.status(404).json({ message: "Building not found" });
    }

    const availableUnits = [];
    
    building.floors.forEach(floor => {
      floor.units.forEach(unit => {
        if (!unit.occupied) {
          availableUnits.push({
            floorNumber: floor.floorNumber,
            unitNumber: unit.unitNumber,
            available: true
          });
        }
      });
    });

    return res.json({ availableUnits });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch available units", error: error.message });
  }
};

// Check if a specific unit is available
export const checkUnitAvailability = async (req, res) => {
  try {
    const { buildingId, floorNumber, unitNumber } = req.body;

    if (!buildingId || !floorNumber || !unitNumber) {
      return res.status(400).json({ message: "Building ID, floor number, and unit number are required" });
    }

    const building = await Building.findById(buildingId);
    if (!building) {
      return res.status(404).json({ message: "Building not found" });
    }

    const floor = building.floors.find(f => f.floorNumber === floorNumber);
    if (!floor) {
      return res.status(404).json({ message: "Floor not found in this building" });
    }

    const unit = floor.units.find(u => u.unitNumber === unitNumber);
    if (!unit) {
      return res.status(404).json({ message: "Unit not found on this floor" });
    }

    if (unit.occupied) {
      return res.status(409).json({ 
        message: "This unit is already occupied. Please select a different unit.",
        available: false 
      });
    }

    return res.json({ 
      message: "Unit is available",
      available: true,
      unit: {
        floorNumber,
        unitNumber,
        occupied: unit.occupied
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to check unit availability", error: error.message });
  }
};

// Mark unit as occupied (called when tenant registers)
export const occupyUnit = async (req, res) => {
  try {
    const { buildingId, floorNumber, unitNumber, tenantId } = req.body;

    if (!buildingId || !floorNumber || !unitNumber || !tenantId) {
      return res.status(400).json({ message: "All parameters are required" });
    }

    const building = await Building.findById(buildingId);
    if (!building) {
      return res.status(404).json({ message: "Building not found" });
    }

    const floor = building.floors.find(f => f.floorNumber === floorNumber);
    if (!floor) {
      return res.status(404).json({ message: "Floor not found" });
    }

    const unit = floor.units.find(u => u.unitNumber === unitNumber);
    if (!unit) {
      return res.status(404).json({ message: "Unit not found" });
    }

    if (unit.occupied) {
      return res.status(409).json({ message: "This unit is already occupied" });
    }

    unit.occupied = true;
    unit.occupiedBy = tenantId;
    unit.occupiedAt = new Date();

    await building.save();

    return res.json({ 
      message: "Unit marked as occupied",
      unit 
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to occupy unit", error: error.message });
  }
};

// Release unit (called when tenant moves out)
export const releaseUnit = async (req, res) => {
  try {
    const { buildingId, floorNumber, unitNumber } = req.body;

    if (!buildingId || !floorNumber || !unitNumber) {
      return res.status(400).json({ message: "All parameters are required" });
    }

    const building = await Building.findById(buildingId);
    if (!building) {
      return res.status(404).json({ message: "Building not found" });
    }

    const floor = building.floors.find(f => f.floorNumber === floorNumber);
    if (!floor) {
      return res.status(404).json({ message: "Floor not found" });
    }

    const unit = floor.units.find(u => u.unitNumber === unitNumber);
    if (!unit) {
      return res.status(404).json({ message: "Unit not found" });
    }

    unit.occupied = false;
    unit.occupiedBy = null;
    unit.occupiedAt = null;

    await building.save();

    return res.json({ 
      message: "Unit released successfully",
      unit 
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to release unit", error: error.message });
  }
};

// Create building (admin only)
export const createBuilding = async (req, res) => {
  try {
    const { name, address, city, zipCode, totalFloors, floors, propertyManagerIds } = req.body;

    if (!name || !address || !city || !totalFloors || !floors || !Array.isArray(floors)) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Validate that property managers exist and are admin role
    let managers = [];
    if (propertyManagerIds && Array.isArray(propertyManagerIds)) {
      managers = await User.find({ 
        _id: { $in: propertyManagerIds },
        role: "admin"
      });
      
      if (managers.length !== propertyManagerIds.length) {
        return res.status(400).json({ message: "Invalid property manager IDs" });
      }
    }

    const building = await Building.create({
      name,
      address,
      city,
      zipCode,
      totalFloors,
      floors,
      propertyManagers: managers.map(m => m._id)
    });

    // Update users with the new building
    if (managers.length > 0) {
      await User.updateMany(
        { _id: { $in: managers.map(m => m._id) } },
        { $addToSet: { buildings: building._id } }
      );
    }

    await building.populate("propertyManagers", "name email phone");

    return res.status(201).json({ 
      message: "Building created successfully",
      building 
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create building", error: error.message });
  }
};

// Assign property manager to building
export const assignPropertyManager = async (req, res) => {
  try {
    const { buildingId, propertyManagerId } = req.body;

    if (!buildingId || !propertyManagerId) {
      return res.status(400).json({ message: "Building ID and property manager ID are required" });
    }

    const building = await Building.findById(buildingId);
    if (!building) {
      return res.status(404).json({ message: "Building not found" });
    }

    const manager = await User.findOne({ 
      _id: propertyManagerId,
      role: "admin"
    });
    
    if (!manager) {
      return res.status(404).json({ message: "Property manager not found" });
    }

    // Add building to property managers array if not already there
    if (!building.propertyManagers.includes(propertyManagerId)) {
      building.propertyManagers.push(propertyManagerId);
      await building.save();
    }

    // Add building to property manager's buildings array if not already there
    if (!manager.buildings.includes(buildingId)) {
      manager.buildings.push(buildingId);
      await manager.save();
    }

    await building.populate("propertyManagers", "name email phone");

    return res.json({ 
      message: "Property manager assigned to building",
      building 
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to assign property manager", error: error.message });
  }
};

// Get buildings managed by current property manager
export const getMyBuildings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Only property managers can access this" });
    }

    const buildings = await Building.find({ _id: { $in: user.buildings } })
      .populate("propertyManagers", "name email phone")
      .sort({ name: 1 });

    return res.json({ buildings });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch your buildings", error: error.message });
  }
};

// Seed buildings (demo data) - admin only
export const seedBuildings = async (req, res) => {
  try {
    // Check if buildings already exist
    const existingCount = await Building.countDocuments();
    if (existingCount > 0) {
      return res.status(400).json({ message: "Buildings already exist in the system" });
    }

    const seedData = [
      {
        name: "Emerald Towers",
        address: "123 Main Street",
        city: "Colombo",
        zipCode: "00100",
        totalFloors: 5,
        floors: [
          {
            floorNumber: 1,
            units: [
              { unitNumber: "101", occupied: false },
              { unitNumber: "102", occupied: false },
              { unitNumber: "103", occupied: false },
              { unitNumber: "104", occupied: false }
            ]
          },
          {
            floorNumber: 2,
            units: [
              { unitNumber: "201", occupied: false },
              { unitNumber: "202", occupied: false },
              { unitNumber: "203", occupied: false }
            ]
          },
          {
            floorNumber: 3,
            units: [
              { unitNumber: "301", occupied: false },
              { unitNumber: "302", occupied: false },
              { unitNumber: "303", occupied: false }
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
        floors: [
          {
            floorNumber: 1,
            units: [
              { unitNumber: "101", occupied: false },
              { unitNumber: "102", occupied: false },
              { unitNumber: "103", occupied: false },
              { unitNumber: "104", occupied: false }
            ]
          },
          {
            floorNumber: 2,
            units: [
              { unitNumber: "201", occupied: false },
              { unitNumber: "202", occupied: false },
              { unitNumber: "203", occupied: false },
              { unitNumber: "204", occupied: false }
            ]
          },
          {
            floorNumber: 3,
            units: [
              { unitNumber: "301", occupied: false },
              { unitNumber: "302", occupied: false },
              { unitNumber: "303", occupied: false },
              { unitNumber: "304", occupied: false }
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
        floors: [
          {
            floorNumber: 1,
            units: [
              { unitNumber: "101", occupied: false },
              { unitNumber: "102", occupied: false }
            ]
          },
          {
            floorNumber: 2,
            units: [
              { unitNumber: "201", occupied: false },
              { unitNumber: "202", occupied: false }
            ]
          },
          {
            floorNumber: 3,
            units: [
              { unitNumber: "301", occupied: false },
              { unitNumber: "302", occupied: false }
            ]
          }
        ]
      }
    ];

    const buildings = await Building.insertMany(seedData);

    return res.status(201).json({ 
      message: "Buildings seeded successfully",
      count: buildings.length,
      buildings 
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to seed buildings", error: error.message });
  }
};
