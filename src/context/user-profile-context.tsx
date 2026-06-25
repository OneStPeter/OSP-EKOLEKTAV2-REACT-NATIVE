import React, { createContext, useContext, useState } from "react";

interface UserProfileContextValue {
  imageUri: string | null;
  initials: string;
  setImageUri: (uri: string | null) => void;
}

const UserProfileContext = createContext<UserProfileContextValue>({
  imageUri: null,
  initials: "JR",
  setImageUri: () => {},
});

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

export function UserProfileProvider({
  children,
  name = "Jerome Jardio",
}: {
  children: React.ReactNode;
  name?: string;
}) {
  const [imageUri, setImageUri] = useState<string | null>(null);
  return (
    <UserProfileContext.Provider
      value={{ imageUri, initials: getInitials(name), setImageUri }}
    >
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  return useContext(UserProfileContext);
}
