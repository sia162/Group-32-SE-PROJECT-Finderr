const User = require("../models/user");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const shortid = require("shortid");

const generateJwtToken = (_id) => {
  return jwt.sign({ _id }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
};

exports.signup = (req, res) => {
  User.findOne({ email: req.body.email }).exec(async (error, user) => {
    if (user)
      return res.status(400).json({
        error: "User already registered",
      });

    const { firstName, lastName, email, password, tech_skills, contactNumber } =
      req.body;
    const hash_password = await bcrypt.hash(password, 10);
    const _user = new User({
      firstName,
      lastName,
      email,
      hash_password,
      tech_skills,
      contactNumber,
      username: shortid.generate(),
    });

    _user.save((error, user) => {
      if (error) {
        return res.status(400).json({
          message: "Something went wrong",
        });
      }

      if (user) {
        const token = generateJwtToken(user._id);
        const {
          _id,
          firstName,
          lastName,
          email,
          fullName,
          tech_skills,
          contactNumber,
        } = user;
        return res.status(201).json({
          token,
          user: {
            _id,
            firstName,
            lastName,
            email,
            fullName,
            tech_skills,
            contactNumber,
          },
        });
      }
    });
  });
};

exports.signin = (req, res) => {
  User.findOne({ email: req.body.email }).exec(async (error, user) => {
    if (error) return res.status(400).json({ error });

    if (user) {
      const isPassword = await user.authenticate(req.body.password);
      if (isPassword) {
        // const token = jwt.sign(
        //   { _id: user._id, role: user.role },
        //   process.env.JWT_SECRET,
        //   { expiresIn: "1d" }
        // );
        const token = generateJwtToken(user._id);
        const {
          _id,
          firstName,
          lastName,
          email,
          fullName,
          tech_skills,
          contactNumber,
        } = user;
        res.status(200).json({
          token,
          user: {
            _id,
            firstName,
            lastName,
            email,
            fullName,
            tech_skills,
            contactNumber,
          },
        });
      } else {
        return res.status(400).json({
          message: "Something went wrong",
        });
      }
    } else {
      return res.status(400).json({ message: "Something went wrong" });
    }
  });
};

exports.searchUser = (req, res) => {
  let userPattern = new RegExp("^" + req.body.query);
  User.find({ email: { $regex: userPattern } })
    .select("_id email")
    .then((user) => {
      res.json({ user });
    })
    .catch((err) => {
      console.log(err);
    });
};

const checkForErrors = ({ firstName, lastName, username , email , hash_password , tech_skills , contactNumber }) => {
  let errors = {};
  let isValid = false;
  if (firstName === "") {
    errors = { ...errors, title: "This field is required" };
  }
  if (lastName === "") {
    errors = { ...errors, body: "This field is required" };
  }
  if (username === "") {
    errors = { ...errors, body: "This field is required" };
  }
  if (email === "") {
    errors = { ...errors, body: "This field is required" };
  }
  if (hash_password === "") {
    errors = { ...errors, body: "This field is required" };
  }
  if (tech_skills === "") {
    errors = { ...errors, tech_skills: "This field is required" };
  }
  if (contactNumber === "") {
    errors = { ...errors, body: "This field is required" };
  }
  isValid = true;
  return { isValid, errors };
};

exports.updateUser = async (req, res) => {
  const { firstName, lastName, username ,email ,hash_password ,tech_skills , contactNumber } = req.body;
  const { isValid, errors } = checkForErrors({ firstName, lastName,username , email , hash_password, tech_skills ,contactNumber});

  const updatedUser = {};

  if (isValid) {
    if (firstName) {
      updatedUser.firstName = firstName;
    }
    if (lastName) {
      updatedUser.lastName = lastName;
    }
    if (username) {
      updatedUser.username = username;
    }
    if (email) {
      updatedUser.email = email;
    }
    if (hash_password) {
      updatedUser.hash_password = hash_password;
    }
    if (tech_skills) {
      updatedUser.tech_skills = tech_skills;
    }
    if (contactNumber) {
      updatedUser.contactNumber = contactNumber;
    }

    let user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).send("not found");
    }

    if (user._id.toString() === req.user._id.toString()) {
      user = await User.findByIdAndUpdate(
        req.params.id,
        { $set: updatedUser },
        { new: true }
      );
      // console.log(post);
      res.status(200).json(user);
    } else {
      return res.status(401).send("not allowed");
    }
  } else {
    res.json({ errors });
  }
};

