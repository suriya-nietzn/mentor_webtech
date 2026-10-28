import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ALL_ROLES, CATEGORIES, WEEK_DAYS } from '../utils/constants.js';

const { Schema } = mongoose;

const educationSchema = new Schema(
  {
    degree: { type: String, trim: true, maxlength: 120, required: true },
    institution: { type: String, trim: true, maxlength: 160, required: true },
    year: { type: String, trim: true, maxlength: 20 },
  },
  { _id: false }
);

const workSchema = new Schema(
  {
    role: { type: String, trim: true, maxlength: 120, required: true },
    organization: { type: String, trim: true, maxlength: 160, required: true },
    period: { type: String, trim: true, maxlength: 60 },
    description: { type: String, trim: true, maxlength: 500 },
  },
  { _id: false }
);

const studentProfileSchema = new Schema(
  {
    yearOfStudy: { type: Number, min: 1, max: 6 },
    skills: { type: [String], default: [] },
    careerInterests: { type: [String], default: [] },
    learningGoals: { type: String, trim: true, maxlength: 1000, default: '' },
  },
  { _id: false }
);

const mentorProfileSchema = new Schema(
  {
    title: { type: String, trim: true, maxlength: 120, default: '' },
    bio: { type: String, trim: true, maxlength: 2000, default: '' },
    skills: { type: [String], default: [] },
    expertise: { type: [String], default: [] },
    yearsOfExperience: { type: Number, min: 0, max: 60, default: 0 },
    education: { type: [educationSchema], default: [] },
    workExperience: { type: [workSchema], default: [] },
    availability: {
      days: { type: [{ type: String, enum: WEEK_DAYS }], default: [] },
      timeNotes: { type: String, trim: true, maxlength: 200, default: '' },
      isAcceptingStudents: { type: Boolean, default: true },
    },
    categories: { type: [{ type: String, enum: CATEGORIES }], default: [] },
    mentoringApproach: { type: String, trim: true, maxlength: 1000, default: '' },
  },
  { _id: false }
);

const userSchema = new Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, minlength: 2, maxlength: 80 },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [/^\S+@\S+\.\S+$/, 'Email is invalid'],
    },
    // select: false means the hash is never loaded unless a query asks for it explicitly.
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ALL_ROLES, required: true },
    college: { type: String, trim: true, maxlength: 160, default: '' },
    department: { type: String, trim: true, maxlength: 120, default: '' },
    avatarUrl: { type: String, trim: true, maxlength: 500, default: '' },
    studentProfile: { type: studentProfileSchema, default: undefined },
    mentorProfile: { type: mentorProfileSchema, default: undefined },
    recentlyViewedMentors: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    isSample: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

userSchema.index({ role: 1, 'mentorProfile.categories': 1 });

userSchema.methods.setPassword = async function setPassword(plain) {
  // Cost 12: about 0.2s per hash, slow enough to resist brute force, fast enough for users.
  this.passwordHash = await bcrypt.hash(plain, 12);
};

userSchema.methods.checkPassword = function checkPassword(plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

// Fields that count towards "profile completion". Each filled field is worth an equal share.
export const COMPLETION_FIELDS = {
  student: [
    ['name', (u) => u.name],
    ['college', (u) => u.college],
    ['department', (u) => u.department],
    ['avatarUrl', (u) => u.avatarUrl],
    ['yearOfStudy', (u) => u.studentProfile?.yearOfStudy],
    ['skills', (u) => u.studentProfile?.skills?.length],
    ['careerInterests', (u) => u.studentProfile?.careerInterests?.length],
    ['learningGoals', (u) => u.studentProfile?.learningGoals],
  ],
  mentor: [
    ['name', (u) => u.name],
    ['college', (u) => u.college],
    ['department', (u) => u.department],
    ['avatarUrl', (u) => u.avatarUrl],
    ['title', (u) => u.mentorProfile?.title],
    ['bio', (u) => u.mentorProfile?.bio],
    ['skills', (u) => u.mentorProfile?.skills?.length],
    ['expertise', (u) => u.mentorProfile?.expertise?.length],
    ['yearsOfExperience', (u) => u.mentorProfile?.yearsOfExperience],
    ['education', (u) => u.mentorProfile?.education?.length],
    ['workExperience', (u) => u.mentorProfile?.workExperience?.length],
    ['availability', (u) => u.mentorProfile?.availability?.days?.length],
    ['categories', (u) => u.mentorProfile?.categories?.length],
    ['mentoringApproach', (u) => u.mentorProfile?.mentoringApproach],
  ],
};

userSchema.methods.profileCompletion = function profileCompletion() {
  const fields = COMPLETION_FIELDS[this.role] || [];
  const missing = fields.filter(([, isFilled]) => !isFilled(this)).map(([name]) => name);
  const percent = fields.length ? Math.round(((fields.length - missing.length) / fields.length) * 100) : 0;
  return { percent, missing };
};

// Safe JSON for the client: no password hash, no internal version key.
userSchema.methods.toSafeJSON = function toSafeJSON() {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.__v;
  return obj;
};

export default mongoose.model('User', userSchema);
