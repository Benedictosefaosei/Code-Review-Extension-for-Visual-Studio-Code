# Code Review Extension

Welcome to the **Prairielearn Code Review Extension**! The Code Review Extension is a helpful Visual Studio Code (VS Code) tool built for instructors, teaching assistants, and developers who use PrairieLearn. It makes giving feedback on code easier by letting educators highlight sections, ask questions, and leave comments right inside VS Code. Students and developers can then respond, discuss improvements, and learn from the feedback. The extension also helps instructors quickly turn code reviews into quizzes and assignments on PrairieLearn, saving time and making lessons more interactive—all without switching between different apps.

---

## **Features**

### How to Use**:
  1. Highlight a code snippet in the editor.
  2. Ask Practice Question
  3. Answer Practice Question
  4. View Practice Questions and Answers
  5. Add Quiz Question
  6. View Quiz Questions
  7. Generate Quiz Questions


### 1. Highlight a code snippet in the editor.
- **How to Use**:
  1. The "Highlight a Code Snippet in the Editor" feature works by first validating an active text editor and a non-empty selection. When triggered, it captures the selected code range and applies a visual highlight using VS Code’s TextEditorDecorationType. The highlight persists in the editor but does not modify the actual file content, serving purely as a temporary visual marker for user reference. The feature relies on VS Code’s built-in decoration API to manage the highlight’s appearance and removal.
  

### 2. Ask Practice Question
- **How to Use**:
  1. Open the Command Palette (Ctrl+Shift+P or Cmd+Shift+P) and select "Ask Practice Question".
  2. Select a code snippet in the active editor (must be a valid, non-empty selection).
  3. A panel will open where you can:
     - View the selected code (editable before submission).
     - Type your question about the code.
     - Submit the question, which will be saved in questionsData.json.
  4. The question will be stored with metadata including:
     - The file path where the question was asked.
     - The exact code range (line numbers and characters).
     - The highlighted code snippet.
     - The question text.

  - **Note**
    - Questions can later be answered via the "Answer Question" command.
    - All questions are visible in the "View Questions and Answers" panel.
    - Works per-student if used in a structured workspace (e.g., CIS500/student_name/).
  

### 3. Answer Practice Question
- **How to Use**:
  1. Open the Command Palette (Ctrl+Shift+P or Cmd+Shift+P) and select "Answer Practice Question".
  2. A list of all unanswered questions will appear in a Quick Pick menu.
  3. Select a question to answer.
  4. A panel will open showing:
   - The original question.
   - The highlighted code snippet.
   - A text area to type your answer.
   - A copy and paste feature that can copy the entire highlighted code snippet and paste it in the text box
  5. Submit your answer to save it.
  - **What Happens:**
    - The answer is stored with the question in questionsData.json.
    - The question is marked as answered and can be viewed later.
    - If the workspace has student-specific folders (e.g., CIS500/student_name/), the answer is saved in both:
    - The global questionsData.json (for instructor reference).
    - The student's questionsData.json (for personalized tracking).
  - **Notes:**
    - Answers can be viewed or exported via "View Questions and Answers".
    - Supports rich text formatting in answers.
    - Questions can be filtered by student or file in structured workspaces.

### 4. View Practice Questions and Answers
- **How to Use**:
  1. Open the Command Palette (Ctrl+Shift+P or Cmd+Shift+P) and select "View Questions and Answers".
  2. A webview panel will open displaying:
    - A sortable table of all questions and answers.
    - Columns showing:
      - Question number
      - Source file path (shortened for readability)
      - Highlighted code snippet
      - Full question text
      - Given answer (if available)
  3. Key Features:
    - Export Capability: Click the "Export to CSV" button to save all Q&A data for record-keeping.
    - Smart Filtering:
      - Questions are automatically grouped by student in structured workspaces
      - Unanswered questions appear highlighted
    - Code Display:
      - Syntax-highlighted code snippets
      - Full code visibility with horizontal scrolling
    - Data Management:
      - Pulls from both:
        - Central questionsData.json (all questions)
        - Student-specific files (in individual folders)
      - Maintains original formatting of questions and answers

### 5. Add Quiz Question
- **How to Use**:
  1. Open the Command Palette (Ctrl+Shift+P/Cmd+Shift+P) and select "Add Quiz Question".
  2. Highlight the relevant code snippet in your editor (must be non-empty).
  3. An interactive panel opens with:
    - Editable code display (modify the snippet before creating question)
    - Question input field (supports markdown formatting)
    - Quick-action buttons:
      - "Copy Code to Question" (auto-formats with code fences)
      - "Save as Draft" (stores unfinished questions)
  **What Happens:**
    1. When you use the "Add Quiz Question" feature:
      - Your selected code snippet is captured and displayed in an editable panel.
      - Your question text is saved with:
        - The original file path
        - Exact code range (start/end lines)
        - The highlighted code itself
      - The question gets stored in personalizedQuestions.json in your workspace.
      - You can later:
        - View all questions using "View Personalized Questions"
        - Include them in quizzes with "Generate Personalized Quiz"

