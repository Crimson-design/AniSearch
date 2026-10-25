import TopBar from "@/components/TopBar";
import AddAnimeForm from "@/components/AddAnimeForm";

export default function AddPage() {
  return (
    <>
      <TopBar hideAdd />
      <main className="container">
        <a href="/" className="back-link">
          ← Back to browse
        </a>
        <h1 className="section-title">Add an anime</h1>
        <AddAnimeForm />
      </main>
    </>
  );
}