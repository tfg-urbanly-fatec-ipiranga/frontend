import React, { createContext, useContext, useState } from 'react';

type UserLocation = {
  latitude: number;
  longitude: number;
};

type LocationContextType = {
  location: UserLocation | null;
};

const LocationContext = createContext({} as LocationContextType);

const MOCK_LOCATION = {
  latitude: -23.609563717026507,
  longitude: -46.60791729079371,
};

export function LocationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [location] = useState<UserLocation | null>(MOCK_LOCATION);

  return (
    <LocationContext.Provider value={{ location }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useUserLocation() {
  return useContext(LocationContext);
}