### 6. View Quiz Questions
- **How to Use**:
  1. Open the Command Palette (Ctrl+Shift+P/Cmd+Shift+P) and select "View Personalized Questions".
  2. A panel opens showing all saved quiz questions in a table format.
  3. What You See:
    - Each question displays:
      - The source file location (shortened path)
      - The actual code snippet referenced
      - The full question text
      - An "Exclude from Quiz" checkbox
    - Interactive controls to:
      - Edit question text or code snippet
      - Delete unwanted questions
      - Toggle exclusion from future quizzes
  4. Key Notes:
    - Changes save automatically when you close the panel
    - Excluded questions remain stored but won't appear in generated quizzes
    - Plain text display without extra formatting or metadata

### 7. Generate Quiz Questions
- **How to Use**:
  1. Open the Command Palette (Ctrl+Shift+P/Cmd+Shift+P) and select "Generate Personalized Quiz".
  2. Select a config file (cqlc.config.json) when prompted. Below is a sample of the config file
  3. The system automatically:
    - Collects all non-excluded questions from personalizedQuestions.json
    - Groups them by student based on file paths
    - Generates individual quiz folders for each student
  4. What Gets Created:
    - For each student:
      - A question bank folder with:
        - question.html files (containing question text + code snippets)
        - info.json files (with unique IDs and basic metadata)
      - An assessment folder with:
        - infoAssessment.json (quiz settings like time limits and access dates)
  5. Configuration File Sample
      - Below is an example configuration file used in the extension:

      ```json
      {
          "title": "Dass",
          "topic": "dayyy",
          "folder": "osei",
          "pl_root": "/Users/benedictoseisefa/Desktop/pl-gvsu-cis500dev-master",
          "pl_question_root": "PersonalQuiz",
          "pl_assessment_root": "courseInstances/TemplateCourseInstance/assessments",
          "set": "Custom Quiz",
          "number": "2",
          "points_per_question": 10,
          "startDate": "2025-03-22T10:30:00",
          "endDate": "2025-03-22T16:30:40",
          "timeLimitMin": 30,
          "daysForGrading": 7,
          "reviewEndDate": "2025-04-21T23:59:59",
          "password": "letMeIn",
          "language": "python"
      }

    - Configuration Fields Explained

      | Field                | Description                                           | Example Value |
      |----------------------|-------------------------------------------------------|--------------|
      | `title`             | The title of the quiz or assessment.                  | "Dass"       |
      | `topic`             | The topic associated with the quiz.                    | "dayyy"      |
      | `folder`            | The folder where the quiz is stored.                   | "osei"       |
      | `pl_root`           | Root directory for quiz configurations.                | "/Users/.../pl-gvsu-cis500dev-master" |
      | `pl_question_root`  | Directory for personal quiz questions.                 | "PersonalQuiz" |
      | `pl_assessment_root`| Path to assessment storage within a course.            | "courseInstances/TemplateCourseInstance/assessments" |
      | `set`               | Type of quiz set.                                      | "Custom Quiz" |
      | `number`            | Number of questions in the quiz.                       | 2            |
      | `points_per_question` | Points assigned to each question.                   | 10           |
      | `startDate`         | Start date and time for the quiz.                      | "2025-03-22T10:30:00" |
      | `endDate`           | End date and time for the quiz.                        | "2025-03-22T16:30:40" |
      | `timeLimitMin`      | Time limit for completing the quiz in minutes.         | 30           |
      | `daysForGrading`    | Number of days allowed for grading.                    | 7            |
      | `reviewEndDate`     | Deadline for reviewing the quiz results.               | "2025-04-21T23:59:59" |
      | `password`          | Password required to access the quiz.                  | "letMeIn"    |
      | `language`          | Programming language used for quiz questions.          | "python"     |


  6. Output Location:
    - Creates structured folders under:
      - prairielearn/questions/ (for question content)
      - prairielearn/assessments/ (for quiz settings)
    - Important Notes:
      - Only includes questions NOT marked "exclude from quiz"
      - Preserves original code formatting from student submissions



---

## **Installation**

1. Open Visual Studio Code.
2. Go to the Extensions Marketplace (`Ctrl+Shift+X` or `Cmd+Shift+X` on Mac).
3. Search for **Prairielearn Code Review Extension**.
4. Click **Install**.


## **Commands and Shortcuts**
| Command                                | Shortcut            | Context Menu Option              |
|----------------------------------------|---------------------|----------------------------------|
| Ask Practice Question                  | `Ctrl+Shift+P`      | Yes                              |
| Answer Practice Question               | `Ctrl+Shift+P`      | Yes                              |
| View Practice Questions and Answers    | `Ctrl+Shift+P`      | No                               |
| Add Quiz Question                      | `Ctrl+Shift+P`      | No                               |
| View Quiz Questions                    | `Ctrl+Shift+P`      | No                               |
| Generate Quiz Questions                | `Ctrl+Shift+P`      | Non                              |

---


## **Contributing**

If you find a bug or have an idea for an improvement, feel free to contribute!

1. Fork this repository.
2. Create a new branch (`git checkout -b feature/my-feature`).
3. Commit your changes (`git commit -am 'Add some feature'`).
4. Push to the branch (`git push origin feature/my-feature`).
5. Open a pull request.

---

## **License**

This extension is licensed under the [MIT License](https://opensource.org/licenses/MIT).

