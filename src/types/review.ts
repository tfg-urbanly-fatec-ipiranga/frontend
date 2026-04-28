export interface Review {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
  };
  place: {
    id: string;
    name: string;
  };
}
