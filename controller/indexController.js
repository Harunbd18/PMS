const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("./../model/userModel");
const PasswordCategory = require("./../model/passwordCategoryModel");
const PasswordDetails = require("./../model/passwordDetails");

if (typeof localStorage === "undefined" || localStorage === null) {
  var LocalStorage = require("node-localstorage").LocalStorage;
  localStorage = new LocalStorage("./scratch");
}

exports.checkAdmin = async function(req, res, next) {
  const loginUser = localStorage.getItem("loginUser");
  const userName = await User.findOne({ name: loginUser });

  if (userName.role != "admin") {
    res.redirect("/");
  }
  next();
};

exports.checkLoginUser = function(req, res, next) {
  try {
    const userToken = localStorage.getItem("userToken");
    var decoded = jwt.verify(userToken, "loginToken");
  } catch (err) {
    res.redirect("/");
  }
  next();
};

exports.getIndex = function(req, res, next) {
  const userToken = localStorage.getItem("userToken");

  if (userToken) {
    res.redirect("/dashboard");
  } else {
    res.render("index", { title: "Password Managment System", message: "" });
  }
};

exports.postIndex = async function(req, res, next) {
  try {
    const usenName = req.body.name;
    const Userpassword = req.body.password;
    const checkUser = await User.findOne({ name: usenName });

    // if (!userName || !userPassword)
    //   throw new Error("enter user name and password");

    if (!checkUser) throw new Error("You are not registred");

    const getPassword = checkUser.password;
    const getUserID = checkUser._id;
    if (await bcrypt.compare(Userpassword, getPassword)) {
      const token = jwt.sign({ userID: getUserID }, "loginToken");
      localStorage.setItem("userToken", token);
      localStorage.setItem("loginUser", usenName);

      if (checkUser.role === "admin") {
        res.redirect("/admin");
      }
      res.redirect("/dashboard");
    } else {
      throw new Error("User Name or Password incorrect");
    }
  } catch (err) {
    res.render("index", {
      title: "Password Managment System",
      message: err.message,
      type: "danger"
    });
  }
};

exports.getSignup = function(req, res, next) {
  const userToken = localStorage.getItem("userToken");

  if (userToken) {
    res.redirect("/dashboard");
  } else {
    res.render("signup", {
      title: "Password Managment System",
      message: "",
      type: ""
    });
  }
};

exports.signup = async function(req, res, next) {
  try {
    const newUser = await User.create(req.body);

    const getUserID = newUser._id;
    const userName = newUser.name;
    const token = jwt.sign({ userID: getUserID }, "loginToken");
    localStorage.setItem("userToken", token);
    localStorage.setItem("loginUser", userName);

    res.redirect("/dashboard");
  } catch (err) {
    res.status(400).render("signup", {
      title: "Password Managment System",
      message: "Sing up faield",
      type: "danger"
    });
  }
};

exports.getPasswordCategory = async function(req, res, next) {
  const loginUser = localStorage.getItem("loginUser");
  const checkAdmin = (await User.findOne({ name: loginUser })).role === "admin";
  let passwordCategory;

  if (checkAdmin) {
    passwordCategory = await PasswordCategory.find();
  } else {
    passwordCategory = await PasswordCategory.find({ author: loginUser });
  }

  res.render("passwordCategory", {
    title: "password Category",
    message: "",
    type: "",
    data: passwordCategory,
    ID: "",
    loginUser: loginUser
  });
};

exports.postPasswordCategory = async function(req, res, next) {
  try {
    let passwordCategory;
    const loginUser = localStorage.getItem("loginUser");
    const getPasswordCategory = req.body.addNewCategory;
    passwordCategory = await PasswordCategory.find({ author: loginUser });
    const checkAdmin =
      (await User.findOne({ name: loginUser })).role === "admin";

    if (!getPasswordCategory) {
      res.render("passwordCategory", {
        title: "password Category",
        message: "Enter password category name",
        type: "danger",
        data: passwordCategory,
        ID: "",
        loginUser: loginUser
      });
    } else {
      await PasswordCategory.create(req.body);
      if (checkAdmin) {
        passwordCategory = await PasswordCategory.find();
      } else {
        passwordCategory = await PasswordCategory.find({
          author: loginUser
        });
      }

      res.render("passwordCategory", {
        title: "password Category",
        message: "password Category added successfully",
        type: "success",
        data: passwordCategory,
        ID: "",
        loginUser: loginUser
      });
    }
  } catch (err) {
    const passwordCategory = await PasswordCategory.find();
    res.render("passwordCategory", {
      title: "password Category",
      message: "category name already exists",
      type: "danger",
      data: passwordCategory,
      ID: ""
    });
  }
};

exports.getPasswordDetails = async function(req, res, next) {
  const loginUser = localStorage.getItem("loginUser");
  const checkAdmin = (await User.findOne({ name: loginUser })).role === "admin";
  let passwordCategory, passwordList;

  if (checkAdmin) {
    passwordCategory = await PasswordCategory.find();
    passwordList = await PasswordDetails.find();
  } else {
    passwordCategory = await PasswordCategory.find({ author: loginUser });
    passwordList = await PasswordDetails.find({ author: loginUser });
  }

  res.render("passwordDetails", {
    title: "password Details",
    data: passwordCategory,
    value: passwordList,
    loginUser: loginUser
  });
};

