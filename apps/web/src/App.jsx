import { BrowserRouter } from "react-router-dom";
import Routers from "./services/routers";

export default function App() {
  return (
    <BrowserRouter>
      <Routers />
    </BrowserRouter>
  );
}