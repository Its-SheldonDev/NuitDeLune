const AppError = require("../utils/error");

const errorHandler = (err, req, res, next) => {
  let error = { ...err };

  error.message = err.message;

  if (error.code === 11000) {
    const value = err.message.match(/(["'])(\\?.)*?\1/)[0];
    const message = ` ${value} : Duplicate Field value entered `;
    error = new AppError(message, 400);
  }

  if (error.name === "ValidationError") {
    const errors = Object.values(err.errors).map((el) => el.message);
    const message = `Invalid input data. ${errors.join(". ")}`;
    error = new AppError(message, 400);
  }

  if (error.name === "CastError") {
    const message = `Invalid ${error.path} :${error.value}`;
    error = new AppError(message, 400);
  }

  if (error.name === "JsonWebTokenError") {
    const message = new AppError("Invalid token. Please log in again!", 401);
    error = new AppError(message, 401);
  }
  if (error.name === "TokenExpiredError") {
    const message = new AppError(
      "Your token has expired! Please log in again.",
      401
    );
    error = new AppError(message, 401);
  }

  error.statusCode = error.statusCode || 500;
  res.status(error.statusCode).json({
    message: error.message || "Server Error",
  });
};

module.exports = errorHandler;
