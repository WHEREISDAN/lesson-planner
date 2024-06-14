# EduPlan

## Overview
This project is a web application designed to help teachers create comprehensive lesson plans with ease. It allows users to input lesson descriptions, durations, YouTube links, and supporting documents. It utilizes OpenAI's API to generate detailed lesson plans based on the provided inputs.

## Features
- Form Submission: Input fields for lesson description, duration, YouTube links, and file uploads.
- YouTube Transcript Integration: Automatically fetches transcripts for provided YouTube links.
- Responsive Design: Ensures a seamless experience across devices.
- Local Storage: Saves generated lesson plans in local storage to prevent data loss on page refresh.
- Loading Indicator: Displays a loading indicator while the lesson plan is being generated.

## Technologies Used
- Frontend: React, Tailwind CSS, React Loading Indicators, Markdown to JSX
- Backend: Next.js API Routes, OpenAI API, Formidable for file handling, YouTube Transcript Fetching

## Setup Instructions
1. Clone the repository:
    ```sh
    git clone https://github.com/whereisdan/eduplan.git
    cd eduplan
    ```
2. Install the necessary packages:
    ```sh
    npm install
    ```
3. Create a `.env` file in the root of the project and add your environment variables:
    ```env
    OPENAI_KEY=your_openai_api_key_here
    ASSISTANT_ID=assistant_id
    ```
4. Start the development server:
    ```sh
    npm run dev
    ```
5. Open your browser and navigate to `http://localhost:3000`.

## Project Structure
- Frontend: Located in `src/components/LessonForm.tsx`
- API Routes: Located in `src/pages/api/generateLessonPlan.ts`

## Deployment
To deploy the project, follow the hosting provider's instructions for deploying a Next.js application. Ensure you set up the necessary environment variables on the hosting platform.

## Contributing
I welcome contributions! Please follow these steps to contribute:
1. Fork the repository.
2. Create a new branch (`git checkout -b feature/your-feature`).
3. Commit your changes (`git commit -m 'Add some feature'`).
4. Push to the branch (`git push origin feature/your-feature`).
5. Open a pull request.

## License
This project is licensed under the MIT License. 