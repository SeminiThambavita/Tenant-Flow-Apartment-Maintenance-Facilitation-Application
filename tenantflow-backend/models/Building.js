import mongoose from "mongoose";

const buildingSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    address: {
      type: String,
      required: true,
      trim: true
    },
    city: {
      type: String,
      required: true,
      trim: true
    },
    zipCode: {
      type: String,
      trim: true
    },
    totalFloors: {
      type: Number,
      required: true,
      min: 1
    },
    propertyManagers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],
    floors: [
      {
        floorNumber: {
          type: Number,
          required: true
        },
        units: [
          {
            unitNumber: {
              type: String,
              required: true
            },
            occupied: {
              type: Boolean,
              default: false
            },
            occupiedBy: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "User",
              default: null
            },
            occupiedAt: {
              type: Date,
              default: null
            }
          }
        ]
      }
    ],
    isActive: {
      type: Boolean,
      default: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

// Index for faster lookups
buildingSchema.index({ name: 1, city: 1 });

export default mongoose.model("Building", buildingSchema);
