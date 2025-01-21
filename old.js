// // Extension entry point
// const vscode = require('vscode');

// // In-memory storage for comments
// const commentsData = [];

// /**
//  * Activate the extension
//  * @param {vscode.ExtensionContext} context 
//  */
// function activate(context) {
//     // Command: Highlight code and add a comment
//     let highlightAndCommentCommand = vscode.commands.registerCommand('extension.highlightAndComment', async () => {
//         const editor = vscode.window.activeTextEditor;
//         if (!editor) {
//             vscode.window.showErrorMessage('No active editor found.');
//             return;
//         }

//         const selection = editor.selection;
//         if (selection.isEmpty) {
//             vscode.window.showErrorMessage('Please select a code snippet to comment on.');
//             return;
//         }

//         const range = new vscode.Range(selection.start, selection.end);
//         const selectedText = editor.document.getText(range);

//         // Create a Webview Panel for adding a comment
//         const panel = vscode.window.createWebviewPanel(
//             'addComment', // Panel ID
//             'Add Comment', // Panel title
//             vscode.ViewColumn.One, // Show in the active column
//             { enableScripts: true } // Allow JavaScript in the Webview
//         );

//         // HTML content for the Webview
//         panel.webview.html = `
//     <!DOCTYPE html>
//     <html lang="en">
//     <head>
//       <meta charset="UTF-8">
//       <meta name="viewport" content="width=device-width, initial-scale=1.0">
//       <title>Add Comment</title>
//       <style>
//         body { font-family: Arial, sans-serif; margin: 20px; }
//         textarea { width: 100%; height: 100px; font-size: 14px; margin-bottom: 10px; }
//         button { padding: 10px 20px; background: #007acc; color: white; border: none; cursor: pointer; }
//         button:hover { background: #005a9e; }
//       </style>
//     </head>
//     <body>
//       <h1>Add a Comment</h1>
//       <p><strong>Selected Code:</strong></p>
//       <pre>${selectedText}</pre>
//       <textarea id="comment" placeholder="Write your comment here..."></textarea>
//       <button onclick="submitComment()">Submit Comment</button>
//       <script>
//         const vscode = acquireVsCodeApi();
//         function submitComment() {
//           const comment = document.getElementById('comment').value;
//           if (comment.trim() === '') {
//             alert('Comment cannot be empty!');
//             return;
//           }
//           vscode.postMessage({ comment });
//         }
//       </script>
//     </body>
//     </html>
//   `;

//         // Handle messages from the Webview
//         panel.webview.onDidReceiveMessage((message) => {
//             if (message.comment) {
//                 // Save the comment
//                 commentsData.push({
//                     filePath: editor.document.uri.fsPath,
//                     range: {
//                         start: { line: selection.start.line, character: selection.start.character },
//                         end: { line: selection.end.line, character: selection.end.character },
//                     },
//                     text: message.comment,
//                     replies: [],
//                     resolved: false,
//                 });

//                 // Highlight the selected range
//                 const decorationType = vscode.window.createTextEditorDecorationType({
//                     backgroundColor: 'rgba(255,255,0,0.4)', // Yellow highlight
//                 });
//                 editor.setDecorations(decorationType, [range]);

//                 vscode.window.showInformationMessage('Comment added successfully!');
//                 panel.dispose();
//             }
//         });
//     });
//     context.subscriptions.push(highlightAndCommentCommand);


//     // Command: Add a question to a highlighted snippet
//     let askQuestionCommand = vscode.commands.registerCommand('extension.askQuestion', async () => {
//         const editor = vscode.window.activeTextEditor;
//         if (!editor) {
//             vscode.window.showErrorMessage('No active editor found.');
//             return;
//         }

//         const selection = editor.selection;
//         if (selection.isEmpty) {
//             vscode.window.showErrorMessage('Please select a code snippet to ask a question about.');
//             return;
//         }

//         const range = new vscode.Range(selection.start, selection.end);

//         // Open an input box to get the question
//         const questionText = await vscode.window.showInputBox({
//             prompt: 'Enter your question for the selected code:',
//             validateInput: (input) => (input.trim() === '' ? 'Question cannot be empty.' : null),
//         });

//         if (!questionText) {
//             return; // User cancelled the input
//         }

//         // Save the question in memory
//         commentsData.push({
//             filePath: editor.document.uri.fsPath,
//             range: {
//                 start: { line: selection.start.line, character: selection.start.character },
//                 end: { line: selection.end.line, character: selection.end.character },
//             },
//             question: questionText,
//             answers: [],
//         });

//         vscode.window.showInformationMessage('Question added successfully!');
//     });

//     // Command: Answer a question
//     let answerQuestionCommand = vscode.commands.registerCommand('extension.answerQuestion', async () => {
//         const questionOptions = commentsData
//             .filter((comment) => comment.question)
//             .map((comment, index) => ({ label: `Q${index + 1}: ${comment.question}`, index }));

//         if (questionOptions.length === 0) {
//             vscode.window.showInformationMessage('No questions found.');
//             return;
//         }

//         const selectedQuestion = await vscode.window.showQuickPick(questionOptions, {
//             placeHolder: 'Select a question to answer',
//         });

//         if (!selectedQuestion) {
//             return; // User cancelled the selection
//         }

//         const questionIndex = selectedQuestion.index;

//         // Open an input box to get the answer
//         const answerText = await vscode.window.showInputBox({
//             prompt: 'Enter your answer:',
//             validateInput: (input) => (input.trim() === '' ? 'Answer cannot be empty.' : null),
//         });

//         if (!answerText) {
//             return; // User cancelled the input
//         }

//         // Save the answer to the question
//         commentsData[questionIndex].answers.push(answerText);

//         vscode.window.showInformationMessage('Answer added successfully!');
//     });

//     // Register commands
//     context.subscriptions.push(highlightAndCommentCommand, askQuestionCommand, answerQuestionCommand);

//     //View comment code
//     let viewCommentsCommand = vscode.commands.registerCommand('extension.viewComments', async () => {
//         if (commentsData.length === 0) {
//             vscode.window.showInformationMessage('No comments added yet!');
//             return;
//         }

//         // Create a Webview Panel for viewing comments
//         const panel = vscode.window.createWebviewPanel(
//             'viewComments', // Panel ID
//             'View Comments', // Panel title
//             vscode.ViewColumn.One, // Show in the active column
//             { enableScripts: true } // Allow JavaScript in the Webview
//         );

