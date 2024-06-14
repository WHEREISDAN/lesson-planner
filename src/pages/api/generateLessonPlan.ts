import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI, { toFile } from 'openai';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

const openai = new OpenAI({ apiKey: 'sk-proj-SvV4F0UxwgNJJGQVWLLrT3BlbkFJAlIp9jtOXIQlgH9jMVoK' });

export const config = {
  api: {
    bodyParser: false,
  },
};

const parseForm = (req: NextApiRequest): Promise<{ fields: formidable.Fields; files: formidable.Files }> => {
  const form = formidable({ uploadDir: path.join(process.cwd(), '/uploads'), keepExtensions: true });
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

    const { lessonDescription, lessonDuration, youtubeLinks } = fields;
    const uploadedFiles = files.files ? (files.files as formidable.File[]) : [];

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
      assistant_id: 'asst_Of6FsFTFGnFnaHujvuyR392k',
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

    res.status(200).json({ lessonPlan });
  } catch (error) {
    console.error('Error generating lesson plan:', error);
    res.status(500).json({ message: 'Error generating lesson plan' });
  }
};