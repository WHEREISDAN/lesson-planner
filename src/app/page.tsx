import Image from "next/image";
import LessonForm from "../components/LessonForm";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
    <LessonForm />
  </div>
  );
}
