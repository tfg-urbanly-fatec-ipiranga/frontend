export interface PlacePhoto {
  id: string;
  placeId: string;
  url: string;
  caption?: string;
  isPrimary: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
