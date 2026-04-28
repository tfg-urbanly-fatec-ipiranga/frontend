export interface PlaceTag {
  tag: { name: string };
}

export interface PlaceCategory {
  id: string;
  name: string;
}

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
  category?: PlaceCategory;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  placeTags?: PlaceTag[];
  // kept for backward compat with older code that may map tags manually
  photos?: any;
}
