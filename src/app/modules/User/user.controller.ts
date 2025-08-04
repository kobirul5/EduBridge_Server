import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { userService } from "./user.services";
import { Request, Response } from "express";
import pick from "../../../shared/pick";
import { userFilterableFields } from "./user.costant";
import ApiError from "../../../errors/ApiErrors";

const createUser = catchAsync(async (req: Request, res: Response) => {

  if(!req.body.email || !req.body.password) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email and password are required.");
  }

  const result = await userService.createUserIntoDb(req.body);



  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User created successfully!",
    data: result,
  });
});


const getMyProfile = catchAsync(async (req: Request, res: Response) => {
  const userToken = req.headers.authorization;

  const result = await userService.getMyProfile(userToken as string);
  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "User profile retrieved successfully",
    data: result,
  });
});


// // get all user form db
// const getUsers = catchAsync(async (req: Request, res: Response) => {

//   const filters = pick(req.query, userFilterableFields);
//   // const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder'])

//   const result = await userService.getUsersFromDb(filters);
//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: "Users retrieve successfully!",
//     data: result,
//   });
// });


// // get all user form db
// const getAllUsers = catchAsync(async (req: Request, res: Response) => {
//   const filters = pick(req.query, ["gender", "distance", "lat", "long", "ageMin", "ageMax"]);
//   // const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);

//   const result = await userService.getAllUser(filters);

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: "Users retrieved successfully!",
//     data: result,
//   });
// });


// const getAllUserAndEvents = catchAsync(async (req: Request, res: Response) => {
//   const filters = pick(req.query, [
//     "gender",
//     "ageMin",
//     "ageMax",
//     "distance",
//     "lat",
//     "long",
//     "visibility", // For events
//   ]);
//   // const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);

//   const result = await userService.getAllUserAndEvents(filters);

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: "Users and Events fetched successfully!",
//     data: result,
//   });
// });



// // get all user form db
// const updateProfile = catchAsync(async (req: Request & {user?:any}, res: Response) => {
//   const user = req?.user;

//   const result = await userService.updateProfile(req);
//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: "Profile updated successfully!",
//     data: result,
//   });
// });


// // *! update user role and account status
// const updateUser = catchAsync(async (req: Request, res: Response) => {
// const id = req.params.id;
//   const result = await userService.updateUserIntoDb( req.body,id);
//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: "User updated successfully!",
//     data: result,
//   });
// });

// // *! update user role and account status
// const getRandomUser = catchAsync(async (req: Request, res: Response) => {
// const id = req.params.id;
//   const result = await userService.getRandomUser();
//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: "get random user  successfully!",
//     data: result,
//   });
// });


// // *! update user role and account status
// const getSingleUserById = catchAsync(async (req: Request, res: Response) => {
// const id = req.params.id;
//   const result = await userService.getSingleUserById(id);
//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: "get random user  successfully!",
//     data: result,
//   });
// });

// // Controller for fetching users for the home page
// const getUserForHomePage = catchAsync(async (req: Request, res: Response) => {
//   const authUserId = req.user.id; // Extract authenticated user's ID from request (assuming middleware sets req.user)
//   const page = parseInt(req.query.page as string) || 1; // Default page 1
//   const limit = parseInt(req.query.limit as string) || 20; // Default limit 20
//   const sortBy = (req.query.sortBy as string) || "createdAt"; // Default sorting by "createdAt"
//   const sortOrder = (req.query.sortOrder as string) || "asc"; // Default sorting order ascending

//   const result = await userService.getUserForHomePage(authUserId);

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: "Users retrieved successfully for the home page.",
//     data: result,
//   });
// });


export const userController = {
  createUser,
  getMyProfile
  // getUsers,
  // getAllUsers,
  // getAllUserAndEvents,
  // updateProfile,
  // updateUser,
  // getRandomUser,
  // getUserForHomePage,
  // getSingleUserById
};