//         // Build a table with all the comments
//         const commentsTable = commentsData.map((comment, index) => {
//             const range = `${comment.range.start.line}:${comment.range.start.character} - ${comment.range.end.line}:${comment.range.end.character}`;
//             return `
//       <tr>
//         <td>${index + 1}</td>
//         <td>${comment.filePath}</td>
//         <td>${range}</td>
//         <td><pre>${comment.text || 'No text'}</pre></td>
//         <td>${comment.replies.length > 0 ? comment.replies.join(', ') : 'No replies'}</td>
//       </tr>
//     `;
//         }).join('');

//         // HTML content for the Webview
//         panel.webview.html = `
//     <!DOCTYPE html>
//     <html lang="en">
//     <head>
//       <meta charset="UTF-8">
//       <meta name="viewport" content="width=device-width, initial-scale=1.0">
//       <title>View Comments</title>
//       <style>
//         body { font-family: Arial, sans-serif; margin: 20px; }
//         table { width: 100%; border-collapse: collapse; margin-top: 20px; }
//         th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
//         th { background-color: #007acc; color: white; }
//       </style>
//     </head>
//     <body>
//       <h1>All Comments</h1>
//       <table>
//         <thead>
//           <tr>
//             <th>#</th>
//             <th>File</th>
//             <th>Range</th>
//             <th>Comment</th>
//             <th>Replies</th>
//           </tr>
//         </thead>
//         <tbody>
//           ${commentsTable}
//         </tbody>
//       </table>
//     </body>
//     </html>
//   `;
//     });
//     context.subscriptions.push(viewCommentsCommand);



// }

// /**
//  * Deactivate the extension
//  */
// function deactivate() { }

// module.exports = {
//     activate,
//     deactivate,
// };







































// // Extension entry point
// const vscode = require('vscode');

// // In-memory storage for comments
// const commentsData = [];

// /**
//  * Activate the extension
//  * @param {vscode.ExtensionContext} context 
//  */
// function activate(context) {
//     // Command: Highlight code and add a comment
//     let highlightAndCommentCommand = vscode.commands.registerCommand('extension.highlightAndComment', async () => {
//         const editor = vscode.window.activeTextEditor;
//         if (!editor) {
//             vscode.window.showErrorMessage('No active editor found.');
//             return;
//         }

//         const selection = editor.selection;
//         if (selection.isEmpty) {
//             vscode.window.showErrorMessage('Please select a code snippet to comment on.');
//             return;
//         }

//         const range = new vscode.Range(selection.start, selection.end);
//         const selectedText = editor.document.getText(range);

//         // Create a Webview Panel for adding a comment
//         const panel = vscode.window.createWebviewPanel(
//             'addComment', // Panel ID
//             'Add Comment', // Panel title
//             vscode.ViewColumn.One, // Show in the active column
//             { enableScripts: true } // Allow JavaScript in the Webview
//         );

//         // HTML content for the Webview
//         panel.webview.html = `
//       <!DOCTYPE html>
//       <html lang="en">
//       <head>
//         <meta charset="UTF-8">
//         <meta name="viewport" content="width=device-width, initial-scale=1.0">
//         <title>Add Comment</title>
//         <style>
//           body { font-family: Arial, sans-serif; margin: 20px; }
//           textarea { width: 100%; height: 100px; font-size: 14px; margin-bottom: 10px; }
//           button { padding: 10px 20px; background: #007acc; color: white; border: none; cursor: pointer; }
//           button:hover { background: #005a9e; }
//         </style>
//       </head>
//       <body>
//         <h1>Add a Comment</h1>
//         <p><strong>Selected Code:</strong></p>
//         <pre>${selectedText}</pre>
//         <textarea id="comment" placeholder="Write your comment here..."></textarea>
//         <button onclick="submitComment()">Submit Comment</button>
//         <script>
//           const vscode = acquireVsCodeApi();
//           function submitComment() {
//             const comment = document.getElementById('comment').value;
//             if (comment.trim() === '') {
//               alert('Comment cannot be empty!');
//               return;
//             }
//             vscode.postMessage({ comment });
//           }
//         </script>
//       </body>
//       </html>
//     `;

//         // Handle messages from the Webview
//         panel.webview.onDidReceiveMessage((message) => {
//             if (message.comment) {
//                 // Save the comment
//                 commentsData.push({
//                     filePath: editor.document.uri.fsPath,
//                     range: {
//                         start: { line: selection.start.line, character: selection.start.character },
//                         end: { line: selection.end.line, character: selection.end.character },
//                     },
//                     text: message.comment,
//                     highlightedCode: selectedText, // Save the highlighted code
//                     replies: [],
//                     resolved: false,
//                 });

//                 // Highlight the selected range with a green background
//                 const decorationType = vscode.window.createTextEditorDecorationType({
//                     backgroundColor: 'rgba(144,238,144,0.5)', // Light green highlight
//                 });
//                 editor.setDecorations(decorationType, [range]);

//                 vscode.window.showInformationMessage('Comment added successfully!');
//                 panel.dispose();
//             }
//         });
//     });

//     // Command: View all comments in a Webview
//     let viewCommentsCommand = vscode.commands.registerCommand('extension.viewComments', async () => {
//         if (commentsData.length === 0) {
//             vscode.window.showInformationMessage('No comments added yet!');
//             return;
//         }

//         // Create a Webview Panel for viewing comments
//         const panel = vscode.window.createWebviewPanel(
//             'viewComments', // Panel ID
//             'View Comments', // Panel title
//             vscode.ViewColumn.One, // Show in the active column
//             { enableScripts: true } // Allow JavaScript in the Webview
//         );

//         // Build a table with all the comments
//         const commentsTable = commentsData.map((comment, index) => {
//             const range = `${comment.range.start.line}:${comment.range.start.character} - ${comment.range.end.line}:${comment.range.end.character}`;
//             return `
//         <tr>
//           <td>${index + 1}</td>
//           <td>${comment.filePath}</td>
//           <td>${range}</td>
//           <td><pre>${comment.highlightedCode || 'No highlighted code'}</pre></td>
//           <td>${comment.text || 'No text'}</td>
//           <td>${comment.replies.length > 0 ? comment.replies.join(', ') : 'No replies'}</td>
//         </tr>
//       `;
//         }).join('');

//         // HTML content for the Webview
//         panel.webview.html = `
//       <!DOCTYPE html>
//       <html lang="en">
//       <head>
//         <meta charset="UTF-8">
//         <meta name="viewport" content="width=device-width, initial-scale=1.0">
//         <title>View Comments</title>
//         <style>
//           body { font-family: Arial, sans-serif; margin: 20px; }
//           table { width: 100%; border-collapse: collapse; margin-top: 20px; }
//           th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
//           th { background-color: #007acc; color: white; }
//           pre { background-color:rgb(0, 0, 0); padding: 5px; border-radius: 5px; }
//         </style>
//       </head>
//       <body>
//         <h1>All Comments</h1>
//         <table>
//           <thead>
//             <tr>
//               <th>#</th>
//               <th>File</th>
//               <th>Range</th>
//               <th>Highlighted Code</th>
//               <th>Comment</th>
//               <th>Replies</th>
//             </tr>
//           </thead>
//           <tbody>
//             ${commentsTable}
//           </tbody>
//         </table>
//       </body>
//       </html>
//     `;
//     });
//     context.subscriptions.push(highlightAndCommentCommand, viewCommentsCommand);
// }

