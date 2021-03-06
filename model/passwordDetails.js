const mongoose = require("mongoose");

//Create schema for CRUD operations
const passwordDetailsSchema = new mongoose.Schema({
  addPasswordCategory: {
    type: String,
    required: [true, "Please provied a category name"]
  },
  passwordDatail: {
    type: String,
    required: [true, "Please provied a password details"]
  },
  projectName: {
    type: String,
    default: "Unnamed project"
  },
  date: {
    type: Date,
    default: Date.now
  },
  author: {
    type: String
  }
});

//craete model
const PasswordDetails = mongoose.model(
  "PasswordDetails",
  passwordDetailsSchema
);

//export User
module.exports = PasswordDetails;
