


// Extension entry point
const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

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

//kurmasz

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


// Helper function to ensure personalizedQuestions.json 
// is added to .gitignore and creates .gitignore if it's not added
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













const os = require('os');
const { v4: uuidv4 } = require('uuid'); // For generating unique UUIDs

// Helper function to get the path for PersonalQuiz folder
function getPersonalQuizFolderPath() {
  const basePath = path.join(
    os.homedir(),
    'Downloads',
    'pl-gvsu-cis500dev-master',
    'questions',
    'PersonalQuiz'
  );

  // Ensure the PersonalQuiz folder exists
  if (!fs.existsSync(basePath)) {
    fs.mkdirSync(basePath, { recursive: true });
  }
  return basePath;
}

// // Helper function to get the GitHub username (mocked for simplicity)
// function getGitHubUsername() {
//   // Replace this with real GitHub username detection logic if needed
//   return 'your-github-username';
// }



// const child_process = require('child_process');

// // Helper function to get the GitHub username
// function getGitHubUsername() {
//   try {
//     // Get the workspace directory
//     const workspaceDir = vscode.workspace.workspaceFolders
//       ? vscode.workspace.workspaceFolders[0].uri.fsPath
//       : null;

//     if (!workspaceDir) {
//       vscode.window.showErrorMessage('No workspace is open.');
//       throw new Error('Workspace directory is required.');
//     }

//     // Path to the .git/config file
//     const gitConfigPath = path.join(workspaceDir, '.git', 'config');

//     if (!fs.existsSync(gitConfigPath)) {
//       vscode.window.showErrorMessage('No Git configuration found in the workspace.');
//       throw new Error('The project is not a Git repository.');
//     }

//     // Read the .git/config file
//     const gitConfigContent = fs.readFileSync(gitConfigPath, 'utf-8');

//     // Extract the GitHub URL
//     const remoteMatch = gitConfigContent.match(/url\s*=\s*git@github\.com:(.+?)\/.+\.git/);
//     if (remoteMatch && remoteMatch[1]) {
//       return remoteMatch[1]; // This is the GitHub username
//     }

//     vscode.window.showErrorMessage('Failed to detect GitHub username from the repository.');
//     throw new Error('GitHub username could not be determined.');
//   } catch (error) {
//     console.error('Error retrieving GitHub username:', error);
//     return 'unknown-user'; // Fallback username
//   }
// }



// const cp = require('child_process');

// function getGitHubUsername() {
//   try {
//     // Get the workspace directory
//     const workspaceDir = vscode.workspace.workspaceFolders
//       ? vscode.workspace.workspaceFolders[0].uri.fsPath
//       : null;

//     if (!workspaceDir) {
//       vscode.window.showErrorMessage('No workspace is open.');
//       throw new Error('Workspace directory is required.');
//     }

//     // Run the git command to get the remote URL
//     const remoteUrl = cp.execSync('git remote get-url origin', {
//       cwd: workspaceDir,
//       encoding: 'utf-8',
//     }).trim();

//     // Extract the GitHub username (handles both SSH and HTTPS)
//     const match = remoteUrl.match(
//       /(?:git@github\.com:|https:\/\/github\.com\/)([^\/]+)\/.+\.git/
//     );

//     if (match && match[1]) {
//       return match[1]; // Return the GitHub username
//     } else {
//       vscode.window.showErrorMessage('Failed to detect GitHub username from the repository.');
//       throw new Error('GitHub username could not be determined.');
//     }
//   } catch (error) {
//     vscode.window.showErrorMessage('An error occurred while retrieving the GitHub username.');
//     console.error('Error retrieving GitHub username:', error);
//     return 'unknown-user'; // Fallback username
//   }
// }

// module.exports = getGitHubUsername;



const cp = require('child_process');

