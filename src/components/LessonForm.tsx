"use client";

import { useState, useEffect } from 'react';
import Markdown from 'markdown-to-jsx';
import 'tailwindcss/tailwind.css';
import { Mosaic } from 'react-loading-indicators';

const LessonForm = () => {
  // State variables to manage the form inputs and lesson plan
  const [lessonDescription, setLessonDescription] = useState('');
  const [lessonDuration, setLessonDuration] = useState('');
  const [youtubeLinks, setYoutubeLinks] = useState<string[]>([]);
  const [files, setFiles] = useState<FileList | null>(null);
  const [lessonPlan, setLessonPlan] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Effect to load the lesson plan from local storage when the component mounts
  useEffect(() => {
    const storedLessonPlan = localStorage.getItem('lessonPlan');
    if (storedLessonPlan) {
      setLessonPlan(storedLessonPlan);
      setVisible(true);
    }
  }, []);

  // Handler to add a new YouTube link input field
  const handleAddYoutubeLink = () => {
    setYoutubeLinks([...youtubeLinks, '']);
  };

  // Handler to update YouTube link input fields
  const handleYoutubeLinkChange = (index: number, value: string) => {
    const newLinks = [...youtubeLinks];
    newLinks[index] = value;
    setYoutubeLinks(newLinks);
  };

  // Handler to submit the form and generate the lesson plan
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData();
    formData.append('lessonDescription', lessonDescription);
    formData.append('lessonDuration', lessonDuration);
    youtubeLinks.forEach((link, index) => {
      formData.append(`youtubeLinks[${index}]`, String(link));
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
        localStorage.setItem('lessonPlan', data.lessonPlan); // Store the lesson plan in local storage
        setVisible(true);  // Show the lesson plan
      } else {
        console.error(data.message);
      }
    } catch (error) {
      console.error('Error submitting form', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Effect to set visibility when lessonPlan is updated
  useEffect(() => {
    if (lessonPlan) {
      setVisible(true);
    }
  }, [lessonPlan]);

  return (
    <div className="flex flex-col lg:flex-row justify-center items-start space-y-4 lg:space-y-0 lg:space-x-4 p-4 w-screen">
      {/* Form container */}
      <div className="w-full lg:max-w-lg h-full md:mx-w-3xl sm:max-w-3xl p-4 bg-white shadow-md rounded-lg">
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

      {/* Display generated lesson plan or loading indicator */}
      <div className='w-full p-4 bg-white text-gray-700 shadow-md rounded-lg overflow-auto' style={{ height: 'calc(100vh - 2rem)' }}>
        {isLoading ? (
          <div className="w-full p-4 text-gray-700 flex justify-center items-center" style={{ height: 'calc(100vh - 2rem)' }}>
            <Mosaic color="#f3f4f6" size="medium" text="" textColor="" />
          </div>
        ) : (
          lessonPlan && (
            <div className={`w-full p-4 text-gray-700 h-11/12 transition-opacity duration-500 ease-in-out ${visible ? 'opacity-100' : 'opacity-0'}`} style={{ height: 'calc(100vh - 2rem)' }}>
              <h2 className="text-lg font-bold">Generated Lesson Plan</h2>
              <Markdown className="prose">{lessonPlan}</Markdown>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default LessonForm;