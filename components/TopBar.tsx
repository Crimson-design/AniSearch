import AuthMenu from "@/components/AuthMenu";
import AddButton from "@/components/AddButton";
import SearchBar from "@/components/SearchBar";

export default function TopBar({ hideAdd = false }: { hideAdd?: boolean }) {
  return (
    <>
      <header className="topbar">
        <a href="/" className="brand">
          Anime<span>Search</span>
        </a>
        <SearchBar />
        <AuthMenu />
      </header>
      {!hideAdd && <AddButton />}
    </>
  );
}