export interface Place {
  id: string;
  name: string;
  description?: string;
  address?: string;
  city?: string;
  openingTime: string;
  closingTime: string;
  latitude: number;
  longitude: number;
  categoryId?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  tags?: Array<{ id: string; name: string }>;
}
