import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider } from "react-redux";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { store } from "./src/store";
import AppNavigator from "./src/navigation/AppNavigator";
import ErrorBoundary from "./src/components/ErrorBoundary";
import { initNetworkMonitoring } from "./src/utils/networkService";
import { StyleSheet } from "react-native";

function App(): React.JSX.Element {
  useEffect(() => {
    // Initialize network monitoring
    initNetworkMonitoring();
  }, []);

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={styles.container}>
        <Provider store={store}>
          <SafeAreaProvider>
            <NavigationContainer>
              <AppNavigator />
            </NavigationContainer>
          </SafeAreaProvider>
        </Provider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
