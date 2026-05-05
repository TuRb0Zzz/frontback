const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  first_name: {
    type: String,
    required: true,
    trim: true,
  },
  last_name: {
    type: String,
    required: true,
    trim: true,
  },
  age: {
    type: Number,
    required: true,
    min: 0,
  },
  created_at: {
    type: Number,
    default: () => Math.floor(Date.now() / 1000),
  },
  updated_at: {
    type: Number,
    default: () => Math.floor(Date.now() / 1000),
  },
});


userSchema.pre('findOneAndUpdate', function() {
  this.set({ updated_at: Math.floor(Date.now() / 1000) });
});

userSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const User = mongoose.model('User', userSchema);
module.exports = User;