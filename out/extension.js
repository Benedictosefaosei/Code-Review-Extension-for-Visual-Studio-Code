var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
    }
    else {
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
    }
    else {
        // Create a .gitignore file and add personalizedQuestions.json
        fs.writeFileSync(gitignorePath, `${personalizedQuestionsFile}\n`);
    }
}
const os = require('os');
const { v4: uuidv4 } = require('uuid'); // For generating unique UUIDs
// Helper function to get the path for the PersonalQuiz folder
function getPersonalQuizFolderPath() {
    return __awaiter(this, void 0, void 0, function* () {
        // Show an open dialog for the user to select the folder
        const folderUri = yield vscode.window.showOpenDialog({
            canSelectFolders: true,
            canSelectFiles: false,
            canSelectMany: false,
            openLabel: 'Select Questions Folder'
        });
        // If the user cancels the dialog, return null
        if (!folderUri || folderUri.length === 0) {
            vscode.window.showErrorMessage('No folder selected. Please select a valid folder.');
            return null;
        }
        // Construct the PersonalQuiz folder path inside the selected folder
        const basePath = path.join(folderUri[0].fsPath, 'PersonalQuiz');
        // Ensure the PersonalQuiz folder exists
        if (!fs.existsSync(basePath)) {
            fs.mkdirSync(basePath, { recursive: true });
        }
        return basePath;
    });
}
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
        const match = remoteUrl.match(/(?:git@github\.com:|https:\/\/github\.com\/)([^\/]+)\/.+\.git/);
        if (match && match[1]) {
            const username = match[1];
            // Get the current date and time
            const now = new Date();
            const timestamp = now.toISOString().replace(/T/, '_').replace(/:/g, '-').split('.')[0];
            // Combine timestamp and username
            const folderName = `${timestamp}-${username}`;
            return folderName;
        }
        else {
            vscode.window.showErrorMessage('Failed to detect GitHub username from the repository.');
            throw new Error('GitHub username could not be determined.');
        }
    }
    catch (error) {
        vscode.window.showErrorMessage('An error occurred while retrieving the GitHub username.');
        console.error('Error retrieving GitHub username:', error);
        return `unknown-user-${new Date().toISOString().replace(/T/, '_').replace(/:/g, '-').split('.')[0]}`;
    }
}
module.exports = getGitHubUsername;
// Helper function to create the user-specific folder
function createUserFolder() {
    return __awaiter(this, void 0, void 0, function* () {
        const quizFolderPath = yield getPersonalQuizFolderPath();
        const username = getGitHubUsername();
        const userFolderPath = path.join(quizFolderPath, username);
        if (!fs.existsSync(userFolderPath)) {
            fs.mkdirSync(userFolderPath);
        }
        return userFolderPath;
    });
}
// Helper function to generate an HTML file for personalized questions
function generateQuestionHTML(questions) {
    return questions
        .map((question) => `
<pl-question-panel>
  <ol>
    <li>${question.text}</li>
  </ol>
</pl-question-panel>


<pl-code language="python">${question.highlightedCode || 'No code snippet available'}</pl-code>

<pl-rich-text-editor file-name="${question.text.toLowerCase().replace(/\\s+/g, '_')}.html"> </pl-rich-text-editor>
    `)
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
    let highlightAndCommentCommand = vscode.commands.registerCommand('extension.highlightAndComment', () => __awaiter(this, void 0, void 0, function* () {
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
        const panel = vscode.window.createWebviewPanel('addComment', // Panel ID
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
    }));
    let viewCommentsCommand = vscode.commands.registerCommand('extension.viewComments', () => __awaiter(this, void 0, void 0, function* () {
        if (commentsData.length === 0) {
            vscode.window.showInformationMessage('No comments added yet!');
            return;
        }
        // Create a Webview Panel for viewing comments
        const panel = vscode.window.createWebviewPanel('viewComments', // Panel ID
        'View Comments', // Panel title
        vscode.ViewColumn.One, // Show in the active column
        { enableScripts: true } // Allow JavaScript in the Webview
        );
        // Build a table with all the comments
        const commentsTable = commentsData.map((comment, index) => {
            const range = `${comment.range.start.line}:${comment.range.start.character} - ${comment.range.end.line}:${comment.range.end.character}`;
            // Extract only the last two parts of the file path for display
            const filePathParts = comment.filePath.split('/');
            const shortenedFilePath = filePathParts.length > 2
                ? `.../${filePathParts.slice(-3).join('/')}`
                : comment.filePath;
            return `
        <tr>
            <td>${index + 1}</td>
            <td title="${comment.filePath}">${shortenedFilePath}</td>
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
                    const filePathParts = comment.filePath.split('/');
                    const shortenedFilePath = filePathParts.length > 2
                        ? `.../${filePathParts.slice(-2).join('/')}`
                        : comment.filePath;
                    return `
                <tr>
                    <td>${index + 1}</td>
                    <td title="${comment.filePath}">${shortenedFilePath}</td>
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
    }));
    let askQuestionCommand = vscode.commands.registerCommand('extension.askQuestion', () => __awaiter(this, void 0, void 0, function* () {
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
        const panel = vscode.window.createWebviewPanel('askQuestion', // Panel ID
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
    }));
    let answerQuestionCommand = vscode.commands.registerCommand('extension.answerQuestion', () => __awaiter(this, void 0, void 0, function* () {
        if (questionsData.length === 0) {
            vscode.window.showInformationMessage('No questions asked yet!');
            return;
        }
        const questionItems = questionsData.map((q, index) => ({
            label: `Q${index + 1}: ${q.text}`,
            detail: q.highlightedCode || 'No highlighted code',
            index,
        }));
        const selectedQuestion = yield vscode.window.showQuickPick(questionItems, {
            placeHolder: 'Select a question to answer',
        });
        if (!selectedQuestion) {
            return;
        }
        const question = questionsData[selectedQuestion.index];
        // Create a Webview Panel for answering a question
        const panel = vscode.window.createWebviewPanel('answerQuestion', // Panel ID
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
    }));
    let viewQuestionsAndAnswersCommand = vscode.commands.registerCommand('extension.viewQuestionsAndAnswers', () => __awaiter(this, void 0, void 0, function* () {
        if (questionsData.length === 0) {
            vscode.window.showInformationMessage('No questions or answers available yet!');
            return;
        }
        // Create a Webview Panel for viewing questions and answers
        const panel = vscode.window.createWebviewPanel('viewQuestionsAndAnswers', // Panel ID
        'View Questions and Answers', // Panel title
        vscode.ViewColumn.One, // Show in the active column
        { enableScripts: true } // Allow JavaScript in the Webview
        );
        // Build a table with all the questions and answers
        const questionsTable = questionsData.map((qa, index) => {
            const range = `${qa.range.start.line}:${qa.range.start.character} - ${qa.range.end.line}:${qa.range.end.character}`;
            // Extract only the last two parts of the file path for display
            const filePathParts = qa.filePath.split('/');
            const shortenedFilePath = filePathParts.length > 2
                ? `.../${filePathParts.slice(-3).join('/')}`
                : qa.filePath;
            return `
        <tr>
            <td>${index + 1}</td>
            <td title="${qa.filePath}">${shortenedFilePath}</td>
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
    }));
    let addPersonalizedQuestionCommand = vscode.commands.registerCommand('extension.addPersonalizedQuestion', () => __awaiter(this, void 0, void 0, function* () {
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
        const panel = vscode.window.createWebviewPanel('addPersonalizedQuestion', 'Add Personalized Question', vscode.ViewColumn.One, { enableScripts: true });
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
    }));
    let viewPersonalizedQuestionsCommand = vscode.commands.registerCommand('extension.viewPersonalizedQuestions', () => __awaiter(this, void 0, void 0, function* () {
        if (personalizedQuestionsData.length === 0) {
            vscode.window.showInformationMessage('No personalized questions added yet!');
            return;
        }
        // Create a Webview Panel for viewing personalized questions
        const panel = vscode.window.createWebviewPanel('viewPersonalizedQuestions', 'View Personalized Questions', vscode.ViewColumn.One, { enableScripts: true });
        // Build a table with editable fields, revert button, and a checkbox inside the Actions column
        const questionsTable = personalizedQuestionsData.map((question, index) => {
            // Extract only the last three parts of the file path for display
            const filePathParts = question.filePath.split('/');
            const shortenedFilePath = filePathParts.length > 2
                ? `.../${filePathParts.slice(-3).join('/')}`
                : question.filePath;
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
        });
    }));
    // let generatePersonalizedQuizCommand = vscode.commands.registerCommand(
    //   'extension.generatePersonalizedQuiz',
    //   async () => {
    //     if (personalizedQuestionsData.length === 0) {
    //       vscode.window.showErrorMessage(
    //         'No personalized questions available to generate the quiz!'
    //       );
    //       return;
    //     }
    //     // Get the active file path (where the user triggered the command)
    //     const activeEditor = vscode.window.activeTextEditor;
    //     if (!activeEditor) {
    //       vscode.window.showErrorMessage('No active file found.');
    //       return;
    //     }
    //     const filePath = activeEditor.document.uri.fsPath;
    //     // Extract the correct student folder name
    //     const pathParts = filePath.split(path.sep);
    //     let studentFolderName = 'unknown_user';
    //     // Try to find "python" in the path
    //     const pythonIndex = pathParts.indexOf('python');
    //     if (pythonIndex > 0) {
    //       studentFolderName = pathParts[pythonIndex - 1]; // Folder before "python"
    //     } else {
    //       // If "python" folder doesn't exist, take the immediate parent folder
    //       studentFolderName = pathParts[pathParts.length - 2];
    //     }
    //     /*** Select Questions Folder ***/
    //     const questionsFolderUri = await vscode.window.showOpenDialog({
    //       canSelectFolders: true,
    //       canSelectFiles: false,
    //       canSelectMany: false,
    //       openLabel: 'Select Questions Folder'
    //     });
    //     if (!questionsFolderUri || questionsFolderUri.length === 0) {
    //       vscode.window.showErrorMessage('No questions folder selected.');
    //       return;
    //     }
    //     const questionsFolderPath = questionsFolderUri[0].fsPath;
    //     const personalQuizFolderPath = path.join(questionsFolderPath, 'PersonalQuiz');
    //     // Create PersonalQuiz folder if it doesn't exist
    //     if (!fs.existsSync(personalQuizFolderPath)) {
    //       fs.mkdirSync(personalQuizFolderPath, { recursive: true });
    //     }
    //     // Create student folder inside PersonalQuiz
    //     const studentQuizFolderPath = path.join(personalQuizFolderPath, studentFolderName);
    //     if (!fs.existsSync(studentQuizFolderPath)) {
    //       fs.mkdirSync(studentQuizFolderPath, { recursive: true });
    //     }
    //     // Paths for question.html and info.json
    //     const questionsHTMLPath = path.join(studentQuizFolderPath, 'question.html');
    //     const infoJSONPath = path.join(studentQuizFolderPath, 'info.json');
    //     // Generate question.html
    //     const questionsHTMLContent = generateQuestionHTML(personalizedQuestionsData);
    //     fs.writeFileSync(questionsHTMLPath, questionsHTMLContent);
    //     // Generate info.json
    //     const infoJSONContent = generateInfoJSON('Personalized Quiz');
    //     fs.writeFileSync(infoJSONPath, JSON.stringify(infoJSONContent, null, 2));
    //     /*** Get Quiz Name from User ***/
    //     const quizName = await vscode.window.showInputBox({
    //       prompt: 'Enter the name of the quiz or assignment:',
    //       placeHolder: 'Project1_Quiz'
    //     });
    //     if (!quizName) {
    //       vscode.window.showErrorMessage('Quiz name is required.');
    //       return;
    //     }
    //     /*** Get Student Name from User ***/
    //     const studentName = await vscode.window.showInputBox({
    //       prompt: 'Enter the student name:',
    //       placeHolder: 'student1'
    //     });
    //     if (!studentName) {
    //       vscode.window.showErrorMessage('Student name is required.');
    //       return;
    //     }
    //     /*** Select Assessment Folder ***/
    //     const assessmentFolderUri = await vscode.window.showOpenDialog({
    //       canSelectFolders: true,
    //       canSelectFiles: false,
    //       canSelectMany: false,
    //       openLabel: 'Select Assessment Folder'
    //     });
    //     if (!assessmentFolderUri || assessmentFolderUri.length === 0) {
    //       vscode.window.showErrorMessage('No assessment folder selected.');
    //       return;
    //     }
    //     const assessmentFolderPath = assessmentFolderUri[0].fsPath;
    //     // Create the quiz folder inside Assessments
    //     const quizFolderPath = path.join(assessmentFolderPath, quizName);
    //     if (!fs.existsSync(quizFolderPath)) {
    //       fs.mkdirSync(quizFolderPath, { recursive: true });
    //     }
    //     // Create student folder inside the quiz folder
    //     const studentAssessmentFolderPath = path.join(quizFolderPath, studentName);
    //     if (!fs.existsSync(studentAssessmentFolderPath)) {
    //       fs.mkdirSync(studentAssessmentFolderPath, { recursive: true });
    //     }
    //     // Generate the infoAssessment.json file path
    //     const infoAssessmentPath = path.join(studentAssessmentFolderPath, 'infoAssessment.json');
    //     // Define the content of infoAssessment.json, replacing "finnejaz@mail.gvsu.edu" with studentName
    //     const infoAssessmentContent = {
    //       uuid: uuidv4(), // Generate a unique UUID
    //       type: "Homework",
    //       title: quizName, // Use quiz name provided by user
    //       set: "Practice Quiz",
    //       number: "1",
    //       shuffleQuestions: true,
    //       allowAccess: [
    //         {
    //           mode: "Public",
    //           uids: [studentName], // Use the student name provided by user
    //           credit: 100,
    //           timeLimitMin: 30,
    //           startDate: "2023-02-09T11:15:00",
    //           endDate: "2023-02-09T12:30:40"
    //         },
    //         {
    //           role: "Student",
    //           mode: "Public",
    //           credit: 100,
    //           timeLimitMin: 55,
    //           startDate: "2025-01-08T14:35:00",
    //           endDate: "2025-02-08T14:56:00"
    //         }
    //       ],
    //       zones: [
    //         {
    //           questions: [
    //             {
    //               id: "key_ideas_sample",
    //               points: 10
    //             }
    //           ]
    //         }
    //       ]
    //     };
    //     // Write the JSON content to the file
    //     fs.writeFileSync(infoAssessmentPath, JSON.stringify(infoAssessmentContent, null, 2));
    //     // Show success messages
    //     vscode.window.showInformationMessage(
    //       `Personalized quiz generated successfully in: ${studentQuizFolderPath}`
    //     );
    //     vscode.window.showInformationMessage(
    //       `infoAssessment.json successfully created in: ${studentAssessmentFolderPath}`
    //     );
    //   }
    // );
    // let generatePersonalizedQuizCommand = vscode.commands.registerCommand(
    //   'extension.generatePersonalizedQuiz',
    //   async () => {
    //     if (personalizedQuestionsData.length === 0) {
    //       vscode.window.showErrorMessage('No personalized questions available to generate the quiz!');
    //       return;
    //     }
    //     /*** Prompt for Quiz Name ***/
    //     const quizName = await vscode.window.showInputBox({
    //       prompt: 'Enter the name of the quiz:',
    //       placeHolder: 'Project1_Quiz'
    //     });
    //     if (!quizName) {
    //       vscode.window.showErrorMessage('Quiz name is required.');
    //       return;
    //     }
    //     /*** Read personalizedQuestions.json ***/
    //     const jsonFilePath = path.join(vscode.workspace.rootPath, 'personalizedQuestions.json');
    //     if (!fs.existsSync(jsonFilePath)) {
    //       vscode.window.showErrorMessage('personalizedQuestions.json not found in the workspace.');
    //       return;
    //     }
    //     const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
    //     // Extract the student's name from filePath
    //     function extractStudentName(filePath) {
    //       const pathParts = filePath.split(path.sep);
    //       for (let i = 0; i < pathParts.length; i++) {
    //         if (pathParts[i].match(/CIS\d+_P\d+/)) { // Matches CIS163_P1, CIS500_P1, etc.
    //           return pathParts[i + 1] || 'unknown_user'; // The next part is the student's name
    //         }
    //       }
    //       return 'unknown_user';
    //     }
    //     const filePath = jsonData[0]?.filePath || ''; // Get the first filePath in the JSON
    //     const studentName = extractStudentName(filePath);
    //     if (!studentName || studentName === 'unknown_user') {
    //       vscode.window.showErrorMessage('Could not determine the student name.');
    //       return;
    //     }
    //     /*** Select Questions Folder ***/
    //     const questionsFolderUri = await vscode.window.showOpenDialog({
    //       canSelectFolders: true,
    //       canSelectFiles: false,
    //       canSelectMany: false,
    //       openLabel: 'Select Questions Folder'
    //     });
    //     if (!questionsFolderUri || questionsFolderUri.length === 0) {
    //       vscode.window.showErrorMessage('No questions folder selected.');
    //       return;
    //     }
    //     const questionsFolderPath = questionsFolderUri[0].fsPath;
    //     const quizFolderPath = path.join(questionsFolderPath, 'PersonalQuiz', quizName);
    //     // Create PersonalQuiz folder if it doesn't exist
    //     if (!fs.existsSync(quizFolderPath)) {
    //       fs.mkdirSync(quizFolderPath, { recursive: true });
    //     }
    //     /*** Generate Unique Folder Name for the Student ***/
    //     let questionNumber = 1;
    //     let studentQuestionFolder = path.join(quizFolderPath, `${studentName}_question${questionNumber}`);
    //     while (fs.existsSync(studentQuestionFolder)) {
    //       questionNumber++;
    //       studentQuestionFolder = path.join(quizFolderPath, `${studentName}_question${questionNumber}`);
    //     }
    //     fs.mkdirSync(studentQuestionFolder, { recursive: true });
    //     /*** Generate question.html and info.json ***/
    //     const questionsHTMLPath = path.join(studentQuestionFolder, 'question.html');
    //     const infoJSONPath = path.join(studentQuestionFolder, 'info.json');
    //     const questionsHTMLContent = generateQuestionHTML(personalizedQuestionsData);
    //     fs.writeFileSync(questionsHTMLPath, questionsHTMLContent);
    //     const infoJSONContent = generateInfoJSON('Personalized Quiz');
    //     fs.writeFileSync(infoJSONPath, JSON.stringify(infoJSONContent, null, 2));
    //     vscode.window.showInformationMessage(
    //       `Personalized quiz successfully generated in: ${studentQuestionFolder}`
    //     );
    //   }
    // );
    let generatePersonalizedQuizCommand = vscode.commands.registerCommand('extension.generatePersonalizedQuiz', () => __awaiter(this, void 0, void 0, function* () {
        if (personalizedQuestionsData.length === 0) {
            vscode.window.showErrorMessage('No personalized questions available to generate the quiz!');
            return;
        }
        // Prompt user for quiz name
        const quizName = yield vscode.window.showInputBox({
            prompt: 'Enter the name of the quiz:',
            placeHolder: 'Project1_Quiz'
        });
        if (!quizName) {
            vscode.window.showErrorMessage('Quiz name is required.');
            return;
        }
        // Load personalizedQuestions.json to extract file paths
        const questionsJsonPath = path.join(vscode.workspace.rootPath, 'personalizedQuestions.json');
        if (!fs.existsSync(questionsJsonPath)) {
            vscode.window.showErrorMessage('personalizedQuestions.json file not found in the workspace.');
            return;
        }
        const personalizedQuestions = JSON.parse(fs.readFileSync(questionsJsonPath, 'utf8'));
        // Extract student name from filePath
        function extractStudentName(filePath) {
            const parts = filePath.split(path.sep);
            for (let i = 0; i < parts.length; i++) {
                if (parts[i].startsWith('CIS')) {
                    return parts[i + 1]; // The actual student's name
                }
            }
            return 'unknown_user';
        }
        // Select Questions Folder
        const questionsFolderUri = yield vscode.window.showOpenDialog({
            canSelectFolders: true,
            canSelectFiles: false,
            canSelectMany: false,
            openLabel: 'Select Questions Folder'
        });
        if (!questionsFolderUri || questionsFolderUri.length === 0) {
            vscode.window.showErrorMessage('No questions folder selected.');
            return;
        }
        const questionsFolderPath = questionsFolderUri[0].fsPath;
        const personalQuizFolderPath = path.join(questionsFolderPath, 'PersonalQuiz', quizName);
        // Ensure PersonalQuiz/quizName directory exists
        if (!fs.existsSync(personalQuizFolderPath)) {
            fs.mkdirSync(personalQuizFolderPath, { recursive: true });
        }
        for (const question of personalizedQuestions) {
            const studentName = extractStudentName(question.filePath);
            let questionNumber = 1;
            let studentQuestionFolderPath;
            do {
                studentQuestionFolderPath = path.join(personalQuizFolderPath, `${studentName}_question${questionNumber}`);
                questionNumber++;
            } while (fs.existsSync(studentQuestionFolderPath));
            fs.mkdirSync(studentQuestionFolderPath, { recursive: true });
            // Create question.html
            const questionHTMLPath = path.join(studentQuestionFolderPath, 'question.html');
            fs.writeFileSync(questionHTMLPath, generateQuestionHTML(question));
            // Create info.json
            const infoJSONPath = path.join(studentQuestionFolderPath, 'info.json');
            fs.writeFileSync(infoJSONPath, JSON.stringify(generateInfoJSON('Personalized Quiz'), null, 2));
        }
        vscode.window.showInformationMessage(`Personalized quiz saved in: ${personalQuizFolderPath}`);
        /*** Assessment Folder ***/
        const assessmentFolderUri = yield vscode.window.showOpenDialog({
            canSelectFolders: true,
            canSelectFiles: false,
            canSelectMany: false,
            openLabel: 'Select Assessment Folder'
        });
        if (!assessmentFolderUri || assessmentFolderUri.length === 0) {
            vscode.window.showErrorMessage('No assessment folder selected.');
            return;
        }
        const assessmentFolderPath = assessmentFolderUri[0].fsPath;
        const assessmentQuizFolderPath = path.join(assessmentFolderPath, quizName);
        if (!fs.existsSync(assessmentQuizFolderPath)) {
            fs.mkdirSync(assessmentQuizFolderPath, { recursive: true });
        }
        for (const question of personalizedQuestions) {
            const studentName = extractStudentName(question.filePath);
            let questionNumber = 1;
            let studentQuestionAssessmentFolderPath;
            do {
                studentQuestionAssessmentFolderPath = path.join(assessmentQuizFolderPath, `${studentName}_question${questionNumber}`);
                questionNumber++;
            } while (fs.existsSync(studentQuestionAssessmentFolderPath));
            fs.mkdirSync(studentQuestionAssessmentFolderPath, { recursive: true });
            // Generate infoAssessment.json
            const infoAssessmentPath = path.join(studentQuestionAssessmentFolderPath, 'info.assessment.json');
            const infoAssessmentContent = {
                uuid: uuidv4(),
                type: "Homework",
                title: quizName,
                set: "Practice Quiz",
                number: "1",
                shuffleQuestions: true,
                allowAccess: [
                    {
                        mode: "Public",
                        uids: [studentName],
                        credit: 100,
                        timeLimitMin: 30,
                        startDate: "2023-02-09T11:15:00",
                        endDate: "2023-02-09T12:30:40"
                    },
                    {
                        role: "Student",
                        mode: "Public",
                        credit: 100,
                        timeLimitMin: 55,
                        startDate: "2025-01-08T14:35:00",
                        endDate: "2025-02-08T14:56:00"
                    }
                ],
                zones: [
                    {
                        questions: [
                            {
                                id: `PersonalQuiz/${quizName}/${studentName}_question${questionNumber - 1}`,
                                points: 10
                            }
                        ]
                    }
                ]
            };
            fs.writeFileSync(infoAssessmentPath, JSON.stringify(infoAssessmentContent, null, 2));
        }
        vscode.window.showInformationMessage(`Assessment quiz saved in: ${assessmentQuizFolderPath}`);
    }));
    /**
     * Generates question HTML content.
     * @param {Object} questionData
     * @returns {string}
     */
    function generateQuestionHTML(questionData) {
        return `
        <html>
        <head><title>Question</title></head>
        <body>
            <h2>${questionData.text}</h2>
            <pre>${questionData.highlightedCode}</pre>
        </body>
        </html>
    `;
    }
    /**
     * Generates info JSON content.
     * @param {string} title
     * @returns {Object}
     */
    function generateInfoJSON(title) {
        return {
            title,
            description: "This is a personalized quiz."
        };
    }
    context.subscriptions.push(highlightAndCommentCommand, viewCommentsCommand, askQuestionCommand, answerQuestionCommand, viewQuestionsAndAnswersCommand, addPersonalizedQuestionCommand, viewPersonalizedQuestionsCommand, generatePersonalizedQuizCommand);
}
/**
 * Deactivate the extension
 */
function deactivate() { }
module.exports = {
    activate,
    deactivate,
};
