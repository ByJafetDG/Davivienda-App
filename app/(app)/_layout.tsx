import { Stack } from "expo-router";

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "fade_from_bottom",
      }}
    >
      <Stack.Screen name="home" />
      <Stack.Screen name="transfer" />
      <Stack.Screen name="confirm-transfer" />
      <Stack.Screen name="mobile-recharge" />
      <Stack.Screen name="scan" />
      <Stack.Screen name="profile" />
    </Stack>
  );
}
