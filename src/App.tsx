import { AppRouter } from "./core/AppRouter";
import { ThemeProvider } from "./ui/designSystem";

export default function App() {
  return (
    <ThemeProvider>
      <AppRouter />
    </ThemeProvider>
  );
}