function getGitHubUsername() {
  try {
    // Get the workspace directory
    const workspaceDir = vscode.workspace.workspaceFolders
      ? vscode.workspace.workspaceFolders[0].uri.fsPath
      : null;

    if (!workspaceDir) {
      vscode.window.showErrorMessage('No workspace is open.');
      throw new Error('Workspace directory is required.');
    }

    // Run the git command to get the remote URL
    const remoteUrl = cp.execSync('git remote get-url origin', {
      cwd: workspaceDir,
      encoding: 'utf-8',
    }).trim();

    // Extract the GitHub username (handles both SSH and HTTPS)
    const match = remoteUrl.match(
      /(?:git@github\.com:|https:\/\/github\.com\/)([^\/]+)\/.+\.git/
    );

    if (match && match[1]) {
      const username = match[1];

      // Get the current date and time
      const now = new Date();
      const timestamp = now.toISOString().replace(/T/, '_').replace(/:/g, '-').split('.')[0];

      // Combine timestamp and username
      const folderName = `${timestamp}-${username}`;
      return folderName;
    } else {
      vscode.window.showErrorMessage('Failed to detect GitHub username from the repository.');
      throw new Error('GitHub username could not be determined.');
    }
  } catch (error) {
    vscode.window.showErrorMessage('An error occurred while retrieving the GitHub username.');
    console.error('Error retrieving GitHub username:', error);
    return `unknown-user-${new Date().toISOString().replace(/T/, '_').replace(/:/g, '-').split('.')[0]}`;
  }
}

module.exports = getGitHubUsername;








// Helper function to create the user-specific folder
function createUserFolder() {
  const quizFolderPath = getPersonalQuizFolderPath();
  const username = getGitHubUsername();
  const userFolderPath = path.join(quizFolderPath, username);

  if (!fs.existsSync(userFolderPath)) {
    fs.mkdirSync(userFolderPath);
  }
  return userFolderPath;
}

// Helper function to generate an HTML file for personalized questions
function generateQuestionHTML(questions) {
  return questions
    .map(
      (question) => `
<pl-question-panel>
  <ol>
    <li>${question.text}</li>
  </ol>
</pl-question-panel>

<pl-rich-text-editor file-name="${question.text.toLowerCase().replace(/\\s+/g, '_')}.html"> </pl-rich-text-editor>
    `
    )
    .join('\n');
}

