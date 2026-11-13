import NetInfo from "@react-native-community/netinfo";

/** True when the device has a connection that is not known to lack internet. */
export async function isOnline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return !!state.isConnected && state.isInternetReachable !== false;
}
