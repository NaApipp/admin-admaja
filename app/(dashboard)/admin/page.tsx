import AddAdmin from "./Components/AddAdmin";
import DataAdmin from "./Components/DataAdmin";

export default function AdminPage() {
  return (
    <div className="w-full min-h-screen p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto flex flex-col xl:flex-row items-start gap-6">
        <div className="w-full xl:w-[400px] xl:sticky xl:top-8">
          <AddAdmin />
        </div>
        <div className="w-full flex-1">
          <DataAdmin />
        </div>
      </div>
    </div>
  );
}