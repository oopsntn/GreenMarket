import { Outlet } from "react-router-dom";

function AdminLayout() {
  return (
    <div>
      <h1>GreenMarket Admin</h1>
      <hr />
      <Outlet />
    </div>
  );
}

export default AdminLayout;
