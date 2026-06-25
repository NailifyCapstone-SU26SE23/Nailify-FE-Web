import { Provider } from "react-redux";
import { store } from "../../store";
import { PropTypes } from "../../shared/utils/propTypes";
import { AuthProvider } from "./AuthProvider";
import { QueryProvider } from "./QueryProvider";
import { ThemeProvider } from "./ThemeProvider";

export function AppProviders({ children }) {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <QueryProvider>
          <AuthProvider>{children}</AuthProvider>
        </QueryProvider>
      </ThemeProvider>
    </Provider>
  );
}

AppProviders.propTypes = {
  children: PropTypes.node.isRequired,
};
