import type { NextApiRequest, NextApiResponse } from 'next';
import { YoutubeTranscript } from 'youtube-transcript';
import OpenAI, { toFile } from 'openai';
import formidable, { File } from 'formidable';
import fs from 'fs';
import path from 'path';

const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });

export const config = {
  api: {
    bodyParser: false,
  },
};

// Ensure the uploads directory exists
const ensureUploadsDir = () => {
  const uploadDir = path.join(process.cwd(), 'tmp');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
  }
};

// Parse form data and save files to the uploads directory
const parseForm = (req: NextApiRequest): Promise<{ fields: formidable.Fields; files: formidable.Files }> => {
  ensureUploadsDir();
  const form = formidable({ uploadDir: path.join(process.cwd(), 'tmp'), keepExtensions: true });
  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        console.error('Error parsing form data:', err);
        reject(err);
      }
      resolve({ fields, files });
    });
  });
};

// Wait for the run to complete by polling the API
const waitForRunCompletion = async (threadId: string, runId: string) => {
  while (true) {
    const run = await openai.beta.threads.runs.retrieve(threadId, runId);
    console.log('Run status:', run.status);
    if (run.status === 'completed') {
      return run;
    }
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second
  }
};

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  try {
    console.log('Parsing form data...');
    const { fields, files } = await parseForm(req);
    console.log('Form data parsed successfully:', fields, files);

    const { lessonDescription, lessonDuration } = fields;
    const uploadedFiles: File[] = [];

    let youtubeLinks: string | any[] = [];
    if (fields) {
      for (let i = 0; i < Object.keys(fields).length; i++) {
        if (Object.keys(fields)[i].includes('youtubeLinks')) {
          // youtubeLinks.push(fields[Object.keys(fields)[i][0]]);
          let youtubeLink = fields[Object.keys(fields)[i]];
          if (youtubeLink) {
            youtubeLinks.push(youtubeLink[0]);
          }
        }
      }
    }
    
    console.log(youtubeLinks)
    // Add files from the form upload
    if (files.files) {
      const fileArray = Array.isArray(files.files) ? files.files : [files.files];
      uploadedFiles.push(...fileArray.filter((file): file is File => !!file));
    }

    // Loop through each YouTube link, get the transcript, and create a file for it in the uploads folder
    if (youtubeLinks) {
      for (let i = 0; i < youtubeLinks.length; i++) {
        const youtubeLink = youtubeLinks[i];
        if (youtubeLink) {
          try {
            console.log(`Fetching transcript for YouTube link: ${youtubeLink}`);
            const transcript = await YoutubeTranscript.fetchTranscript(youtubeLink);
            console.log(`Transcript fetched successfully for YouTube link: ${youtubeLink}`);
            
            // Create a file with the transcript
            const transcriptFile = path.join(process.cwd(), 'tmp', `transcript_${i}.txt`);
            fs.writeFileSync(transcriptFile, JSON.stringify(transcript)); // Convert transcript to a string before writing to file
            console.log(`Transcript written to file: ${transcriptFile}`);
            
            // Create a formidable file object and push to uploadedFiles
            const transcriptStats = fs.statSync(transcriptFile);
            const formidableFile: File = {
              filepath: transcriptFile,
              originalFilename: `transcript_${i}.txt`,
              mimetype: 'text/plain',
              size: transcriptStats.size,
              newFilename: `transcript_${i}.txt`,
              hashAlgorithm: false,
            } as unknown as File;
            uploadedFiles.push(formidableFile);
            console.log(`Formidable file object created and added to uploadedFiles: ${transcriptFile}`);
          } catch (error) {
            console.error(`Error fetching transcript for YouTube link: ${youtubeLink}`, error);
          }
        }
      }
    }

    console.log('Creating vector store...');
    const vectorStore = await openai.beta.vectorStores.create({
      name: 'Lesson Plan Files',
      expires_after: { anchor: 'last_active_at', days: 3 },
    });
    console.log('Vector store created:', vectorStore);

    if (uploadedFiles.length > 0) {
      console.log('Uploading files to vector store...');
      const fileUploads = await Promise.all(
        uploadedFiles.map(file =>
          toFile(fs.createReadStream(file.filepath), file.originalFilename)
        )
      );
      await openai.beta.vectorStores.fileBatches.uploadAndPoll(vectorStore.id, { files: fileUploads });
      console.log('Files uploaded successfully');
    } else {
      console.log('No files to upload.');
    }

    console.log('Creating thread...');
    const thread = await openai.beta.threads.create({
      messages: [
        {
          role: "user",
          content: `Lesson Description: ${lessonDescription}\nLesson Duration: ${lessonDuration}\nYouTube Links: ${youtubeLinks || ''}`,
        }
      ],
      tool_resources: {
        file_search: {
          vector_store_ids: [vectorStore.id]
        }
      }
    });
    console.log('Thread created:', thread);

    console.log('Creating run...');
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: process.env.ASSISTANT_ID || '',
    });
    console.log('Run created:', run);

    console.log('Waiting for run completion...');
    await waitForRunCompletion(thread.id, run.id);
    console.log('Run completed');

    console.log('Retrieving messages...');
    const messages = await openai.beta.threads.messages.list(thread.id);
    const assistantMessage = messages.data.find(msg => msg.role === 'assistant');
    
    if (!assistantMessage || !assistantMessage.content[0] || assistantMessage.content[0].type !== 'text') {
      console.error('No valid response from assistant');
      return res.status(500).json({ message: 'No valid response from assistant' });
    }

    const lessonPlan = assistantMessage.content[0].text.value;
    console.log('Generated lesson plan:', lessonPlan);

    // Delete temporary files
    uploadedFiles.forEach((file) => {
      if (file) {
        fs.unlinkSync(file.filepath);
      }
    });

    res.status(200).json({ lessonPlan });
  } catch (error) {
    console.error('Error generating lesson plan:', error);
    res.status(500).json({ message: 'Error generating lesson plan' });
  }
};