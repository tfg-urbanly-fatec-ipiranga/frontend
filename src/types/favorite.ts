export interface FavoriteItem {
  id: string;
  createdAt: string;
  place: {
    id: string;
    name: string;
    city: string | null;
    category: string | null;
  };
}