// /**
//  * Deactivate the extension
//  */
// function deactivate() { }

// module.exports = {
//     activate,
//     deactivate,
// };











// // Extension entry point
// const vscode = require('vscode');

// // In-memory storage for comments and questions
// const commentsData = [];
// const questionsData = []; // New storage for questions and answers

// /**
//  * Activate the extension
//  * @param {vscode.ExtensionContext} context 
//  */
// function activate(context) {
//     // Command: Highlight code and add a comment
//     let highlightAndCommentCommand = vscode.commands.registerCommand('extension.highlightAndComment', async () => {
//         const editor = vscode.window.activeTextEditor;
//         if (!editor) {
//             vscode.window.showErrorMessage('No active editor found.');
//             return;
//         }

//         const selection = editor.selection;
//         if (selection.isEmpty) {
//             vscode.window.showErrorMessage('Please select a code snippet to comment on.');
//             return;
//         }

//         const range = new vscode.Range(selection.start, selection.end);
//         const selectedText = editor.document.getText(range);

//         // Create a Webview Panel for adding a comment
//         const panel = vscode.window.createWebviewPanel(
//             'addComment',
//             'Add Comment',
//             vscode.ViewColumn.One,
//             { enableScripts: true }
//         );

//         // HTML content for the Webview
//         panel.webview.html = `
//       <!DOCTYPE html>
//       <html lang="en">
//       <head>
//         <meta charset="UTF-8">
//         <meta name="viewport" content="width=device-width, initial-scale=1.0">
//         <title>Add Comment</title>
//         <style>
//           body { font-family: Arial, sans-serif; margin: 20px; }
//           textarea { width: 100%; height: 100px; font-size: 14px; margin-bottom: 10px; }
//           button { padding: 10px 20px; background: #007acc; color: white; border: none; cursor: pointer; }
//           button:hover { background: #005a9e; }
//         </style>
//       </head>
//       <body>
//         <h1>Add a Comment</h1>
//         <p><strong>Selected Code:</strong></p>
//         <pre>${selectedText}</pre>
//         <textarea id="comment" placeholder="Write your comment here..."></textarea>
//         <button onclick="submitComment()">Submit Comment</button>
//         <script>
//           const vscode = acquireVsCodeApi();
//           function submitComment() {
//             const comment = document.getElementById('comment').value;
//             if (comment.trim() === '') {
//               alert('Comment cannot be empty!');
//               return;
//             }
//             vscode.postMessage({ comment });
//           }
//         </script>
//       </body>
//       </html>
//     `;

//         panel.webview.onDidReceiveMessage((message) => {
//             if (message.comment) {
//                 commentsData.push({
//                     filePath: editor.document.uri.fsPath,
//                     range: {
//                         start: { line: selection.start.line, character: selection.start.character },
//                         end: { line: selection.end.line, character: selection.end.character },
//                     },
//                     text: message.comment,
//                     highlightedCode: selectedText,
//                     replies: [],
//                     resolved: false,
//                 });

//                 const decorationType = vscode.window.createTextEditorDecorationType({
//                     backgroundColor: 'rgba(144,238,144,0.5)',
//                 });
//                 editor.setDecorations(decorationType, [range]);

//                 vscode.window.showInformationMessage('Comment added successfully!');
//                 panel.dispose();
//             }
//         });
//     });

//     // Command: View all comments in a Webview
//     let viewCommentsCommand = vscode.commands.registerCommand('extension.viewComments', async () => {
//         if (commentsData.length === 0) {
//             vscode.window.showInformationMessage('No comments added yet!');
//             return;
//         }

//         const panel = vscode.window.createWebviewPanel(
//             'viewComments',
//             'View Comments',
//             vscode.ViewColumn.One,
//             { enableScripts: true }
//         );

//         const commentsTable = commentsData.map((comment, index) => {
//             const range = `${comment.range.start.line}:${comment.range.start.character} - ${comment.range.end.line}:${comment.range.end.character}`;
//             return `
//         <tr>
//           <td>${index + 1}</td>
//           <td>${comment.filePath}</td>
//           <td>${range}</td>
//           <td><pre>${comment.highlightedCode || 'No highlighted code'}</pre></td>
//           <td>${comment.text || 'No text'}</td>
//           <td>${comment.replies.length > 0 ? comment.replies.join(', ') : 'No replies'}</td>
//         </tr>
//       `;
//         }).join('');

//         panel.webview.html = `
//       <!DOCTYPE html>
//       <html lang="en">
//       <head>
//         <meta charset="UTF-8">
//         <meta name="viewport" content="width=device-width, initial-scale=1.0">
//         <title>View Comments</title>
//         <style>
//           body { font-family: Arial, sans-serif; margin: 20px; }
//           table { width: 100%; border-collapse: collapse; margin-top: 20px; }
//           th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
//           th { background-color: #007acc; color: white; }
//           pre { background-color:rgb(0, 0, 0); padding: 5px; border-radius: 5px; }
//         </style>
//       </head>
//       <body>
//         <h1>All Comments</h1>
//         <table>
//           <thead>
//             <tr>
//               <th>#</th>
//               <th>File</th>
//               <th>Range</th>
//               <th>Highlighted Code</th>
//               <th>Comment</th>
//               <th>Replies</th>
//             </tr>
//           </thead>
//           <tbody>
//             ${commentsTable}
//           </tbody>
//         </table>
//       </body>
//       </html>
//     `;
//     });

//     // Command: Ask a question
//     let askQuestionCommand = vscode.commands.registerCommand('extension.askQuestion', async () => {
//         const panel = vscode.window.createWebviewPanel(
//             'askQuestion',
//             'Ask a Question',
//             vscode.ViewColumn.One,
//             { enableScripts: true }
//         );

