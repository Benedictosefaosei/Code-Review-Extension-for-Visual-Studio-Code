// Extension entry point
const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid'); // For generating unique UUIDs

// In-memory storage for comments and questions
const commentsData = [];
const questionsData = [];
let personalizedQuestionsData = [];

// Helper function to get the workspace directory
function getWorkspaceDirectory() {
  if (vscode.workspace.workspaceFolders) {
    return vscode.workspace.workspaceFolders[0].uri.fsPath;
  } else {
    vscode.window.showErrorMessage("No workspace folder is open.");
    throw new Error("Workspace folder is required to save data.");
  }
}

// Helper function to save data to a file in the workspace directory
function saveDataToFile(fileName, data) {
  const workspaceDir = getWorkspaceDirectory();
  const filePath = path.join(workspaceDir, fileName);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// Helper function to load data from a file in the workspace directory
function loadDataFromFile(fileName) {
  const workspaceDir = getWorkspaceDirectory();
  const filePath = path.join(workspaceDir, fileName);
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }
  return [];
}

// Helper function to ensure personalizedQuestions.json is added to .gitignore
function ensureGitIgnoreForPersonalizedQuestions() {
  const workspaceDir = getWorkspaceDirectory();
  const gitignorePath = path.join(workspaceDir, ".gitignore");
  const personalizedQuestionsFile = "personalizedQuestions.json";

  let gitignoreContent = "";

  // Check if .gitignore exists
  if (fs.existsSync(gitignorePath)) {
    gitignoreContent = fs.readFileSync(gitignorePath, "utf-8");

    // If personalizedQuestions.json is not already in .gitignore, add it
    if (!gitignoreContent.split("\n").includes(personalizedQuestionsFile)) {
      gitignoreContent += `\n${personalizedQuestionsFile}\n`;
      fs.writeFileSync(gitignorePath, gitignoreContent);
    }
  } else {
    // Create a .gitignore file and add personalizedQuestions.json
    fs.writeFileSync(gitignorePath, `${personalizedQuestionsFile}\n`);
  }
}

// Helper function to extract student name from filePath
function extractStudentName(filePath) {
  const parts = filePath.split(path.sep);

  // First, check if the path contains an email address
  for (let part of parts) {
    if (part.includes('@')) {
      return part; // Return the email address as the student name
    }
  }

  // If no email is found, check for the folder structure with student names
  for (let i = 0; i < parts.length; i++) {
    if (parts[i].startsWith('CIS')) {
      // The next part should be the student's name
      if (i + 1 < parts.length) {
        return parts[i + 1]; // Return the student's name
      }
    }
  }

  // If no student name is found, return 'unknown_user'
  return 'unknown_user';
}


function generateQuestionHTML(questionData, language) {
  return `<pl-question-panel>
<markdown>
${questionData.text.trim()}
</markdown>
<pl-code language="${language}">
${questionData.highlightedCode.trim()}
</pl-code>
</pl-question-panel>
<pl-rich-text-editor file-name="answer.rtf"></pl-rich-text-editor>`;
}

// Helper function to generate info.json content
function generateInfoJSON(title, topic) {
  return {
    uuid: uuidv4(),
    type: "v3",
    title,
    topic
  };
}

/**
 * Activate the extension
 * @param {vscode.ExtensionContext} context 
 */
