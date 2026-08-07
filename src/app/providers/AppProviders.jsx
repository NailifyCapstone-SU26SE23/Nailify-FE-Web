import { Provider } from "react-redux";
import { store } from "../../store";
import { PropTypes } from "../../shared/utils/propTypes";
import { AuthProvider } from "./AuthProvider";
import { QueryProvider } from "./QueryProvider";
import { ThemeProvider } from "./ThemeProvider";
import { LanguageProvider } from "./LanguageProvider";

export function AppProviders({ children }) {
  return (
    <Provider store={store}>
      <LanguageProvider>
        <ThemeProvider>
          <QueryProvider>
            <AuthProvider>{children}</AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </LanguageProvider>
    </Provider>
  );
}

AppProviders.propTypes = {
  children: PropTypes.node.isRequired,
};