//         panel.webview.html = `
//       <!DOCTYPE html>
//       <html lang="en">
//       <head>
//         <meta charset="UTF-8">
//         <meta name="viewport" content="width=device-width, initial-scale=1.0">
//         <title>Ask Question</title>
//         <style>
//           body { font-family: Arial, sans-serif; margin: 20px; }
//           textarea { width: 100%; height: 100px; font-size: 14px; margin-bottom: 10px; }
//           button { padding: 10px 20px; background: #007acc; color: white; border: none; cursor: pointer; }
//           button:hover { background: #005a9e; }
//         </style>
//       </head>
//       <body>
//         <h1>Ask a Question</h1>
//         <textarea id="question" placeholder="Write your question here..."></textarea>
//         <button onclick="submitQuestion()">Submit Question</button>
//         <script>
//           const vscode = acquireVsCodeApi();
//           function submitQuestion() {
//             const question = document.getElementById('question').value;
//             if (question.trim() === '') {
//               alert('Question cannot be empty!');
//               return;
//             }
//             vscode.postMessage({ question });
//           }
//         </script>
//       </body>
//       </html>
//     `;

//         panel.webview.onDidReceiveMessage((message) => {
//             if (message.question) {
//                 questionsData.push({
//                     question: message.question,
//                     answers: [],
//                 });
//                 vscode.window.showInformationMessage('Question submitted successfully!');
//                 panel.dispose();
//             }
//         });
//     });

//     // Command: Answer a question
//     let answerQuestionCommand = vscode.commands.registerCommand('extension.answerQuestion', async () => {
//         if (questionsData.length === 0) {
//             vscode.window.showInformationMessage('No questions to answer.');
//             return;
//         }

//         const panel = vscode.window.createWebviewPanel(
//             'answerQuestion',
//             'Answer a Question',
//             vscode.ViewColumn.One,
//             { enableScripts: true }
//         );

//         const questionsList = questionsData.map((q, index) => `
//           <option value="${index}">${q.question}</option>
//         `).join('');

//         panel.webview.html = `
//       <!DOCTYPE html>
//       <html lang="en">
//       <head>
//         <meta charset="UTF-8">
//         <meta name="viewport" content="width=device-width, initial-scale=1.0">
//         <title>Answer Question</title>
//         <style>
//           body { font-family: Arial, sans-serif; margin: 20px; }
//           select, textarea { width: 100%; font-size: 14px; margin-bottom: 10px; }
//           button { padding: 10px 20px; background: #007acc; color: white; border: none; cursor: pointer; }
//           button:hover { background: #005a9e; }
//         </style>
//       </head>
//       <body>
//         <h1>Answer a Question</h1>
//         <label for="questionSelect">Select a question:</label>
//         <select id="questionSelect">
//           ${questionsList}
//         </select>
//         <textarea id="answer" placeholder="Write your answer here..."></textarea>
//         <button onclick="submitAnswer()">Submit Answer</button>
//         <script>
//           const vscode = acquireVsCodeApi();
//           function submitAnswer() {
//             const questionIndex = document.getElementById('questionSelect').value;
//             const answer = document.getElementById('answer').value;
//             if (answer.trim() === '') {
//               alert('Answer cannot be empty!');
//               return;
//             }
//             vscode.postMessage({ questionIndex, answer });
//           }
//         </script>
//       </body>
//       </html>
//     `;

//         panel.webview.onDidReceiveMessage((message) => {
//             if (message.questionIndex !== undefined && message.answer) {
//                 questionsData[message.questionIndex].answers.push(message.answer);
//                 vscode.window.showInformationMessage('Answer submitted successfully!');
//                 panel.dispose();
//             }
//         });
//     });

//     context.subscriptions.push(highlightAndCommentCommand, viewCommentsCommand, askQuestionCommand, answerQuestionCommand);
// }

// /**
//  * Deactivate the extension
//  */
// function deactivate() { }

// module.exports = {
//     activate,
//     deactivate,
// };






























// let payload = {
//     filePath: editor.document.uri.fsPath,
//     range: {
//         start: { line: selection.start.line, character: selection.start.character },
//         end: { line: selection.end.line, character: selection.end.character },
//     },
//     text: message.comment,
//     highlightedCode: selectedText, // Save the highlighted code
//     replies: [],
//     resolved: false,
//     id: hash(filePath + highlightedCode),
//     codeBase_id: 'git-repository name'
// }

// axios.post('url', payload)

// Highlight the selected range with a green background



//const commentsData = await axios.get('http.api/codeBase_id')















// // Extension entry point
// const vscode = require('vscode');
// const fs = require('fs');
// const path = require('path');

// // In-memory storage for comments and questions
// const commentsData = [];
// const questionsData = [];


// /**
//  * Activate the extension
//  * @param {vscode.ExtensionContext} context 
//  */
// function activate(context) {
//     // Command: Highlight code and add a comment
//     let highlightAndCommentCommand = vscode.commands.registerCommand('extension.highlightAndComment', async () => {
//         const editor = vscode.window.activeTextEditor;
//         if (!editor) {
//             vscode.window.showErrorMessage('No active editor found.');
//             return;
//         }

//         const selection = editor.selection;
//         if (selection.isEmpty) {
//             vscode.window.showErrorMessage('Please select a code snippet to comment on.');
//             return;
//         }

//         const range = new vscode.Range(selection.start, selection.end);
//         const selectedText = editor.document.getText(range);

//         // Create a Webview Panel for adding a comment
//         const panel = vscode.window.createWebviewPanel(
//             'addComment', // Panel ID
//             'Add Comment', // Panel title
//             vscode.ViewColumn.One, // Show in the active column
//             { enableScripts: true } // Allow JavaScript in the Webview
//         );

//         // HTML content for the Webview
//         panel.webview.html = `
//       <!DOCTYPE html>
//       <html lang="en">
//       <head>
//         <meta charset="UTF-8">
//         <meta name="viewport" content="width=device-width, initial-scale=1.0">
//         <title>Add Comment</title>
//         <style>
//           body { font-family: Arial, sans-serif; margin: 20px; }
//           textarea { width: 100%; height: 100px; font-size: 14px; margin-bottom: 10px; }
//           button { padding: 10px 20px; background: #007acc; color: white; border: none; cursor: pointer; }
//           button:hover { background: #005a9e; }
//         </style>
//       </head>
//       <body>
//         <h1>Add a Comment</h1>
//         <p><strong>Selected Code:</strong></p>
//         <pre>${selectedText}</pre>
//         <textarea id="comment" placeholder="Write your comment here..."></textarea>
//         <button onclick="submitComment()">Submit Comment</button>
//         <script>
//           const vscode = acquireVsCodeApi();
//           function submitComment() {
//             const comment = document.getElementById('comment').value;
//             if (comment.trim() === '') {
//               alert('Comment cannot be empty!');
//               return;
//             }
//             vscode.postMessage({ comment });
//           }
//         </script>
//       </body>
//       </html>
//     `;