function activate(context) {
  // Load persisted data
  commentsData.push(...loadDataFromFile('commentsData.json'));
  questionsData.push(...loadDataFromFile('questionsData.json'));
  personalizedQuestionsData.push(...loadDataFromFile('personalizedQuestions.json'));

  // Ensure personalizedQuestions.json is in .gitignore
  ensureGitIgnoreForPersonalizedQuestions();

  // Command: Highlight code and add a comment
  let highlightAndCommentCommand = vscode.commands.registerCommand('extension.highlightAndComment', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active editor found.');
      return;
    }

    const selection = editor.selection;
    if (selection.isEmpty) {
      vscode.window.showErrorMessage('Please select a code snippet to comment on.');
      return;
    }

    const range = new vscode.Range(selection.start, selection.end);
    const selectedText = editor.document.getText(range);

    // Create a Webview Panel for adding a comment
    const panel = vscode.window.createWebviewPanel(
      'addComment', // Panel ID
      'Add Comment', // Panel title
      vscode.ViewColumn.One, // Show in the active column
      { enableScripts: true } // Allow JavaScript in the Webview
    );

    // HTML content for the Webview
    panel.webview.html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Add Comment</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          textarea { width: 100%; height: 100px; font-size: 14px; margin-bottom: 10px; }
          button { padding: 10px 20px; background: #007acc; color: white; border: none; cursor: pointer; }
          button:hover { background: #005a9e; }
        </style>
      </head>
      <body>
        <h1>Add a Comment</h1>
        <p><strong>Selected Code:</strong></p>
        <pre>${selectedText}</pre>
        <textarea id="comment" placeholder="Write your comment here..."></textarea>
        <button onclick="submitComment()">Submit Comment</button>
        <script>
          const vscode = acquireVsCodeApi();
          function submitComment() {
            const comment = document.getElementById('comment').value;
            if (comment.trim() === '') {
              alert('Comment cannot be empty!');
              return;
            }
            vscode.postMessage({ comment });
          }
        </script>
      </body>
      </html>
    `;

    // Handle messages from the Webview
    panel.webview.onDidReceiveMessage((message) => {
      if (message.comment) {
        // Save the comment
        commentsData.push({
          filePath: editor.document.uri.fsPath,
          range: {
            start: { line: selection.start.line, character: selection.start.character },
            end: { line: selection.end.line, character: selection.end.character },
          },
          text: message.comment,
          highlightedCode: selectedText, // Save the highlighted code
          replies: [],
          resolved: false, // Add resolved field
        });

        // Persist data
        saveDataToFile('commentsData.json', commentsData);

        const decorationType = vscode.window.createTextEditorDecorationType({
          backgroundColor: 'rgba(144,238,144,0.5)', // Light green highlight
        });
        editor.setDecorations(decorationType, [range]);

        vscode.window.showInformationMessage('Comment added successfully!');
        panel.dispose();
      }
    });
  });

  // Command: View comments
  let viewCommentsCommand = vscode.commands.registerCommand('extension.viewComments', async () => {
    if (commentsData.length === 0) {
      vscode.window.showInformationMessage('No comments added yet!');
      return;
    }

    const truncateCharacters = (text, charLimit) => {
      return text.length > charLimit ? text.slice(0, charLimit) + '...' : text;
    };

    // Create a Webview Panel for viewing comments
    const panel = vscode.window.createWebviewPanel(
      'viewComments', // Panel ID
      'View Comments', // Panel title
      vscode.ViewColumn.One, // Show in the active column
      { enableScripts: true } // Allow JavaScript in the Webview
    );

    // Build a table with all the comments
    const commentsTable = commentsData.map((comment, index) => {
      const range = `${comment.range.start.line}:${comment.range.start.character} - ${comment.range.end.line}:${comment.range.end.character}`;

      // Extract only the last two parts of the file path for display
      const filePathParts = comment.filePath.split('/');
      let shortenedFilePath = filePathParts.length > 2
        ? `.../${filePathParts.slice(-3).join('/')}`
        : comment.filePath;
      shortenedFilePath = truncateCharacters(shortenedFilePath, 30);

      return `
        <tr>
            <td>${index + 1}</td>
            <td title="${comment.filePath}">${shortenedFilePath}</td>
            <td><pre><code class="language-javascript">${comment.highlightedCode || 'No highlighted code'}</code></pre></td>
            <td>${comment.text || 'No text'}</td>
            <td>
                ${comment.resolved ? 'Resolved' : `<button onclick="resolveComment(${index})">Resolve</button>`}
            </td>
        </tr>
        `;
    }).join('');

    // HTML content for the Webview
    panel.webview.html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>View Comments</title>
            <link href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism.min.css" rel="stylesheet" />
            <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js"></script>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-javascript.min.js"></script>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
                th { background-color: #007acc; color: white; }
                pre { background-color: rgb(0, 0, 0); padding: 5px; border-radius: 5px; color: white; }
                code { font-family: "Fira Code", monospace; font-size: 14px; }
            </style>
        </head>
        <body>
            <h1>All Comments</h1>
            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>File</th>
                        <th>Highlighted Code</th>
                        <th>Comment</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${commentsTable}
                </tbody>
            </table>
            <script>
                const vscode = acquireVsCodeApi();

                function resolveComment(index) {
                    vscode.postMessage({ command: 'resolve', index });
                }
            </script>
        </body>
        </html>
    `;

    // Handle messages from the Webview
    panel.webview.onDidReceiveMessage((message) => {
      if (message.command === 'resolve') {
        commentsData[message.index].resolved = true;
        saveDataToFile('commentsData.json', commentsData);

        const truncateCharacters = (text, charLimit) => {
          return text.length > charLimit ? text.slice(0, charLimit) + '...' : text;
        };

        // Refresh Webview
        const updatedCommentsTable = commentsData.map((comment, index) => {
          const range = `${comment.range.start.line}:${comment.range.start.character} - ${comment.range.end.line}:${comment.range.end.character}`;

          const filePathParts = comment.filePath.split('/');
          let shortenedFilePath = filePathParts.length > 2
            ? `.../${filePathParts.slice(-3).join('/')}`
            : comment.filePath;
          shortenedFilePath = truncateCharacters(shortenedFilePath, 30);

          return `
                <tr>
                    <td>${index + 1}</td>
                    <td title="${comment.filePath}">${shortenedFilePath}</td>
                    <td><pre><code class="language-javascript">${comment.highlightedCode || 'No highlighted code'}</code></pre></td>
                    <td>${comment.text || 'No text'}</td>
                    <td>
                        ${comment.resolved ? 'Resolved' : `<button onclick="resolveComment(${index})">Resolve</button>`}
                    </td>
                </tr>
                `;
        }).join('');
        panel.webview.html = panel.webview.html.replace(/<tbody>[\s\S]*?<\/tbody>/, `<tbody>${updatedCommentsTable}</tbody>`);
      }
    });
  });




  // // Command: Ask a question
  // let askQuestionCommand = vscode.commands.registerCommand('extension.askQuestion', async () => {
  //   const editor = vscode.window.activeTextEditor;
  //   if (!editor) {
  //     vscode.window.showErrorMessage('No active editor found.');
  //     return;
  //   }

  //   const selection = editor.selection;
  //   if (selection.isEmpty) {
  //     vscode.window.showErrorMessage('Please select a code snippet to ask a question about.');
  //     return;
  //   }

  //   const range = new vscode.Range(selection.start, selection.end);
  //   const selectedText = editor.document.getText(range);

  //   // Create a Webview Panel for asking a question
  //   const panel = vscode.window.createWebviewPanel(
  //     'askQuestion', // Panel ID
  //     'Ask Question', // Panel title
  //     vscode.ViewColumn.One, // Show in the active column
  //     { enableScripts: true } // Allow JavaScript in the Webview
  //   );

  //   panel.webview.html = `
  // <!DOCTYPE html>
  // <html lang="en">
  // <head>
  //   <meta charset="UTF-8">
  //   <meta name="viewport" content="width=device-width, initial-scale=1.0">
  //   <title>Ask Question</title>
  //   <style>
  //     body { font-family: Arial, sans-serif; margin: 20px; }
  //     textarea { width: 100%; height: 80px; font-size: 14px; margin-bottom: 10px; }
  //     button { padding: 10px 20px; background: #007acc; color: white; border: none; cursor: pointer; }
  //     button:hover { background: #005a9e; }
  //   </style>
  // </head>
  // <body>
  //   <h1>Ask a Question</h1>
  //   <p><strong>Selected Code:</strong></p>
  //   <pre>${selectedText}</pre>
  //   <textarea id="question" placeholder="Type your question here..."></textarea>
  //   <button onclick="submitQuestion()">Submit Question</button>
  //   <script>
  //     const vscode = acquireVsCodeApi();
  //     function submitQuestion() {
  //       const question = document.getElementById('question').value;
  //       if (question.trim() === '') {
  //         alert('Question cannot be empty!');
  //         return;
  //       }
  //       vscode.postMessage({ question });
  //     }
  //   </script>
  // </body>
  // </html>
  // `;

  //   panel.webview.onDidReceiveMessage((message) => {
  //     if (message.question) {
  //       questionsData.push({
  //         filePath: editor.document.uri.fsPath,
  //         range: {
  //           start: { line: selection.start.line, character: selection.start.character },
  //           end: { line: selection.end.line, character: selection.end.character }
  //         },
  //         text: message.question,
  //         highlightedCode: selectedText,
  //         answer: '',
  //       });

  //       saveDataToFile('questionsData.json', questionsData); // Save data to file
  //       vscode.window.showInformationMessage('Question added successfully!');
  //       panel.dispose();
  //     }
  //   });
  // });


  // // Command: Answer a question
  // let answerQuestionCommand = vscode.commands.registerCommand('extension.answerQuestion', async () => {
  //   if (questionsData.length === 0) {
  //     vscode.window.showInformationMessage('No questions asked yet!');
  //     return;
  //   }

  //   const questionItems = questionsData.map((q, index) => ({
  //     label: `Q${index + 1}: ${q.text}`,
  //     detail: q.highlightedCode || 'No highlighted code',
  //     index,
  //   }));

  //   const selectedQuestion = await vscode.window.showQuickPick(questionItems, {
  //     placeHolder: 'Select a question to answer',
  //   });

  //   if (!selectedQuestion) {
  //     return;
  //   }

  //   const question = questionsData[selectedQuestion.index];

  //   // Create a Webview Panel for answering a question
  //   const panel = vscode.window.createWebviewPanel(
  //     'answerQuestion', // Panel ID
  //     'Answer Question', // Panel title
  //     vscode.ViewColumn.One, // Show in the active column
  //     { enableScripts: true } // Allow JavaScript in the Webview
  //   );

  //   panel.webview.html = `
  //             <!DOCTYPE html>
  //             <html lang="en">
  //             <head>
  //             <meta charset="UTF-8">
  //             <meta name="viewport" content="width=device-width, initial-scale=1.0">
  //             <title>Answer Question</title>
  //             <style>
  //                 body { font-family: Arial, sans-serif; margin: 20px; }
  //                 textarea { width: 100%; height: 80px; font-size: 14px; margin-bottom: 10px; }
  //                 button { padding: 10px 20px; background: #007acc; color: white; border: none; cursor: pointer; }
  //                 button:hover { background: #005a9e; }
  //             </style>
  //             </head>
  //             <body>
  //             <h1>Answer a Question</h1>
  //             <p><strong>Question:</strong> ${question.text}</p>
  //             <p><strong>Highlighted Code:</strong></p>
  //             <pre>${question.highlightedCode || 'No highlighted code'}</pre>
  //             <textarea id="answer" placeholder="Type your answer here..."></textarea>
  //             <button onclick="submitAnswer()">Submit Answer</button>
  //             <script>
  //                 const vscode = acquireVsCodeApi();
  //                 function submitAnswer() {
  //                 const answer = document.getElementById('answer').value;
  //                 if (answer.trim() === '') {
  //                     alert('Answer cannot be empty!');
  //                     return;
  //                 }
  //                 vscode.postMessage({ answer });
  //                 }
  //             </script>
  //             </body>
  //             </html>
  //             `;

  //   panel.webview.onDidReceiveMessage((message) => {
  //     if (message.answer) {
  //       question.answer = message.answer;

  //       saveDataToFile('questionsData.json', questionsData); // Save updated data
  //       vscode.window.showInformationMessage('Answer added successfully!');
  //       panel.dispose();
  //     }
  //   });
  // });



  // // Command: View questions and answers
  // let viewQuestionsAndAnswersCommand = vscode.commands.registerCommand('extension.viewQuestionsAndAnswers', async () => {
  //   if (questionsData.length === 0) {
  //     vscode.window.showInformationMessage('No questions or answers available yet!');
  //     return;
  //   }

  //   // Create a Webview Panel for viewing questions and answers
  //   const panel = vscode.window.createWebviewPanel(
  //     'viewQuestionsAndAnswers', // Panel ID
  //     'View Questions and Answers', // Panel title
  //     vscode.ViewColumn.One, // Show in the active column
  //     { enableScripts: true } // Allow JavaScript in the Webview
  //   );

  //   // Build a table with all the questions and answers
  //   const questionsTable = questionsData.map((qa, index) => {
  //     const range = `${qa.range.start.line}:${qa.range.start.character} - ${qa.range.end.line}:${qa.range.end.character}`;

  //     // Extract only the last two parts of the file path for display
  //     const filePathParts = qa.filePath.split('/');

  //     const truncateCharacters = (text, charLimit) => {
  //       return text.length > charLimit ? text.slice(0, charLimit) + '...' : text;
  //     };
  //     let shortenedFilePath = filePathParts.length > 2
  //       ? `.../${filePathParts.slice(-3).join('/')}`
  //       : qa.filePath;
  //     shortenedFilePath = truncateCharacters(shortenedFilePath, 30);

  //     return `
  //         <tr>
  //             <td>${index + 1}</td>
  //             <td title="${qa.filePath}">${shortenedFilePath}</td>
  //             <td><pre>${qa.highlightedCode || 'No highlighted code'}</pre></td>
  //             <td>${qa.text || 'No question'}</td>
  //             <td>${qa.answer || 'No answer'}</td>
  //         </tr>
  //         `;
  //   }).join('');

  //   // HTML content for the Webview
  //   panel.webview.html = `
  //         <!DOCTYPE html>
  //         <html lang="en">
  //         <head>
  //             <meta charset="UTF-8">
  //             <meta name="viewport" content="width=device-width, initial-scale=1.0">
  //             <title>View Questions and Answers</title>
  //             <style>
  //                 body { font-family: Arial, sans-serif; margin: 20px; }
  //                 table { width: 100%; border-collapse: collapse; margin-top: 20px; }
  //                 th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
  //                 th { background-color: #007acc; color: white; }
  //                 pre { background-color: rgb(0, 0, 0); padding: 5px; border-radius: 5px; color: white; }
  //                 button { margin-top: 20px; padding: 10px 20px; background: #007acc; color: white; border: none; cursor: pointer; }
  //                 button:hover { background: #005a9e; }
  //             </style>
  //         </head>
  //         <body>
  //             <h1>All Questions and Answers</h1>
  //             <table>
  //                 <thead>
  //                     <tr>
  //                         <th>#</th>
  //                         <th>File</th>
  //                         <th>Highlighted Code</th>
  //                         <th>Question</th>
  //                         <th>Answer</th>
  //                     </tr>
  //                 </thead>
  //                 <tbody>
  //                     ${questionsTable}
  //                 </tbody>
  //             </table>
  //             <button id="export">Export to CSV</button>
  //             <script>
  //                 document.getElementById('export').addEventListener('click', () => {
  //                     const rows = [
  //                         ['#', 'File', 'Range', 'Highlighted Code', 'Question', 'Answer'],
  //                         ...${JSON.stringify(questionsData.map((qa, index) => [
  //     index + 1,
  //     qa.filePath,
  //     `${qa.range.start.line}:${qa.range.start.character} - ${qa.range.end.line}:${qa.range.end.character}`,
  //     qa.highlightedCode || 'No highlighted code',
  //     qa.text || 'No question',
  //     qa.answer || 'No answer'
  //   ]))}
  //                     ];

  //                     const csvContent = rows.map(e => e.join(",")).join("\n");
  //                     const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  //                     const url = URL.createObjectURL(blob);
  //                     const link = document.createElement('a');
  //                     link.setAttribute('href', url);
  //                     link.setAttribute('download', 'questions_and_answers.csv');
  //                     document.body.appendChild(link);
  //                     link.click();
  //                     document.body.removeChild(link);
  //                 });
  //             </script>
  //         </body>
  //         </html>
  //     `;
  // });






  // Helper function to get the base workspace directory (CIS500_P1)
  function getBaseWorkspaceDirectory() {
    if (vscode.workspace.workspaceFolders) {
      return vscode.workspace.workspaceFolders[0].uri.fsPath;
    } else {
      vscode.window.showErrorMessage("No workspace folder is open.");
      throw new Error("Workspace folder is required to save data.");
    }
  }

  // Helper function to get student directory from file path
  function getStudentDirectory(filePath) {
    const parts = filePath.split(path.sep);
    const baseDir = getBaseWorkspaceDirectory();
    const baseParts = baseDir.split(path.sep);

    // Find the index where the student name should be (right after base directory)
    const studentIndex = baseParts.length;
    if (parts.length > studentIndex) {
      return path.join(baseDir, parts[studentIndex]);
    }
    return null;
  }

  // Modified save functions
  function saveQuestionData(questionData, filePath) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(questionData, null, 2));
  }

  function loadQuestionData(filePath) {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
    return [];
  }

  // Command: Ask a question
  let askQuestionCommand = vscode.commands.registerCommand('extension.askQuestion', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active editor found.');
      return;
    }

    const selection = editor.selection;
    if (selection.isEmpty) {
      vscode.window.showErrorMessage('Please select a code snippet to ask a question about.');
      return;
    }

    const range = new vscode.Range(selection.start, selection.end);
    const selectedText = editor.document.getText(range);
    const filePath = editor.document.uri.fsPath;

    // Create a Webview Panel for asking a question
    const panel = vscode.window.createWebviewPanel(
      'askQuestion',
      'Ask Question',
      vscode.ViewColumn.One,
      { enableScripts: true }
    );

    panel.webview.html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ask Question</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 20px; }
      textarea { width: 100%; height: 80px; font-size: 14px; margin-bottom: 10px; }
      button { padding: 10px 20px; background: #007acc; color: white; border: none; cursor: pointer; }
      button:hover { background: #005a9e; }
    </style>
  </head>
  <body>
    <h1>Ask a Question</h1>
    <p><strong>Selected Code:</strong></p>
    <pre>${selectedText}</pre>
    <textarea id="question" placeholder="Type your question here..."></textarea>
    <button onclick="submitQuestion()">Submit Question</button>
    <script>
      const vscode = acquireVsCodeApi();
      function submitQuestion() {
        const question = document.getElementById('question').value;
        if (question.trim() === '') {
          alert('Question cannot be empty!');
          return;
        }
        vscode.postMessage({ question });
      }
    </script>
  </body>
  </html>
  `;

    panel.webview.onDidReceiveMessage(async (message) => {
      if (message.question) {
        const baseDir = getBaseWorkspaceDirectory();
        const studentDir = getStudentDirectory(filePath);

        const newQuestion = {
          filePath,
          range: {
            start: { line: selection.start.line, character: selection.start.character },
            end: { line: selection.end.line, character: selection.end.character }
          },
          text: message.question,
          highlightedCode: selectedText,
          answer: '',
          timestamp: new Date().toISOString()
        };

        try {
          // Save to global questions file
          const globalQuestionsPath = path.join(baseDir, 'questionsData.json');
          const globalQuestions = loadQuestionData(globalQuestionsPath);
          globalQuestions.push(newQuestion);
          saveQuestionData(globalQuestions, globalQuestionsPath);

          // Save to student-specific questions file if student directory exists
          if (studentDir) {
            const studentQuestionsPath = path.join(studentDir, 'questionsData.json');
            const studentQuestions = loadQuestionData(studentQuestionsPath);
            studentQuestions.push(newQuestion);
            saveQuestionData(studentQuestions, studentQuestionsPath);
          }

          // Update in-memory data
          questionsData.push(newQuestion);

          vscode.window.showInformationMessage('Question added successfully!');
          panel.dispose();
        } catch (error) {
          vscode.window.showErrorMessage(`Failed to save question: ${error.message}`);
        }
      }
    });
  });

  // Command: Answer a question
  let answerQuestionCommand = vscode.commands.registerCommand('extension.answerQuestion', async () => {
    if (questionsData.length === 0) {
      vscode.window.showInformationMessage('No questions asked yet!');
      return;
    }

    const questionItems = questionsData.map((q, index) => ({
      label: `Q${index + 1}: ${q.text}`,
      detail: q.highlightedCode || 'No highlighted code',
      index,
    }));

    const selectedQuestion = await vscode.window.showQuickPick(questionItems, {
      placeHolder: 'Select a question to answer',
    });

    if (!selectedQuestion) {
      return;
    }

    const question = questionsData[selectedQuestion.index];
    const filePath = question.filePath;
    const baseDir = getBaseWorkspaceDirectory();
    const studentDir = getStudentDirectory(filePath);

    // Create a Webview Panel for answering a question
    const panel = vscode.window.createWebviewPanel(
      'answerQuestion',
      'Answer Question',
      vscode.ViewColumn.One,
      { enableScripts: true }
    );

    panel.webview.html = `
              <!DOCTYPE html>
              <html lang="en">
              <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Answer Question</title>
              <style>
                  body { font-family: Arial, sans-serif; margin: 20px; }
                  textarea { width: 100%; height: 80px; font-size: 14px; margin-bottom: 10px; }
                  button { padding: 10px 20px; background: #007acc; color: white; border: none; cursor: pointer; }
                  button:hover { background: #005a9e; }
              </style>
              </head>
              <body>
              <h1>Answer a Question</h1>
              <p><strong>Question:</strong> ${question.text}</p>
              <p><strong>Highlighted Code:</strong></p>
              <pre>${question.highlightedCode || 'No highlighted code'}</pre>
              <textarea id="answer" placeholder="Type your answer here..."></textarea>
              <button onclick="submitAnswer()">Submit Answer</button>
              <script>
                  const vscode = acquireVsCodeApi();
                  function submitAnswer() {
                  const answer = document.getElementById('answer').value;
                  if (answer.trim() === '') {
                      alert('Answer cannot be empty!');
                      return;
                  }
                  vscode.postMessage({ answer });
                  }
              </script>
              </body>
              </html>
              `;

    panel.webview.onDidReceiveMessage(async (message) => {
      if (message.answer) {
        question.answer = message.answer;

        try {
          // Update global questions file
          const globalQuestionsPath = path.join(baseDir, 'questionsData.json');
          const globalQuestions = loadQuestionData(globalQuestionsPath);
          const globalIndex = globalQuestions.findIndex(q =>
            q.filePath === question.filePath &&
            q.range.start.line === question.range.start.line &&
            q.timestamp === question.timestamp
          );
          if (globalIndex !== -1) {
            globalQuestions[globalIndex].answer = message.answer;
            saveQuestionData(globalQuestions, globalQuestionsPath);
          }

          // Update student-specific questions file if exists
          if (studentDir) {
            const studentQuestionsPath = path.join(studentDir, 'questionsData.json');
            if (fs.existsSync(studentQuestionsPath)) {
              const studentQuestions = loadQuestionData(studentQuestionsPath);
              const studentIndex = studentQuestions.findIndex(q =>
                q.filePath === question.filePath &&
                q.range.start.line === question.range.start.line &&
                q.timestamp === question.timestamp
              );
              if (studentIndex !== -1) {
                studentQuestions[studentIndex].answer = message.answer;
                saveQuestionData(studentQuestions, studentQuestionsPath);
              }
            }
          }

          vscode.window.showInformationMessage('Answer added successfully!');
          panel.dispose();
        } catch (error) {
          vscode.window.showErrorMessage(`Failed to save answer: ${error.message}`);
        }
      }
    });
  });

  // Command: View questions and answers
  let viewQuestionsAndAnswersCommand = vscode.commands.registerCommand('extension.viewQuestionsAndAnswers', async () => {
    // This can remain largely the same, but we should load from both locations
    const baseDir = getBaseWorkspaceDirectory();
    const globalQuestionsPath = path.join(baseDir, 'questionsData.json');

    let allQuestions = [];

    // Load global questions
    if (fs.existsSync(globalQuestionsPath)) {
      allQuestions.push(...loadQuestionData(globalQuestionsPath));
    }

    // Load student-specific questions
    const studentDirs = fs.readdirSync(baseDir)
      .filter(name => !name.includes('.') && name !== 'node_modules'); // Simple filter for student directories

    for (const studentDir of studentDirs) {
      const studentQuestionsPath = path.join(baseDir, studentDir, 'questionsData.json');
      if (fs.existsSync(studentQuestionsPath)) {
        allQuestions.push(...loadQuestionData(studentQuestionsPath));
      }
    }

    // Remove duplicates (same question in both files)
    const uniqueQuestions = allQuestions.filter((question, index, self) =>
      index === self.findIndex(q =>
        q.filePath === question.filePath &&
        q.range.start.line === question.range.start.line &&
        q.timestamp === question.timestamp
      )
    );

    if (uniqueQuestions.length === 0) {
      vscode.window.showInformationMessage('No questions or answers available yet!');
      return;
    }

    // Update in-memory data
    questionsData.length = 0;
    questionsData.push(...uniqueQuestions);

    // Rest of your existing viewQuestionsAndAnswersCommand implementation...
    // (the Webview panel creation and HTML generation)

    // Create a Webview Panel for viewing questions and answers
    const panel = vscode.window.createWebviewPanel(
      'viewQuestionsAndAnswers', // Panel ID
      'View Questions and Answers', // Panel title
      vscode.ViewColumn.One, // Show in the active column
      { enableScripts: true } // Allow JavaScript in the Webview
    );

    // Build a table with all the questions and answers
    const questionsTable = questionsData.map((qa, index) => {
      const range = `${qa.range.start.line}:${qa.range.start.character} - ${qa.range.end.line}:${qa.range.end.character}`;

      // Extract only the last two parts of the file path for display
      const filePathParts = qa.filePath.split('/');

      const truncateCharacters = (text, charLimit) => {
        return text.length > charLimit ? text.slice(0, charLimit) + '...' : text;
      };
      let shortenedFilePath = filePathParts.length > 2
        ? `.../${filePathParts.slice(-3).join('/')}`
        : qa.filePath;
      shortenedFilePath = truncateCharacters(shortenedFilePath, 30);

      return `
          <tr>
              <td>${index + 1}</td>
              <td title="${qa.filePath}">${shortenedFilePath}</td>
              <td><pre>${qa.highlightedCode || 'No highlighted code'}</pre></td>
              <td>${qa.text || 'No question'}</td>
              <td>${qa.answer || 'No answer'}</td>
          </tr>
          `;
    }).join('');

    // HTML content for the Webview
    panel.webview.html = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>View Questions and Answers</title>
              <style>
                  body { font-family: Arial, sans-serif; margin: 20px; }
                  table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                  th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
                  th { background-color: #007acc; color: white; }
                  pre { background-color: rgb(0, 0, 0); padding: 5px; border-radius: 5px; color: white; }
                  button { margin-top: 20px; padding: 10px 20px; background: #007acc; color: white; border: none; cursor: pointer; }
                  button:hover { background: #005a9e; }
              </style>
          </head>
          <body>
              <h1>All Questions and Answers</h1>
              <table>
                  <thead>
                      <tr>
                          <th>#</th>
                          <th>File</th>
                          <th>Highlighted Code</th>
                          <th>Question</th>
                          <th>Answer</th>
                      </tr>
                  </thead>
                  <tbody>
                      ${questionsTable}
                  </tbody>
              </table>
              <button id="export">Export to CSV</button>
              <script>
                  document.getElementById('export').addEventListener('click', () => {
                      const rows = [
                          ['#', 'File', 'Range', 'Highlighted Code', 'Question', 'Answer'],
                          ...${JSON.stringify(questionsData.map((qa, index) => [
      index + 1,
      qa.filePath,
      `${qa.range.start.line}:${qa.range.start.character} - ${qa.range.end.line}:${qa.range.end.character}`,
      qa.highlightedCode || 'No highlighted code',
      qa.text || 'No question',
      qa.answer || 'No answer'
    ]))}
                      ];

                      const csvContent = rows.map(e => e.join(",")).join("\n");
                      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.setAttribute('href', url);
                      link.setAttribute('download', 'questions_and_answers.csv');
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                  });
              </script>
          </body>
          </html>
      `;
  });































  let addPersonalizedQuestionCommand = vscode.commands.registerCommand('extension.addPersonalizedQuestion', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active editor found.');
      return;
    }

    const selection = editor.selection;
    if (selection.isEmpty) {
      vscode.window.showErrorMessage('Please select a code snippet to add a personalized question.');
      return;
    }

    const range = new vscode.Range(selection.start, selection.end);
    let selectedText = editor.document.getText(range);

    // Create a Webview Panel for adding a personalized question
    const panel = vscode.window.createWebviewPanel(
      'addPersonalizedQuestion',
      'Add Personalized Question',
      vscode.ViewColumn.One,
      { enableScripts: true }
    );

    // HTML content for the Webview
    panel.webview.html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Add Personalized Question</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                textarea { width: 100%; font-size: 14px; margin-bottom: 10px; display: block; }
                button { padding: 10px 20px; background: #007acc; color: white; border: none; cursor: pointer; margin-right: 10px; }
                button:hover { background: #005a9e; }
                .code-area { width: 100%; height: 120px; font-family: monospace; background: #f4f4f4; padding: 10px; border-radius: 5px; }
            </style>
        </head>
        <body>
            <h1>Add a Personalized Question</h1>

            <p><strong>Edit Highlighted Code:</strong></p>
            <textarea id="codeBlock" class="code-area">${selectedText}</textarea>
            <button onclick="copyAndPasteCode()">Copy & Paste Code</button>
            <button onclick="saveCode()">Save Code</button>
            
            <p><strong>Add Your Question:</strong></p>
            <textarea id="question" placeholder="Type your personalized question here..." rows="4"></textarea>
            
            <button onclick="submitPersonalizedQuestion()">Submit</button>

            <script>
                const vscode = acquireVsCodeApi();

                function copyAndPasteCode() {
                    const codeText = document.getElementById('codeBlock').value;
                    const questionArea = document.getElementById('question');
                    const existingContent = questionArea.value.trim();
                    
                    // Format the code block with ~~~ before and after
                    const formattedCode = \`~~~\\n\${codeText}\\n~~~\`;

                    if (existingContent) {
                        questionArea.value = existingContent + "\\n\\n" + formattedCode;
                    } else {
                        questionArea.value = formattedCode;
                    }
                }

                function saveCode() {
                    const updatedCode = document.getElementById('codeBlock').value;
                    vscode.postMessage({ updatedCode });
                }

                function submitPersonalizedQuestion() {
                    const question = document.getElementById('question').value;
                    const editedCode = document.getElementById('codeBlock').value;
                    
                    if (question.trim() === '') {
                        alert('Question cannot be empty!');
                        return;
                    }

                    vscode.postMessage({ question, editedCode });
                }
            </script>
        </body>
        </html>
    `;

    // Handle messages from the Webview
    panel.webview.onDidReceiveMessage((message) => {
      if (message.editedCode) {
        vscode.window.showInformationMessage('Code updated successfully!');
        selectedText = message.editedCode;
      }

      if (message.question && message.editedCode) {
        personalizedQuestionsData.push({
          filePath: editor.document.uri.fsPath,
          range: {
            start: { line: selection.start.line, character: selection.start.character },
            end: { line: selection.end.line, character: selection.end.character },
          },
          text: message.question,
          highlightedCode: message.editedCode,
        });

        saveDataToFile('personalizedQuestions.json', personalizedQuestionsData);
        vscode.window.showInformationMessage('Personalized question added successfully!');
        panel.dispose();
      }
    });
  });

  function openEditQuestionPanel(index) {
    const question = personalizedQuestionsData[index];

    // Create a Webview Panel for editing the question
    const panel = vscode.window.createWebviewPanel(
      'editQuestion',
      'Edit Question',
      vscode.ViewColumn.One,
      { enableScripts: true }
    );

    // HTML content for the Webview
    panel.webview.html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Edit Question</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        textarea { width: 100%; height: 200px; font-size: 14px; margin-bottom: 10px; }
        button { padding: 10px 20px; background: #007acc; color: white; border: none; cursor: pointer; }
        button:hover { background: #005a9e; }
      </style>
    </head>
    <body>
      <h1>Edit Question</h1>
      <p><strong>Question:</strong></p>
      <textarea id="question">${question.text || 'No question'}</textarea>
      <p><strong>Highlighted Code:</strong></p>
      <textarea id="code">${question.highlightedCode || 'No highlighted code'}</textarea>
      <button onclick="saveChanges()">Save</button>
      <script>
        const vscode = acquireVsCodeApi();

        function saveChanges() {
          const updatedQuestion = document.getElementById('question').value;
          const updatedCode = document.getElementById('code').value;
          vscode.postMessage({ type: 'saveChanges', index: ${index}, updatedQuestion, updatedCode });
        }
      </script>
    </body>
    </html>
  `;

    // Handle messages from the Webview
    panel.webview.onDidReceiveMessage((message) => {
      if (message.type === 'saveChanges') {
        // Update the data in memory
        personalizedQuestionsData[message.index].text = message.updatedQuestion;
        personalizedQuestionsData[message.index].highlightedCode = message.updatedCode;

        saveDataToFile('personalizedQuestions.json', personalizedQuestionsData);
        vscode.window.showInformationMessage('Changes saved successfully!');
        panel.dispose(); // Close the edit panel
      }
    });
  }

  // Command: View personalized questions
  let viewPersonalizedQuestionsCommand = vscode.commands.registerCommand('extension.viewPersonalizedQuestions', async () => {
    if (personalizedQuestionsData.length === 0) {
      vscode.window.showInformationMessage('No personalized questions added yet!');
      return;
    }

    // Create a Webview Panel for viewing personalized questions
    const panel = vscode.window.createWebviewPanel(
      'viewPersonalizedQuestions',
      'View Personalized Questions',
      vscode.ViewColumn.One,
      { enableScripts: true }
    );

    const truncateCharacters = (text, charLimit) => {
      return text.length > charLimit ? text.slice(0, charLimit) + '...' : text;
    };

    // Build a table with editable fields, revert button, and a checkbox inside the Actions column
    const questionsTable = personalizedQuestionsData.map((question, index) => {
      const filePathParts = question.filePath.split('/');
      let shortenedFilePath = filePathParts.length > 2
        ? `.../${filePathParts.slice(-3).join('/')}`
        : question.filePath;

      shortenedFilePath = truncateCharacters(shortenedFilePath, 30);

      return `
      <tr id="row-${index}">
        <td>${index + 1}</td>
        <td title="${question.filePath}">${shortenedFilePath}</td>
        <td>
          <textarea class="code-area" id="code-${index}">${question.highlightedCode || 'No highlighted code'}</textarea>
        </td>
        <td>
          <textarea class="question-area" id="question-${index}">${question.text || 'No question'}</textarea>
        </td>
        <td>
          <button onclick="saveChanges(${index})">Save</button>
          <button onclick="revertChanges(${index})" style="background-color: orange; color: white;">Revert</button>
          <button onclick="editQuestion(${index})" style="background-color: green; color: white;">Edit</button>
          <br>
          <input type="checkbox" id="exclude-${index}" ${question.excludeFromQuiz ? 'checked' : ''} onchange="toggleExclude(${index})">
          <label for="exclude-${index}">Exclude from Quiz</label>
        </td>
      </tr>
    `;
    }).join('');

    // HTML content for the Webview
    panel.webview.html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>View Personalized Questions</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #007acc; color: white; }
        textarea { width: 100%; height: 100px; font-size: 14px; border: 1px solid #ccc; padding: 5px; }
        .code-area { background-color: rgb(0, 0, 0); color: white; font-family: monospace; }
        .question-area { background-color: #f4f4f4; color: black; font-family: sans-serif; }
        button { padding: 5px 10px; margin: 5px; cursor: pointer; }
        input[type="checkbox"] { transform: scale(1.2); margin-top: 5px; }
      </style>
    </head>
    <body>
      <h1>All Personalized Questions</h1>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>File</th>
            <th>Highlighted Code</th>
            <th>Question</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${questionsTable}
        </tbody>
      </table>

      <script>
        const vscode = acquireVsCodeApi();
        const originalData = JSON.parse(JSON.stringify(${JSON.stringify(personalizedQuestionsData)}));

        function saveChanges(index) {
          const updatedCode = document.getElementById('code-' + index).value;
          const updatedQuestion = document.getElementById('question-' + index).value;
          vscode.postMessage({ type: 'saveChanges', index, updatedCode, updatedQuestion });
        }

        function revertChanges(index) {
          document.getElementById('code-' + index).value = originalData[index].highlightedCode;
          document.getElementById('question-' + index).value = originalData[index].text;
          document.getElementById('exclude-' + index).checked = originalData[index].excludeFromQuiz;
        }

        function toggleExclude(index) {
          const excludeStatus = document.getElementById('exclude-' + index).checked;
          vscode.postMessage({ type: 'toggleExclude', index, excludeStatus });
        }

        function editQuestion(index) {
          vscode.postMessage({ type: 'editQuestion', index });
        }
      </script>
    </body>
    </html>
  `;

    // Handle messages from the Webview
    panel.webview.onDidReceiveMessage((message) => {
      if (message.type === 'saveChanges') {
        // Update the data in memory
        personalizedQuestionsData[message.index].highlightedCode = message.updatedCode;
        personalizedQuestionsData[message.index].text = message.updatedQuestion;

        saveDataToFile('personalizedQuestions.json', personalizedQuestionsData);
        vscode.window.showInformationMessage('Changes saved successfully!');
      }

      if (message.type === 'toggleExclude') {
        // Save exclude checkbox status automatically
        personalizedQuestionsData[message.index].excludeFromQuiz = message.excludeStatus;
        saveDataToFile('personalizedQuestions.json', personalizedQuestionsData);
      }

      if (message.type === 'editQuestion') {
        // Open a new webview panel for editing the question
        openEditQuestionPanel(message.index);
      }
    });
  });





  let generatePersonalizedQuizCommand = vscode.commands.registerCommand(
    'extension.generatePersonalizedQuiz',
    async () => {
      if (personalizedQuestionsData.length === 0) {
        vscode.window.showErrorMessage('No personalized questions available to generate the quiz!');
        return;
      }

      // Prompt user to select the config file
      const configFileUri = await vscode.window.showOpenDialog({
        canSelectFolders: false,
        canSelectFiles: true,
        canSelectMany: false,
        openLabel: 'Select Config File',
        filters: { 'JSON Files': ['json'] },
        defaultUri: vscode.Uri.file(path.join(vscode.workspace.rootPath, 'cqlc.config.json'))
      });

      if (!configFileUri || configFileUri.length === 0) {
        vscode.window.showErrorMessage('No config file selected.');
        return;
      }

      const configFilePath = configFileUri[0].fsPath;

      // Load config file
      let config;
      try {
        const configFileContent = fs.readFileSync(configFilePath, 'utf8');
        config = JSON.parse(configFileContent);
      } catch (error) {
        vscode.window.showErrorMessage(`Error reading config file: ${error.message}`);
        return;
      }

      // Validate required fields in config
      const requiredFields = [
        'title', 'topic', 'folder', 'pl_root', 'pl_question_root', 'pl_assessment_root',
        'set', 'number', 'points_per_question', 'startDate', 'endDate', 'timeLimitMin',
        'daysForGrading', 'reviewEndDate', 'language'
      ];
      for (const field of requiredFields) {
        if (!config[field]) {
          vscode.window.showErrorMessage(`Missing required field in config: ${field}`);
          return;
        }
      }

      // Construct paths
      const questionsFolderPath = path.join(config.pl_root, 'questions', config.pl_question_root, config.folder);
      const assessmentFolderPath = path.join(config.pl_root, config.pl_assessment_root, config.folder);

      // Ensure directories exist
      if (!fs.existsSync(questionsFolderPath)) {
        fs.mkdirSync(questionsFolderPath, { recursive: true });
      }
      if (!fs.existsSync(assessmentFolderPath)) {
        fs.mkdirSync(assessmentFolderPath, { recursive: true });
      }

      // Extract student names from file paths
      function extractStudentName(filePath) {
        const parts = filePath.split(path.sep);

        // First, check if the path contains an email address
        for (let part of parts) {
          if (part.includes('@')) {
            return part; // Return the email address as the student name
          }
        }

        // If no email is found, check for the folder structure with student names
        for (let i = 0; i < parts.length; i++) {
          if (parts[i].startsWith('CIS')) {
            // The next part should be the student's name
            if (i + 1 < parts.length) {
              return parts[i + 1]; // Return the student's name
            }
          }
        }

        // If no student name is found, return 'unknown_user'
        return 'unknown_user';
      }

      // Group questions by student
      const questionsByStudent = {};
      for (const question of personalizedQuestionsData) {
        const studentName = extractStudentName(question.filePath);
        if (!questionsByStudent[studentName]) {
          questionsByStudent[studentName] = [];
        }
        questionsByStudent[studentName].push(question);
      }

      // Generate questions and info.json files for each student
      for (const [studentName, questions] of Object.entries(questionsByStudent)) {
        // Create the student's question folder
        const studentQuestionFolderPath = path.join(questionsFolderPath, studentName);
        if (!fs.existsSync(studentQuestionFolderPath)) {
          fs.mkdirSync(studentQuestionFolderPath, { recursive: true });
        }

        // Generate question.html and info.json for each question
        for (const [index, question] of questions.entries()) {
          const questionFolderPath = path.join(studentQuestionFolderPath, `question${index + 1}`);
          if (!fs.existsSync(questionFolderPath)) {
            fs.mkdirSync(questionFolderPath, { recursive: true });
          }

          // Create question.html
          const questionHTMLPath = path.join(questionFolderPath, 'question.html');
          const questionHTMLContent = generateQuestionHTML(question, config.language);
          fs.writeFileSync(questionHTMLPath, questionHTMLContent);

          // Create info.json
          const infoJSONPath = path.join(questionFolderPath, 'info.json');
          fs.writeFileSync(infoJSONPath, JSON.stringify({
            uuid: uuidv4(),
            type: "v3",
            title: `${config.title} Q${index + 1}`,
            topic: config.topic
          }, null, 2));
        }

        // Create the student's assessment folder
        const studentAssessmentFolderPath = path.join(assessmentFolderPath, studentName);
        if (!fs.existsSync(studentAssessmentFolderPath)) {
          fs.mkdirSync(studentAssessmentFolderPath, { recursive: true });
        }

        // Generate infoAssessment.json
        const infoAssessmentPath = path.join(studentAssessmentFolderPath, 'infoAssessment.json');
        const infoAssessmentContent = {
          uuid: uuidv4(),
          type: "Exam",
          title: config.title,
          set: config.set,
          number: config.number,
          allowAccess: [
            {
              mode: "Public",
              uids: [studentName],
              credit: 100,
              timeLimitMin: config.timeLimitMin,
              startDate: config.startDate,
              endDate: config.endDate,
              ...(config.password && { password: config.password }) // Add password if provided
            },
            {
              mode: "Public",
              credit: 0,
              startDate: new Date(new Date(config.startDate).getTime() + config.daysForGrading * 86400000).toISOString(),
              endDate: config.reviewEndDate,
              active: false
            }
          ],
          zones: [
            {
              questions: questions.map((q, index) => ({
                id: `${config.pl_question_root}/${config.folder}/${studentName}/question${index + 1}`,
                points: config.points_per_question
              }))
            }
          ]
        };

        fs.writeFileSync(infoAssessmentPath, JSON.stringify(infoAssessmentContent, null, 2));
      }

      vscode.window.showInformationMessage(`Personalized quiz saved in: ${questionsFolderPath}`);
    }
  );

  // Register all commands
  context.subscriptions.push(
    highlightAndCommentCommand,
    viewCommentsCommand,
    askQuestionCommand,
    answerQuestionCommand,
    viewQuestionsAndAnswersCommand,
    addPersonalizedQuestionCommand,
    viewPersonalizedQuestionsCommand,
    generatePersonalizedQuizCommand
  );
}

/**
 * Deactivate the extension
 */
function deactivate() { }

module.exports = {
  activate,
  deactivate,
};