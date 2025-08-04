export interface IReview {
  id?: string;
  rating: number;
  comment: string;
  userId: string;
  eventId: string;
  createdAt?: Date;
  updatedAt?: Date;
}