//         // Handle messages from the Webview
//         panel.webview.onDidReceiveMessage((message) => {
//             if (message.comment) {
//                 // Save the comment
//                 commentsData.push({
//                     filePath: editor.document.uri.fsPath,
//                     range: {
//                         start: { line: selection.start.line, character: selection.start.character },
//                         end: { line: selection.end.line, character: selection.end.character },
//                     },
//                     text: message.comment,
//                     highlightedCode: selectedText, // Save the highlighted code
//                     replies: [],
//                     resolved: false,
//                 });



//                 const decorationType = vscode.window.createTextEditorDecorationType({
//                     backgroundColor: 'rgba(144,238,144,0.5)', // Light green highlight
//                 });
//                 editor.setDecorations(decorationType, [range]);

//                 vscode.window.showInformationMessage('Comment added successfully!');
//                 panel.dispose();
//             }
//         });
//     });

//     // Command: View all comments in a Webview
//     let viewCommentsCommand = vscode.commands.registerCommand('extension.viewComments', async () => {
//         if (commentsData.length === 0) {
//             vscode.window.showInformationMessage('No comments added yet!');
//             return;
//         }

//         // Create a Webview Panel for viewing comments
//         const panel = vscode.window.createWebviewPanel(
//             'viewComments', // Panel ID
//             'View Comments', // Panel title
//             vscode.ViewColumn.One, // Show in the active column
//             { enableScripts: true } // Allow JavaScript in the Webview
//         );

//         // Build a table with all the comments
//         const commentsTable = commentsData.map((comment, index) => {
//             const range = `${comment.range.start.line}:${comment.range.start.character} - ${comment.range.end.line}:${comment.range.end.character}`;
//             return `
//         <tr>
//           <td>${index + 1}</td>
//           <td>${comment.filePath}</td>
//           <td>${range}</td>
//           <td><pre>${comment.highlightedCode || 'No highlighted code'}</pre></td>
//           <td>${comment.text || 'No text'}</td>
//           <td>${comment.replies.length > 0 ? comment.replies.join(', ') : 'No replies'}</td>
//         </tr>
//       `;
//         }).join('');

//         // HTML content for the Webview
//         panel.webview.html = `
//       <!DOCTYPE html>
//       <html lang="en">
//       <head>
//         <meta charset="UTF-8">
//         <meta name="viewport" content="width=device-width, initial-scale=1.0">
//         <title>View Comments</title>
//         <style>
//           body { font-family: Arial, sans-serif; margin: 20px; }
//           table { width: 100%; border-collapse: collapse; margin-top: 20px; }
//           th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
//           th { background-color: #007acc; color: white; }
//           pre { background-color:rgb(0, 0, 0); padding: 5px; border-radius: 5px; }
//         </style>
//       </head>
//       <body>
//         <h1>All Comments</h1>
//         <table>
//           <thead>
//             <tr>
//               <th>#</th>
//               <th>File</th>
//               <th>Range</th>
//               <th>Highlighted Code</th>
//               <th>Comment</th>
//               <th>Replies</th>
//             </tr>
//           </thead>
//           <tbody>
//             ${commentsTable}
//           </tbody>
//         </table>
//       </body>
//       </html>
//     `;
//     });

//     // Command: Ask a question
//     let askQuestionCommand = vscode.commands.registerCommand('extension.askQuestion', async () => {
//         const editor = vscode.window.activeTextEditor;
//         if (!editor) {
//             vscode.window.showErrorMessage('No active editor found.');
//             return;
//         }

//         const selection = editor.selection;
//         if (selection.isEmpty) {
//             vscode.window.showErrorMessage('Please select a code snippet to ask a question about.');
//             return;
//         }

//         const range = new vscode.Range(selection.start, selection.end);
//         const selectedText = editor.document.getText(range);

//         // Create a Webview Panel for asking a question
//         const panel = vscode.window.createWebviewPanel(
//             'askQuestion', // Panel ID
//             'Ask Question', // Panel title
//             vscode.ViewColumn.One, // Show in the active column
//             { enableScripts: true } // Allow JavaScript in the Webview
//         );

//         panel.webview.html = `
//     <!DOCTYPE html>
//     <html lang="en">
//     <head>
//       <meta charset="UTF-8">
//       <meta name="viewport" content="width=device-width, initial-scale=1.0">
//       <title>Ask Question</title>
//       <style>
//         body { font-family: Arial, sans-serif; margin: 20px; }
//         textarea { width: 100%; height: 80px; font-size: 14px; margin-bottom: 10px; }
//         button { padding: 10px 20px; background: #007acc; color: white; border: none; cursor: pointer; }
//         button:hover { background: #005a9e; }
//       </style>
//     </head>
//     <body>
//       <h1>Ask a Question</h1>
//       <p><strong>Selected Code:</strong></p>
//       <pre>${selectedText}</pre>
//       <textarea id="question" placeholder="Type your question here..."></textarea>
//       <button onclick="submitQuestion()">Submit Question</button>
//       <script>
//         const vscode = acquireVsCodeApi();
//         function submitQuestion() {
//           const question = document.getElementById('question').value;
//           if (question.trim() === '') {
//             alert('Question cannot be empty!');
//             return;
//           }
//           vscode.postMessage({ question });
//         }
//       </script>
//     </body>
//     </html>
//     `;

//         panel.webview.onDidReceiveMessage((message) => {
//             if (message.question) {
//                 questionsData.push({
//                     filePath: editor.document.uri.fsPath,
//                     range: {
//                         start: { line: selection.start.line, character: selection.start.character },
//                         end: { line: selection.end.line, character: selection.end.character },
//                     },
//                     text: message.question,
//                     highlightedCode: selectedText,
//                     answer: '',
//                 });

//                 vscode.window.showInformationMessage('Question added successfully!');
//                 panel.dispose();
//             }
//         });
//     });


//     // Command: Answer a question
//     let answerQuestionCommand = vscode.commands.registerCommand('extension.answerQuestion', async () => {
//         if (questionsData.length === 0) {
//             vscode.window.showInformationMessage('No questions asked yet!');
//             return;
//         }

//         const questionItems = questionsData.map((q, index) => ({
//             label: `Q${index + 1}: ${q.text}`,
//             detail: q.highlightedCode || 'No highlighted code',
//             index,
//         }));

//         const selectedQuestion = await vscode.window.showQuickPick(questionItems, {
//             placeHolder: 'Select a question to answer',
//         });

//         if (!selectedQuestion) {
//             return;
//         }

//         const question = questionsData[selectedQuestion.index];

//         // Create a Webview Panel for answering a question
//         const panel = vscode.window.createWebviewPanel(
//             'answerQuestion', // Panel ID
//             'Answer Question', // Panel title
//             vscode.ViewColumn.One, // Show in the active column
//             { enableScripts: true } // Allow JavaScript in the Webview
//         );

