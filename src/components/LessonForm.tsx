"use client";

import { useState, useEffect } from 'react';
import Markdown from 'markdown-to-jsx';
import 'tailwindcss/tailwind.css';

const LessonForm = () => {
  const [lessonDescription, setLessonDescription] = useState('');
  const [lessonDuration, setLessonDuration] = useState('');
  const [youtubeLinks, setYoutubeLinks] = useState<string[]>([]);
  const [files, setFiles] = useState<FileList | null>(null);
  const [lessonPlan, setLessonPlan] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  const handleAddYoutubeLink = () => {
    setYoutubeLinks([...youtubeLinks, '']);
  };

  const handleYoutubeLinkChange = (index: number, value: string) => {
    const newLinks = [...youtubeLinks];
    newLinks[index] = value;
    setYoutubeLinks(newLinks);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('lessonDescription', lessonDescription);
    formData.append('lessonDuration', lessonDuration);
    youtubeLinks.forEach((link, index) => {
      formData.append(`youtubeLinks[${index}]`, link);
    });
    if (files) {
      Array.from(files).forEach((file) => {
        formData.append('files', file);
      });
    }

    try {
      const response = await fetch('/api/generateLessonPlan', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        setLessonPlan(data.lessonPlan);
        setVisible(true);  // Show the lesson plan
      } else {
        console.error(data.message);
      }
    } catch (error) {
      console.error('Error submitting form', error);
    }
  };

  useEffect(() => {
    if (lessonPlan) {
      setVisible(true);
    }
  }, [lessonPlan]);

  return (
    <div className="flex justify-center items-start space-x-4 p-4">
      <div className="w-full max-w-md h-full p-4 bg-white shadow-md rounded-lg">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Lesson Description</label>
            <textarea
              value={lessonDescription}
              onChange={(e) => setLessonDescription(e.target.value)}
              className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none"
              rows={4}
            ></textarea>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Lesson Duration (minutes)</label>
            <input
              type="number"
              value={lessonDuration}
              onChange={(e) => setLessonDuration(e.target.value)}
              className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">YouTube Links</label>
            {youtubeLinks.map((link, index) => (
              <input
                key={index}
                type="text"
                value={link}
                onChange={(e) => handleYoutubeLinkChange(index, e.target.value)}
                className="w-full px-3 py-2 mb-2 text-gray-700 border rounded-lg focus:outline-none"
              />
            ))}
            <button
              type="button"
              onClick={handleAddYoutubeLink}
              className="px-3 py-2 bg-blue-500 text-white rounded-lg"
            >
              Add Another Link
            </button>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Supporting Documents</label>
            <input
              type="file"
              multiple
              onChange={(e) => setFiles(e.target.files)}
              className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none"
            />
          </div>
          <div className="mb-4">
            <button type="submit" className="w-full px-3 py-2 bg-green-500 text-white rounded-lg">
              Generate Lesson Plan
            </button>
          </div>
        </form>
      </div>
      {lessonPlan && (
        <div className={`w-full max-w-2xl p-4 bg-white text-gray-700 shadow-md rounded-lg overflow-auto transition-opacity duration-500 ease-in-out ${visible ? 'opacity-100' : 'opacity-0'}`} style={{ height: 'calc(100vh - 2rem)' }}>
          <h2 className="text-lg font-bold">Generated Lesson Plan</h2>
          <Markdown className="prose">{lessonPlan}</Markdown>
        </div>
      )}
    </div>
  );
};

export default LessonForm;