import dynamic from 'next/dynamic';

const LessonForm = dynamic(() => import('../components/LessonForm'), { ssr: false });

export default function Home() {
  return (
    <div className="min-h-screen flex bg-gray-100">
      <LessonForm />
    </div>
  );
}