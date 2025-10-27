import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["user", "admin", "superadmin"], default: "user" },
    status: { type: String, enum: ["pending", "active", "inactive", "rejected"], default: "pending" },
    phone: { type: String },
    store: { type: mongoose.Schema.Types.ObjectId, ref: "Store" },
    position: { type: String },
    inactivatedAt: { type: Date },
    inactivatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    inactivationReason: { type: String },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("User", userSchema);
