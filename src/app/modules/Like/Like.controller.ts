import { JwtPayload } from "jsonwebtoken";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import pick from "../../../shared/pick";
import { LikeService } from "./Like.service";
import { likeFilterableFields } from "./Like.constant";




const toggleLike = catchAsync(async (req, res) => {
    const { id } = req.params;
    const user=req.user;
    const result = await LikeService.toggleLike(id,user);
    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Toggle successfully",
      data: result,
    });
  });
const getAllMyLikeIds = catchAsync(async (req, res) => {
    const user=req.user;
    const result = await LikeService.getAllMyLikeIds(user as JwtPayload);
    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "successfully",
      data: result,
    });
  });
const getAllMyLikeUsers = catchAsync(async (req, res) => {
    const user=req.user;
    const filters = pick(req.query,likeFilterableFields );
    // const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder'])
    const result = await LikeService.getAllMyLikeUsers(user as JwtPayload,filters);
    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "get all my Like Users successfully",
      data: result,
    });
  });


  //get peer like users
  const getPeerLikes = catchAsync(async (req, res) => {
    const user = req.user;
    const filters = pick(req.query, likeFilterableFields);
    // const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
    const result = await LikeService.getPeerLikes(user, filters);

    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: "Peer likes retrieved successfully",
        data: result,
    });
});
export const likeController = {
    toggleLike,
    getAllMyLikeIds,
    getAllMyLikeUsers,
    getPeerLikes
  };