//         panel.webview.html = `
//     <!DOCTYPE html>
//     <html lang="en">
//     <head>
//       <meta charset="UTF-8">
//       <meta name="viewport" content="width=device-width, initial-scale=1.0">
//       <title>Answer Question</title>
//       <style>
//         body { font-family: Arial, sans-serif; margin: 20px; }
//         textarea { width: 100%; height: 80px; font-size: 14px; margin-bottom: 10px; }
//         button { padding: 10px 20px; background: #007acc; color: white; border: none; cursor: pointer; }
//         button:hover { background: #005a9e; }
//       </style>
//     </head>
//     <body>
//       <h1>Answer a Question</h1>
//       <p><strong>Question:</strong> ${question.text}</p>
//       <p><strong>Highlighted Code:</strong></p>
//       <pre>${question.highlightedCode || 'No highlighted code'}</pre>
//       <textarea id="answer" placeholder="Type your answer here..."></textarea>
//       <button onclick="submitAnswer()">Submit Answer</button>
//       <script>
//         const vscode = acquireVsCodeApi();
//         function submitAnswer() {
//           const answer = document.getElementById('answer').value;
//           if (answer.trim() === '') {
//             alert('Answer cannot be empty!');
//             return;
//           }
//           vscode.postMessage({ answer });
//         }
//       </script>
//     </body>
//     </html>
//     `;

//         panel.webview.onDidReceiveMessage((message) => {
//             if (message.answer) {
//                 question.answer = message.answer;
//                 vscode.window.showInformationMessage('Answer added successfully!');
//                 panel.dispose();
//             }
//         });
//     });


//     // Command: View all questions and answers in a Webview
//     let viewQuestionsAndAnswersCommand = vscode.commands.registerCommand('extension.viewQuestionsAndAnswers', async () => {
//         if (questionsData.length === 0) {
//             vscode.window.showInformationMessage('No questions or answers available yet!');
//             return;
//         }

//         // Create a Webview Panel for viewing questions and answers
//         const panel = vscode.window.createWebviewPanel(
//             'viewQuestionsAndAnswers', // Panel ID
//             'View Questions and Answers', // Panel title
//             vscode.ViewColumn.One, // Show in the active column
//             { enableScripts: true } // Allow JavaScript in the Webview
//         );

//         // Build a table with all the questions and answers
//         const questionsTable = questionsData.map((qa, index) => {
//             const range = `${qa.range.start.line}:${qa.range.start.character} - ${qa.range.end.line}:${qa.range.end.character}`;
//             return `
//         <tr>
//           <td>${index + 1}</td>
//           <td>${qa.filePath}</td>
//           <td>${range}</td>
//           <td><pre>${qa.highlightedCode || 'No highlighted code'}</pre></td>
//           <td>${qa.text || 'No question'}</td>
//           <td>${qa.answer || 'No answer'}</td>
//         </tr>
//       `;
//         }).join('');

//         // HTML content for the Webview
//         panel.webview.html = `
//       <!DOCTYPE html>
//       <html lang="en">
//       <head>
//         <meta charset="UTF-8">
//         <meta name="viewport" content="width=device-width, initial-scale=1.0">
//         <title>View Questions and Answers</title>
//         <style>
//           body { font-family: Arial, sans-serif; margin: 20px; }
//           table { width: 100%; border-collapse: collapse; margin-top: 20px; }
//           th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
//           th { background-color: #007acc; color: white; }
//           pre { background-color:rgb(0, 0, 0); padding: 5px; border-radius: 5px; }
//           button { margin-top: 20px; padding: 10px 20px; background: #007acc; color: white; border: none; cursor: pointer; }
//           button:hover { background: #005a9e; }
//         </style>
//       </head>
//       <body>
//         <h1>All Questions and Answers</h1>
//         <table>
//           <thead>
//             <tr>
//               <th>#</th>
//               <th>File</th>
//               <th>Range</th>
//               <th>Highlighted Code</th>
//               <th>Question</th>
//               <th>Answer</th>
//             </tr>
//           </thead>
//           <tbody>
//             ${questionsTable}
//           </tbody>
//         </table>
//         <button id="export">Export to CSV</button>
//         <script>
//           document.getElementById('export').addEventListener('click', () => {
//             const rows = [
//               ['#', 'File', 'Range', 'Highlighted Code', 'Question', 'Answer'],
//               ...${JSON.stringify(questionsData.map((qa, index) => [
//             index + 1,
//             qa.filePath,
//             `${qa.range.start.line}:${qa.range.start.character} - ${qa.range.end.line}:${qa.range.end.character}`,
//             qa.highlightedCode || 'No highlighted code',
//             qa.text || 'No question',
//             qa.answer || 'No answer'
//         ]))}
//             ];

//             const csvContent = rows.map(e => e.join(",")).join("\n");
//             const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
//             const url = URL.createObjectURL(blob);
//             const link = document.createElement('a');
//             link.setAttribute('href', url);
//             link.setAttribute('download', 'questions_and_answers.csv');
//             document.body.appendChild(link);
//             link.click();
//             document.body.removeChild(link);
//           });
//         </script>
//       </body>
//       </html>
//     `;
//     });

//     context.subscriptions.push(
//         highlightAndCommentCommand,
//         viewCommentsCommand,
//         askQuestionCommand,
//         answerQuestionCommand,
//         viewQuestionsAndAnswersCommand
//     );
// }

// /**
//  * Deactivate the extension
//  */
// function deactivate() { }

// module.exports = {
//     activate,
//     deactivate,
// };




















































// // Extension entry point
// const vscode = require('vscode');
// const fs = require('fs');
// const path = require('path');

// // In-memory storage for comments and questions
// const commentsData = [];
// const questionsData = [];

// // Helper function to save data to a file
// function saveDataToFile(fileName, data) {
//     const filePath = path.join(__dirname, fileName);
//     fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
// }

// // Helper function to load data from a file
// function loadDataFromFile(fileName) {
//     const filePath = path.join(__dirname, fileName);
//     if (fs.existsSync(filePath)) {
//         return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
//     }
//     return [];
// }

// /**
//  * Activate the extension
//  * @param {vscode.ExtensionContext} context 
//  */
// function activate(context) {
//     // Load persisted data
//     commentsData.push(...loadDataFromFile('commentsData.json'));
//     questionsData.push(...loadDataFromFile('questionsData.json'));

//     // Command: Highlight code and add a comment
//     let highlightAndCommentCommand = vscode.commands.registerCommand('extension.highlightAndComment', async () => {
//         const editor = vscode.window.activeTextEditor;
//         if (!editor) {
//             vscode.window.showErrorMessage('No active editor found.');
//             return;
//         }

