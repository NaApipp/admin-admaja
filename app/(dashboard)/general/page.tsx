import Header from "./components/Header"
import TotalMemberActive from "./components/TotalMemberActive"
import TotalAdmin from "./components/TotalAdmin"
import DataAdmin from "./components/DataAdmin"

export default function GeneralPage() {
    return (
        <div>
            <Header />
            <div className="flex flex-col md:flex-row gap-2">
                <TotalMemberActive />
                <TotalAdmin />
            </div>
            <DataAdmin />
        </div>
    )
}