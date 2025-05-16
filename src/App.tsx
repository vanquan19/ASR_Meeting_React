import AppRoutes from "./routes/AppRoutes";
import { ToastContainer } from "react-toastify";

function App() {
  return (
    <>
      <AppRoutes />
      {/* Toast notifications */}
      <ToastContainer />
    </>
  );
}

export default App;
