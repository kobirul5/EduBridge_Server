import { Request, Response } from 'express';
import { PaymentService } from './Payment.service';
import httpStatus from 'http-status';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { IUser } from '../User/user.interface';


// Create Price
const createPrice = catchAsync(async (req: Request, res: Response) => {

  const { paymentMethod, bookingId, currency } = req.body;
  const userId = req.user.id

  const result = await PaymentService.createPaymentIntent({ paymentMethod, bookingId, currency, userId });
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Payment  successfully!',
    data: result,
  });
});

const getAllTutorEarning = catchAsync(async (req: Request, res: Response) => {

  const userId = req.user.id

  const result = await PaymentService.getAllTutorEarning(userId);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Payment  successfully!',
    data: result,
  });
})

const getAllPayment = catchAsync(async (req: Request, res: Response) => {

  const result = await PaymentService.getAllPayment();
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'All payment Retrieved successfully!',
    data: result,
  });
})

const getSinglePayment = catchAsync(async (req: Request, res: Response) => {

  const result = await PaymentService.getSinglePayment(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Single payment Retrieved successfully!',
    data: result,
  });
})


const getMyPayments = catchAsync(async (req: Request, res: Response) => {

  const result = await PaymentService.getMyPayments(req.user.id);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'My payment Retrieved successfully!',
    data: result,
  });
})


export const PaymentController = {
  createPrice,
  getAllTutorEarning,
  getAllPayment ,
  getSinglePayment,
  getMyPayments
};
