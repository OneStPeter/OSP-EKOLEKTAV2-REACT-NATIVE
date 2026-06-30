import { AntDesign, Entypo, MaterialCommunityIcons } from "@expo/vector-icons";
import { PhilippinePeso } from "lucide-react-native";
import React from "react";
import { View } from "react-native";

export type NavIconProps = { size: number; color: string };

export const HomeIcon = (p: NavIconProps) => (
  <AntDesign name="home" size={p.size} color={p.color} />
);
export const HomeActiveIcon = (p: NavIconProps) => (
  <Entypo name="home" size={p.size} color={p.color} />
);

export const McprIcon = (p: NavIconProps) => (
  <AntDesign name="file-text" size={p.size} color={p.color} strokeWidth={1.9} />
);
export const McprActiveIcon = (p: NavIconProps) => (
  <AntDesign name="file-text" size={p.size} color={p.color} strokeWidth={2.3} />
);

export const PaymentIcon = ({ size, color }: NavIconProps) => (
  <View
    style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      borderWidth: 1.5,
      borderColor: color,
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <PhilippinePeso size={size * 0.58} color={color} strokeWidth={1.9} />
  </View>
);
export const PaymentActiveIcon = ({ size, color }: NavIconProps) => (
  <View
    style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      borderWidth: 2,
      borderColor: color,
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <PhilippinePeso size={size * 0.58} color={color} strokeWidth={2.4} />
  </View>
);

export const DisbursementIcon = (p: NavIconProps) => (
  <MaterialCommunityIcons
    name="hand-coin-outline"
    size={p.size}
    color={p.color}
  />
);
export const DisbursementActiveIcon = (p: NavIconProps) => (
  <MaterialCommunityIcons name="hand-coin" size={p.size} color={p.color} />
);

export const PlanMgmtIcon = (p: NavIconProps) => (
  <MaterialCommunityIcons
    name="account-group-outline"
    size={p.size}
    color={p.color}
  />
);
export const PlanMgmtActiveIcon = (p: NavIconProps) => (
  <MaterialCommunityIcons name="account-group" size={p.size} color={p.color} />
);

export const DocCancelIcon = (p: NavIconProps) => (
  <MaterialCommunityIcons
    name="file-excel-outline"
    size={p.size}
    color={p.color}
  />
);
export const DocCancelActiveIcon = (p: NavIconProps) => (
  <MaterialCommunityIcons name="file-excel" size={p.size} color={p.color} />
);

export const ProfileIcon = (p: NavIconProps) => (
  <MaterialCommunityIcons
    name="account-circle-outline"
    size={p.size}
    color={p.color}
  />
);
export const ProfileActiveIcon = (p: NavIconProps) => (
  <MaterialCommunityIcons name="account-circle" size={p.size} color={p.color} />
);