exports.postPasswordDetails = async function(req, res, next) {
  let passwordCategory, passwordList;
  const loginUser = localStorage.getItem("loginUser");
  const checkAdmin = (await User.findOne({ name: loginUser })).role === "admin";
  await PasswordDetails.create(req.body);

  if (checkAdmin) {
    passwordCategory = await PasswordCategory.find();
    passwordList = await PasswordDetails.find();
  } else {
    passwordCategory = await PasswordCategory.find({ author: loginUser });
    passwordList = await PasswordDetails.find({ author: loginUser });
  }

  res.render("passwordDetails", {
    title: "password Details",
    data: passwordCategory,
    value: passwordList,
    loginUser: loginUser
  });
};

exports.dashboard = async function(req, res, next) {
  try {
    const loginUser = localStorage.getItem("loginUser");
    const passDet = await PasswordDetails.find({ author: loginUser });
    const userName = await User.findOne({ name: loginUser });

    if (userName && userName.role === "admin") {
      res.redirect("/admin");
    } else {
      console.log(userName.name);

      res.render("dashboard", {
        title: "User Dashboard",
        loginUser: loginUser,
        data: passDet,
        record: userName
      });
    }
  } catch (err) {
    res.render("error", {
      message: "Server Not Found",
      error: err
    });
  }
};

exports.editUserAccount = async function(req, res, next) {
  const userId = req.params.id;
  const userInfo = await User.findById(userId);

  res.render("editUserAccount", {
    title: "Edit User",
    data: userInfo,
    id: userId
  });
};

exports.updateUserAccount = async function(req, res, next) {
  const id = req.body.id;
  const updateName = req.body.edit_username;
  const updateEmail = req.body.edit_email;

  localStorage.setItem("loginUser", updateName);

  await User.findByIdAndUpdate(id, {
    name: updateName,
    email: updateEmail
  });

  res.redirect("/dashboard");
};

exports.deleteUserAccount = async function(req, res, next) {
  await User.findByIdAndDelete(req.params.id);

  res.redirect("/logout");
};

exports.admin = async function(req, res, next) {
  try {
    const totalUser = await (await User.find()).length;
    const totalCat = await (await PasswordCategory.find()).length;
    const totalDetail = await (await PasswordDetails.find()).length;
    const passDet = await PasswordDetails.find();

    const users = await User.find();
    const loginUser = localStorage.getItem("loginUser");

    res.status(201).render("admin", {
      title: "Admin Dashboard",
      data: users,
      loginUser: loginUser,
      users: totalUser,
      category: totalCat,
      details: totalDetail,
      records: passDet
    });
  } catch (err) {
    res.status(400).render("error", {
      message: "Admin Dashboard",
      error: err
    });
  }
};

exports.deleteAdmin = async function(req, res, next) {
  await User.findByIdAndDelete(req.params.id);
  res.redirect("/admin");
};

exports.editAdmin = async function(req, res, next) {
  const passId = req.params.id;
  const userInfo = await User.findById(passId);

  res.render("editUser", {
    title: "Edit User",
    data: userInfo,
    id: passId
  });
};

exports.updateAdmin = async function(req, res, next) {
  const id = req.body.id;
  const updateName = req.body.edit_username;
  const updateEmail = req.body.edit_email;

  await User.findByIdAndUpdate(id, {
    name: updateName,
    email: updateEmail
  });

  res.redirect("/admin");
};

exports.deletePasswordCategory = async function(req, res, next) {
  await PasswordCategory.findByIdAndDelete(req.params.id);
  res.redirect("/passwordCategory");
};

exports.editPasswordCategory = async function(req, res, next) {
  const passCatId = req.params.id;
  const passCategoryData = await PasswordCategory.findById(passCatId);

  res.render("editPassCategory", {
    title: "Edit Password Category",
    data: passCategoryData,
    id: passCatId
  });
};

exports.updatePasswordCategory = async function(req, res, next) {
  const id = req.body.id;
  const updateCatName = req.body.edit_category_name;

  await PasswordCategory.findByIdAndUpdate(id, {
    addNewCategory: updateCatName
  });

  res.redirect("/passwordCategory");
};

exports.deletePasswordDetails = async function(req, res, next) {
  await PasswordDetails.findByIdAndDelete(req.params.id);
  res.redirect("/passwordDetails");
};

exports.editPasswordDetails = async function(req, res, next) {
  const passCatId = req.params.id;
  const passDetailsData = await PasswordDetails.findById(passCatId);

  res.render("editPassDetails", {
    title: "Edit Password Details",
    data: passDetailsData,
    id: passCatId
  });
};

exports.updatePasswordDetails = async function(req, res, next) {
  const id = req.body.id;
  const updatePassDetails = req.body.edit_pass_details;

  await PasswordDetails.findByIdAndUpdate(id, {
    passwordDatail: updatePassDetails
  });

  res.redirect("/passwordDetails");
};

exports.logout = function(req, res, next) {
  localStorage.removeItem("userToken");
  localStorage.removeItem("loginUser");

  res.redirect("/");
};
