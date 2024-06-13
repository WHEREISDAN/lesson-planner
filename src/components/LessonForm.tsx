"use client"; // Add this line at the top

import { useState } from 'react';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from '../../firebase'; // Import the storage instance

const LessonForm = () => {
  const [lessonDescription, setLessonDescription] = useState('');
  const [lessonDuration, setLessonDuration] = useState('');
  const [youtubeLinks, setYoutubeLinks] = useState<string[]>([]);
  const [files, setFiles] = useState<FileList | null>(null);
  const [lessonPlan, setLessonPlan] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const uploadedFileURLs: string[] = [];

    if (files) {
      const uploadPromises = Array.from(files).map(async (file) => {
        const storageRef = ref(storage, `uploads/${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
      });

      uploadedFileURLs.push(...await Promise.all(uploadPromises));
    }

    const formData = {
      lessonDescription,
      lessonDuration,
      youtubeLinks,
      files: uploadedFileURLs,
    };

    const response = await fetch('/api/generateLessonPlan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });
    const data = await response.json();
    setLessonPlan(data.lessonPlan);
  };

  const handleAddYoutubeLink = () => {
    setYoutubeLinks([...youtubeLinks, '']);
  };

  const handleYoutubeLinkChange = (index: number, value: string) => {
    const newLinks = [...youtubeLinks];
    newLinks[index] = value;
    setYoutubeLinks(newLinks);
  };

  return (
    <div className="max-w-md mx-auto p-4 bg-white shadow-md rounded-lg">
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
      {lessonPlan && (
        <div className="mt-4 p-4 bg-gray-100 rounded-lg">
          <h2 className="text-lg font-bold">Generated Lesson Plan</h2>
          <p>{lessonPlan}</p>
        </div>
      )}
    </div>
  );
};

export default LessonForm;