// Helper function to generate the info.json file
function generateInfoJSON(title) {
  return {
    uuid: uuidv4(), // Generate a unique UUID
    title: title || 'Personalized Quiz',
    topic: 'Custom Questions',
    tags: ['custom', 'quiz', 'personalized'],
    type: 'v3',
    gradingMethod: 'Manual',
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

  // Command: View all comments in a Webview
  let viewCommentsCommand = vscode.commands.registerCommand('extension.viewComments', async () => {
    if (commentsData.length === 0) {
      vscode.window.showInformationMessage('No comments added yet!');
      return;
    }

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
      return `
        <tr>
          <td>${index + 1}</td>
          <td>${comment.filePath}</td>
          <td>${range}</td>
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
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #007acc; color: white; }
          pre { background-color:rgb(0, 0, 0); padding: 5px; border-radius: 5px; }
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
              <th>Range</th>
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

        // Refresh Webview
        const updatedCommentsTable = commentsData.map((comment, index) => {
          const range = `${comment.range.start.line}:${comment.range.start.character} - ${comment.range.end.line}:${comment.range.end.character}`;
          return `
            <tr>
              <td>${index + 1}</td>
              <td>${comment.filePath}</td>
              <td>${range}</td>
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

    // Create a Webview Panel for asking a question
    const panel = vscode.window.createWebviewPanel(
      'askQuestion', // Panel ID
      'Ask Question', // Panel title
      vscode.ViewColumn.One, // Show in the active column
      { enableScripts: true } // Allow JavaScript in the Webview
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

    panel.webview.onDidReceiveMessage((message) => {
      if (message.question) {
        questionsData.push({
          filePath: editor.document.uri.fsPath,
          range: {
            start: { line: selection.start.line, character: selection.start.character },
            end: { line: selection.end.line, character: selection.end.character }
          },
          text: message.question,
          highlightedCode: selectedText,
          answer: '',
        });

        saveDataToFile('questionsData.json', questionsData); // Save data to file
        vscode.window.showInformationMessage('Question added successfully!');
        panel.dispose();
      }
    });
  });


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

    // Create a Webview Panel for answering a question
    const panel = vscode.window.createWebviewPanel(
      'answerQuestion', // Panel ID
      'Answer Question', // Panel title
      vscode.ViewColumn.One, // Show in the active column
      { enableScripts: true } // Allow JavaScript in the Webview
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

    panel.webview.onDidReceiveMessage((message) => {
      if (message.answer) {
        question.answer = message.answer;

        saveDataToFile('questionsData.json', questionsData); // Save updated data
        vscode.window.showInformationMessage('Answer added successfully!');
        panel.dispose();
      }
    });
  });


  let viewQuestionsAndAnswersCommand = vscode.commands.registerCommand('extension.viewQuestionsAndAnswers', async () => {
    if (questionsData.length === 0) {
      vscode.window.showInformationMessage('No questions or answers available yet!');
      return;
    }

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
      return `
    <tr>
      <td>${index + 1}</td>
      <td>${qa.filePath}</td>
      <td>${range}</td>
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
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #007acc; color: white; }
            pre { background-color:rgb(0, 0, 0); padding: 5px; border-radius: 5px; }
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
                <th>Range</th>
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


  // Command: Add Personalized Question
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
    const selectedText = editor.document.getText(range);

    // Create a Webview Panel for adding a personalized question
    const panel = vscode.window.createWebviewPanel(
      'addPersonalizedQuestion', // Panel ID
      'Add Personalized Question', // Panel title
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
        <title>Add Personalized Question</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          textarea { width: 100%; height: 100px; font-size: 14px; margin-bottom: 10px; }
          button { padding: 10px 20px; background: #007acc; color: white; border: none; cursor: pointer; }
          button:hover { background: #005a9e; }
        </style>
      </head>
      <body>
        <h1>Add a Personalized Question</h1>
        <p><strong>Selected Code:</strong></p>
        <pre>${selectedText}</pre>
        <textarea id="question" placeholder="Type your personalized question here..."></textarea>
        <button onclick="submitPersonalizedQuestion()">Submit</button>
        <script>
          const vscode = acquireVsCodeApi();
          function submitPersonalizedQuestion() {
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

    // Handle messages from the Webview
    panel.webview.onDidReceiveMessage((message) => {
      if (message.question) {
        personalizedQuestionsData.push({
          filePath: editor.document.uri.fsPath,
          range: {
            start: { line: selection.start.line, character: selection.start.character },
            end: { line: selection.end.line, character: selection.end.character },
          },
          text: message.question,
          highlightedCode: selectedText,
        });

        saveDataToFile('personalizedQuestions.json', personalizedQuestionsData); // Save to project base directory
        vscode.window.showInformationMessage('Personalized question added successfully!');
        panel.dispose();
      }
    });
  });


  // Command: View Personalized Questions
  let viewPersonalizedQuestionsCommand = vscode.commands.registerCommand('extension.viewPersonalizedQuestions', async () => {
    if (personalizedQuestionsData.length === 0) {
      vscode.window.showInformationMessage('No personalized questions added yet!');
      return;
    }

    // Create a Webview Panel for viewing personalized questions
    const panel = vscode.window.createWebviewPanel(
      'viewPersonalizedQuestions', // Panel ID
      'View Personalized Questions', // Panel title
      vscode.ViewColumn.One, // Show in the active column
      { enableScripts: true } // Allow JavaScript in the Webview
    );

    // Build a table with all the personalized questions
    const questionsTable = personalizedQuestionsData.map((question, index) => {
      const range = `${question.range.start.line}:${question.range.start.character} - ${question.range.end.line}:${question.range.end.character}`;
      return `
        <tr>
          <td>${index + 1}</td>
          <td>${question.filePath}</td>
          <td>${range}</td>
          <td><pre>${question.highlightedCode || 'No highlighted code'}</pre></td>
          <td>${question.text || 'No question'}</td>
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
          pre { background-color: rgb(0, 0, 0); padding: 5px; border-radius: 5px; }
        </style>
      </head>
      <body>
        <h1>All Personalized Questions</h1>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>File</th>
              <th>Range</th>
              <th>Highlighted Code</th>
              <th>Question</th>
            </tr>
          </thead>
          <tbody>
            ${questionsTable}
          </tbody>
        </table>
      </body>
      </html>
    `;
  });


  let generatePersonalizedQuizCommand = vscode.commands.registerCommand(
    'extension.generatePersonalizedQuiz',
    async () => {
      if (personalizedQuestionsData.length === 0) {
        vscode.window.showErrorMessage(
          'No personalized questions available to generate the quiz!'
        );
        return;
      }

      const userFolderPath = createUserFolder();
      const questionsHTMLPath = path.join(userFolderPath, 'question.html');
      const infoJSONPath = path.join(userFolderPath, 'info.json');

      // Generate questions.html
      const questionsHTMLContent = generateQuestionHTML(personalizedQuestionsData);
      fs.writeFileSync(questionsHTMLPath, questionsHTMLContent);

      // Generate info.json
      const infoJSONContent = generateInfoJSON('Personalized Quiz');
      fs.writeFileSync(infoJSONPath, JSON.stringify(infoJSONContent, null, 2));

      vscode.window.showInformationMessage(
        `Personalized quiz generated successfully in: ${userFolderPath}`
      );
    }
  );


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




















