interface IPaymentIntent {
  paymentMethod: string;
  bookingId: string;
  currency?: string;
  userId: string;
}