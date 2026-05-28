# Database Seeding Guide

## Seeding Buildings, Units, Floors & Property Managers

This guide explains how to seed the database with predefined buildings and property managers.

### What Gets Seeded

#### 🏢 **Buildings (4 total)**

1. **Emerald Towers** - Colombo
   - Floors: 1-5
   - Units per floor: 3 (101, 102, 103 etc)
   - Total units: 15
   - Manager: Rajesh Kumar

2. **Golden Heights** - Colombo
   - Floors: 1-4
   - Units per floor: 4 (101, 102, 103, 104 etc)
   - Total units: 16
   - Manager: Priya Sharma

3. **Silver Springs** - Kandy
   - Floors: 1-3
   - Units per floor: 2 (101, 102 etc)
   - Total units: 6
   - Manager: Anil Perera

4. **Crystal Plaza** - Colombo
   - Floors: 1-6
   - Units per floor: 5 (101-105 etc)
   - Total units: 30
   - Manager: Rajesh Kumar (manages 2 buildings)

**Total: 4 buildings, 67 units, all initially unoccupied**

#### 👨‍💼 **Property Managers (3 total)**

1. **Rajesh Kumar**
   - Email: rajesh.kumar@propertymanagement.com
   - Phone: 0771234567
   - Manages: Emerald Towers, Crystal Plaza

2. **Priya Sharma**
   - Email: priya.sharma@propertymanagement.com
   - Phone: 0772345678
   - Manages: Golden Heights

3. **Anil Perera**
   - Email: anil.perera@propertymanagement.com
   - Phone: 0773456789
   - Manages: Silver Springs

**All managers have default password: `password123`**

---

## How to Run

### Option 1: Using NPM Script (Recommended)

```bash
cd tenantflow-backend
npm run seed:buildings
```

### Option 2: Direct Node Execution

```bash
cd tenantflow-backend
node seeds/seedBuildings.js
```

---

## Expected Output

```
✓ Connected to database
✓ Cleared existing buildings
✓ Created property manager: Rajesh Kumar
✓ Created property manager: Priya Sharma
✓ Created property manager: Anil Perera
✓ Created building: Emerald Towers
✓ Created building: Golden Heights
✓ Created building: Silver Springs
✓ Created building: Crystal Plaza

====== SEEDING SUMMARY ======
✓ Created 3 property managers
✓ Created 4 buildings
  - Emerald Towers: 5 floors, 15 units
  - Golden Heights: 4 floors, 16 units
  - Silver Springs: 3 floors, 6 units
  - Crystal Plaza: 6 floors, 30 units
✓ Total units: 67
✓ Database seeding completed successfully!
```

---

## Login Credentials

After seeding, you can login as property managers:

### Rajesh Kumar
- Email: `rajesh.kumar@propertymanagement.com`
- Password: `password123`
- Manages: Emerald Towers, Crystal Plaza

### Priya Sharma
- Email: `priya.sharma@propertymanagement.com`
- Password: `password123`
- Manages: Golden Heights

### Anil Perera
- Email: `anil.perera@propertymanagement.com`
- Password: `password123`
- Manages: Silver Springs

---

## What Happens When You Seed

1. **Clears existing buildings** - Deletes any previously seeded buildings
2. **Creates/updates property managers** - Creates admin users if they don't exist
3. **Creates buildings** - Creates 4 buildings with all floors and units
4. **Assigns managers** - Links each building to its property manager
5. **Sets occupancy** - All units initially marked as unoccupied

---

## Testing After Seeding

### Test 1: Tenant Registration
1. Go to tenant registration page
2. Building dropdown should show all 4 buildings
3. Select a building → Floors should appear
4. Select a floor → Available units should appear
5. Register as tenant in any unit
6. Unit should now be marked as occupied

### Test 2: Prevent Duplicate Registration
1. Try to register with same unit → Should get error: "Unit already occupied"

### Test 3: Issue Assignment
1. Login as tenant in Emerald Towers
2. Report an issue
3. Issue should auto-assign to Rajesh Kumar (manager of Emerald Towers)
4. Rajesh should see the issue in his dashboard

### Test 4: Property Manager Access
1. Login as Rajesh Kumar
2. Should only see issues from Emerald Towers and Crystal Plaza
3. Should NOT see issues from Golden Heights or Silver Springs

---

## Re-seeding Database

To reset and seed again:

```bash
npm run seed:buildings
```

This will:
- Delete all existing buildings
- Create fresh buildings with unoccupied units
- Reset property manager assignments

**Note:** This does NOT delete tenant accounts or previously reported issues. Those remain in the database.

---

## Architecture

```
Building
  ├── name: "Emerald Towers"
  ├── address: "123 Main Street"
  ├── propertyManagers: [ObjectId → Rajesh Kumar]
  └── floors: [
      {
        floorNumber: 1,
        units: [
          {
            unitNumber: "101",
            occupied: false,
            occupiedBy: null,
            occupiedAt: null
          },
          {
            unitNumber: "102",
            occupied: false,
            occupiedBy: null,
            occupiedAt: null
          },
          ...
        ]
      },
      ...
    ]

User (Property Manager)
  ├── name: "Rajesh Kumar"
  ├── email: "rajesh.kumar@propertymanagement.com"
  ├── role: "admin"
  └── buildings: [ObjectId → Emerald Towers, ObjectId → Crystal Plaza]
```

---

## Troubleshooting

### Issue: Connection timeout
```
Error: MongoDB connection failed
```
**Solution:** Ensure MongoDB is running and connection string in `.env` is correct

### Issue: Buildings already exist
```
~ Building already exists
```
**Solution:** Normal behavior if re-running. Seeds checks and updates existing records.

### Issue: Port already in use
```
Error: EADDRINUSE: address already in use :::5000
```
**Solution:** Stop the previous server instance or use a different port

---

## Next Steps

1. ✅ Seed buildings: `npm run seed:buildings`
2. 🏠 Register as tenant in a unit
3. 📋 Report an issue
4. 👨‍💼 Login as property manager to see issues
5. ✅ Assign issue to staff member
6. 👷 Login as staff to start work
7. 💰 Create cost report and process payment

---

## Database Structure After Seeding

```
Collections:
- users (3 property managers)
- buildings (4 buildings with 67 units)
- issues (empty - awaiting tenant reports)
- costReports (empty)
- invoices (empty)
- payments (empty)
- notifications (empty)
```