//         const selection = editor.selection;
//         if (selection.isEmpty) {
//             vscode.window.showErrorMessage('Please select a code snippet to comment on.');
//             return;
//         }

//         const range = new vscode.Range(selection.start, selection.end);
//         const selectedText = editor.document.getText(range);

//         // Create a Webview Panel for adding a comment
//         const panel = vscode.window.createWebviewPanel(
//             'addComment', // Panel ID
//             'Add Comment', // Panel title
//             vscode.ViewColumn.One, // Show in the active column
//             { enableScripts: true } // Allow JavaScript in the Webview
//         );

//         // HTML content for the Webview
//         panel.webview.html = `
//       <!DOCTYPE html>
//       <html lang="en">
//       <head>
//         <meta charset="UTF-8">
//         <meta name="viewport" content="width=device-width, initial-scale=1.0">
//         <title>Add Comment</title>
//         <style>
//           body { font-family: Arial, sans-serif; margin: 20px; }
//           textarea { width: 100%; height: 100px; font-size: 14px; margin-bottom: 10px; }
//           button { padding: 10px 20px; background: #007acc; color: white; border: none; cursor: pointer; }
//           button:hover { background: #005a9e; }
//         </style>
//       </head>
//       <body>
//         <h1>Add a Comment</h1>
//         <p><strong>Selected Code:</strong></p>
//         <pre>${selectedText}</pre>
//         <textarea id="comment" placeholder="Write your comment here..."></textarea>
//         <button onclick="submitComment()">Submit Comment</button>
//         <script>
//           const vscode = acquireVsCodeApi();
//           function submitComment() {
//             const comment = document.getElementById('comment').value;
//             if (comment.trim() === '') {
//               alert('Comment cannot be empty!');
//               return;
//             }
//             vscode.postMessage({ comment });
//           }
//         </script>
//       </body>
//       </html>
//     `;

//         // Handle messages from the Webview
//         panel.webview.onDidReceiveMessage((message) => {
//             if (message.comment) {
//                 // Save the comment
//                 commentsData.push({
//                     filePath: editor.document.uri.fsPath,
//                     range: {
//                         start: { line: selection.start.line, character: selection.start.character },
//                         end: { line: selection.end.line, character: selection.end.character },
//                     },
//                     text: message.comment,
//                     highlightedCode: selectedText, // Save the highlighted code
//                     replies: [],
//                     resolved: false,
//                 });

//                 // Persist data
//                 saveDataToFile('commentsData.json', commentsData);

//                 const decorationType = vscode.window.createTextEditorDecorationType({
//                     backgroundColor: 'rgba(144,238,144,0.5)', // Light green highlight
//                 });
//                 editor.setDecorations(decorationType, [range]);

//                 vscode.window.showInformationMessage('Comment added successfully!');
//                 panel.dispose();
//             }
//         });
//     });

//     // Command: View all comments in a Webview
//     let viewCommentsCommand = vscode.commands.registerCommand('extension.viewComments', async () => {
//         if (commentsData.length === 0) {
//             vscode.window.showInformationMessage('No comments added yet!');
//             return;
//         }

//         // Create a Webview Panel for viewing comments
//         const panel = vscode.window.createWebviewPanel(
//             'viewComments', // Panel ID
//             'View Comments', // Panel title
//             vscode.ViewColumn.One, // Show in the active column
//             { enableScripts: true } // Allow JavaScript in the Webview
//         );

//         // Build a table with all the comments
//         const commentsTable = commentsData.map((comment, index) => {
//             const range = `${comment.range.start.line}:${comment.range.start.character} - ${comment.range.end.line}:${comment.range.end.character}`;
//             return `
//         <tr>
//           <td>${index + 1}</td>
//           <td>${comment.filePath}</td>
//           <td>${range}</td>
//           <td><pre>${comment.highlightedCode || 'No highlighted code'}</pre></td>
//           <td>${comment.text || 'No text'}</td>
//           <td>${comment.replies.length > 0 ? comment.replies.join(', ') : 'No replies'}</td>
//         </tr>
//       `;
//         }).join('');

//         // HTML content for the Webview
//         panel.webview.html = `
//       <!DOCTYPE html>
//       <html lang="en">
//       <head>
//         <meta charset="UTF-8">
//         <meta name="viewport" content="width=device-width, initial-scale=1.0">
//         <title>View Comments</title>
//         <style>
//           body { font-family: Arial, sans-serif; margin: 20px; }
//           table { width: 100%; border-collapse: collapse; margin-top: 20px; }
//           th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
//           th { background-color: #007acc; color: white; }
//           pre { background-color:rgb(0, 0, 0); padding: 5px; border-radius: 5px; }
//         </style>
//       </head>
//       <body>
//         <h1>All Comments</h1>
//         <table>
//           <thead>
//             <tr>
//               <th>#</th>
//               <th>File</th>
//               <th>Range</th>
//               <th>Highlighted Code</th>
//               <th>Comment</th>
//               <th>Replies</th>
//             </tr>
//           </thead>
//           <tbody>
//             ${commentsTable}
//           </tbody>
//         </table>
//       </body>
//       </html>
//     `;
//     });

//     context.subscriptions.push(highlightAndCommentCommand, viewCommentsCommand);
// }

// /**
//  * Deactivate the extension
//  */
// function deactivate() { }

// module.exports = {
//     activate,
//     deactivate,
// };



















// // Extension entry point
// const vscode = require('vscode');
// const fs = require('fs');
// const path = require('path');

// // In-memory storage for comments and questions
// const commentsData = [];
// const questionsData = [];

// // Helper function to save data to a file
// function saveDataToFile(fileName, data) {
//     const filePath = path.join(__dirname, fileName);
//     fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
// }

// // Helper function to load data from a file
// function loadDataFromFile(fileName) {
//     const filePath = path.join(__dirname, fileName);
//     if (fs.existsSync(filePath)) {
//         return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
//     }
//     return [];
// }

// /**
//  * Activate the extension
//  * @param {vscode.ExtensionContext} context 
//  */
// function activate(context) {
//     // Load persisted data
//     commentsData.push(...loadDataFromFile('commentsData.json'));
//     questionsData.push(...loadDataFromFile('questionsData.json'));

//     // Command: Highlight code and add a comment
//     let highlightAndCommentCommand = vscode.commands.registerCommand('extension.highlightAndComment', async () => {
//         const editor = vscode.window.activeTextEditor;
//         if (!editor) {
//             vscode.window.showErrorMessage('No active editor found.');
//             return;
//         }

