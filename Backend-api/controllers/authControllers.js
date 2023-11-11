const crypto = require("crypto");

const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");

const User = require("../models/userModel");
const sendEmail = require("../utils/email");
const AppError = require("../utils/error");

const signToken = (id, res) => {
  const token = jwt.sign({ id }, process.env.SECRET_KEY, {
    expiresIn: 2000,
  });

  res.cookie("jwt", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development", // Use secure cookies in production
    sameSite: "strict", // Prevent CSRF attacks
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  return token;
};

exports.signup = asyncHandler(async (req, res, next) => {
  const { name, email, password, passwordConfirm } = req.body;

  if (!name || !email || !password || !passwordConfirm) {
    return next(
      new AppError(
        "please provide name, email, password, passwordConfirm !",
        400
      )
    );
  }

  const newUser = await User.create({
    name,
    email,
    password,
    passwordConfirm,
  });

  const token = signToken(newUser.id, res);

  newUser.password = undefined;

  res.status(201).json({ token, user: newUser });
});

exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError("please provide email and password!", 400));
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.isPasswordCorrect(password, user.password))) {
    return next(new AppError("Incorrect email or password", 401));
  }

  const token = signToken(user.id, res);

  res.status(201).json({
    token,
  });
});

exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token) {
    return next(
      new AppError("Authentication credentials were not provided.", 401)
    );
  }

  let decoded;

  jwt.verify(token, process.env.SECRET_KEY, (err, dec) => {
    decoded = { ...dec };
    if (err) {
      return next(err);
    }
  });

  const user = await User.findById(decoded.id);

  if (!user) {
    return next(new AppError("The user does not exist", 401));
  }

  if (user.isPasswordchanged(decoded.iat)) {
    return next(new AppError("User changed password! please login again", 401));
  }

  req.user = user;

  next();
});

exports.permissionTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError("You are not allowed to access this", 403));
    }
    next();
  };
};

exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return next(new AppError("There is no user with this email address.", 404));
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `password forgot enter new password and PasswordConfirm to :${resetURL}.`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Your password reset token(valid for 10min)",
      message,
    });

    res.status(200).json({
      status: "success",
      message: "Token sent to email",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save({ validateBeforeSave: false });
    return next(
      new AppError("there was an error sending email,Try again later", 500)
    );
  }
});

exports.resetPassword = asyncHandler(async (req, res, next) => {
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError("Token is invalid", 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  const token = signToken(user.id, res);

  res.status(200).json({
    token,
  });
});

exports.changePassword = async (req, res, next) => {
  const { oldPassword, password, passwordConfirm } = req.body;
  const user = await User.findById(req.user.id).select("+password");

  if (!(await user.isPasswordCorrect(oldPassword, user.password))) {
    return next(new AppError("Your password is wrong.", 401));
  }

  user.password = password;
  user.passwordConfirm = passwordConfirm;

  await user.save();

  const token = signToken(user.id, res);

  res.status(200).json({
    token,
  });
};