//         const selection = editor.selection;
//         if (selection.isEmpty) {
//             vscode.window.showErrorMessage('Please select a code snippet to comment on.');
//             return;
//         }

//         const range = new vscode.Range(selection.start, selection.end);
//         const selectedText = editor.document.getText(range);

//         // Create a Webview Panel for adding a comment
//         const panel = vscode.window.createWebviewPanel(
//             'addComment', // Panel ID
//             'Add Comment', // Panel title
//             vscode.ViewColumn.One, // Show in the active column
//             { enableScripts: true } // Allow JavaScript in the Webview
//         );

//         // HTML content for the Webview
//         panel.webview.html = `
//       <!DOCTYPE html>
//       <html lang="en">
//       <head>
//         <meta charset="UTF-8">
//         <meta name="viewport" content="width=device-width, initial-scale=1.0">
//         <title>Add Comment</title>
//         <style>
//           body { font-family: Arial, sans-serif; margin: 20px; }
//           textarea { width: 100%; height: 100px; font-size: 14px; margin-bottom: 10px; }
//           button { padding: 10px 20px; background: #007acc; color: white; border: none; cursor: pointer; }
//           button:hover { background: #005a9e; }
//         </style>
//       </head>
//       <body>
//         <h1>Add a Comment</h1>
//         <p><strong>Selected Code:</strong></p>
//         <pre>${selectedText}</pre>
//         <textarea id="comment" placeholder="Write your comment here..."></textarea>
//         <button onclick="submitComment()">Submit Comment</button>
//         <script>
//           const vscode = acquireVsCodeApi();
//           function submitComment() {
//             const comment = document.getElementById('comment').value;
//             if (comment.trim() === '') {
//               alert('Comment cannot be empty!');
//               return;
//             }
//             vscode.postMessage({ comment });
//           }
//         </script>
//       </body>
//       </html>
//     `;

//         // Handle messages from the Webview
//         panel.webview.onDidReceiveMessage((message) => {
//             if (message.comment) {
//                 // Save the comment
//                 commentsData.push({
//                     filePath: editor.document.uri.fsPath,
//                     range: {
//                         start: { line: selection.start.line, character: selection.start.character },
//                         end: { line: selection.end.line, character: selection.end.character },
//                     },
//                     text: message.comment,
//                     highlightedCode: selectedText, // Save the highlighted code
//                     replies: [],
//                     resolved: false, // Add resolved field
//                 });

//                 // Persist data
//                 saveDataToFile('commentsData.json', commentsData);

//                 const decorationType = vscode.window.createTextEditorDecorationType({
//                     backgroundColor: 'rgba(144,238,144,0.5)', // Light green highlight
//                 });
//                 editor.setDecorations(decorationType, [range]);

//                 vscode.window.showInformationMessage('Comment added successfully!');
//                 panel.dispose();
//             }
//         });
//     });

//     // Command: View all comments in a Webview
//     let viewCommentsCommand = vscode.commands.registerCommand('extension.viewComments', async () => {
//         if (commentsData.length === 0) {
//             vscode.window.showInformationMessage('No comments added yet!');
//             return;
//         }

//         // Create a Webview Panel for viewing comments
//         const panel = vscode.window.createWebviewPanel(
//             'viewComments', // Panel ID
//             'View Comments', // Panel title
//             vscode.ViewColumn.One, // Show in the active column
//             { enableScripts: true } // Allow JavaScript in the Webview
//         );

//         // Build a table with all the comments
//         const commentsTable = commentsData.map((comment, index) => {
//             const range = `${comment.range.start.line}:${comment.range.start.character} - ${comment.range.end.line}:${comment.range.end.character}`;
//             return `
//         <tr>
//           <td>${index + 1}</td>
//           <td>${comment.filePath}</td>
//           <td>${range}</td>
//           <td><pre>${comment.highlightedCode || 'No highlighted code'}</pre></td>
//           <td>${comment.text || 'No text'}</td>
//           <td>
//             ${comment.resolved ? 'Resolved' : `<button onclick="resolveComment(${index})">Resolve</button>`}
//           </td>
//         </tr>
//       `;
//         }).join('');

//         // HTML content for the Webview
//         panel.webview.html = `
//       <!DOCTYPE html>
//       <html lang="en">
//       <head>
//         <meta charset="UTF-8">
//         <meta name="viewport" content="width=device-width, initial-scale=1.0">
//         <title>View Comments</title>
//         <style>
//           body { font-family: Arial, sans-serif; margin: 20px; }
//           table { width: 100%; border-collapse: collapse; margin-top: 20px; }
//           th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
//           th { background-color: #007acc; color: white; }
//           pre { background-color:rgb(0, 0, 0); padding: 5px; border-radius: 5px; }
//         </style>
//       </head>
//       <body>
//         <h1>All Comments</h1>
//         <table>
//           <thead>
//             <tr>
//               <th>#</th>
//               <th>File</th>
//               <th>Range</th>
//               <th>Highlighted Code</th>
//               <th>Comment</th>
//               <th>Actions</th>
//             </tr>
//           </thead>
//           <tbody>
//             ${commentsTable}
//           </tbody>
//         </table>
//         <script>
//           const vscode = acquireVsCodeApi();

//           function resolveComment(index) {
//             vscode.postMessage({ command: 'resolve', index });
//           }
//         </script>
//       </body>
//       </html>
//     `;

//         // Handle messages from the Webview
//         panel.webview.onDidReceiveMessage((message) => {
//             if (message.command === 'resolve') {
//                 commentsData[message.index].resolved = true;
//                 saveDataToFile('commentsData.json', commentsData);

//                 // Refresh Webview
//                 const updatedCommentsTable = commentsData.map((comment, index) => {
//                     const range = `${comment.range.start.line}:${comment.range.start.character} - ${comment.range.end.line}:${comment.range.end.character}`;
//                     return `
//             <tr>
//               <td>${index + 1}</td>
//               <td>${comment.filePath}</td>
//               <td>${range}</td>
//               <td><pre>${comment.highlightedCode || 'No highlighted code'}</pre></td>
//               <td>${comment.text || 'No text'}</td>
//               <td>
//                 ${comment.resolved ? 'Resolved' : `<button onclick="resolveComment(${index})">Resolve</button>`}
//               </td>
//             </tr>
//           `;
//                 }).join('');
//                 panel.webview.html = panel.webview.html.replace(/<tbody>[\s\S]*?<\/tbody>/, `<tbody>${updatedCommentsTable}</tbody>`);
//             }
//         });
//     });

//     context.subscriptions.push(highlightAndCommentCommand, viewCommentsCommand);
// }

// /**
//  * Deactivate the extension
//  */
// function deactivate() { }

// module.exports = {
//     activate,
//     deactivate,
// };































