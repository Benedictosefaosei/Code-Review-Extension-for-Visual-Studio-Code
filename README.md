# Code Review Extension

Welcome to the **Code Review Extension**! This extension allows users to easily review and comment on code directly within Visual Studio Code. It is especially useful for instructors and collaborators who need to leave detailed comments or questions about specific parts of the code.

---

## **Features**

### 1. Highlight Code and Add Comments
- **How to Use**:
  1. Highlight a code snippet in the editor.
  2. Right-click and select **"Highlight and Add Comment"** from the context menu.
  3. A panel will open where you can write your comment and save it.
  4. The highlighted code will be marked with a green background.

- **Shortcut**: You can also invoke this feature from the Command Palette by pressing `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac) and selecting **"Highlight and Add Comment"**.

### 2. View All Comments
- **How to Use**:
  1. Open the Command Palette and select **"View All Comments"**.
  2. A table will appear in a panel listing all the comments, including:
     - The file where the comment was made.
     - The range of the highlighted code.
     - The highlighted code snippet.
     - The comment text.
     - A button to mark a comment as resolved.
  
- **Resolve Comments**: Click the **"Resolve"** button in the table to mark a comment as resolved.

### 3. Ask Questions
- **How to Use**:
  1. Highlight a code snippet in the editor.
  2. Right-click and select **"Ask Question"** from the context menu.
  3. A panel will open where you can write your question and save it.

- **Shortcut**: You can invoke this feature from the Command Palette by selecting **"Ask Question"**.

### 4. Answer Questions
- **How to Use**:
  1. Open the Command Palette and select **"Answer Question"**.
  2. A list of questions will appear.
  3. Select a question to answer. A panel will open where you can type your answer and save it.

- **View Updated Answers**: Once a question is answered, the answer will be displayed in the **View Questions and Answers** table.

### 5. View Questions and Answers
- **How to Use**:
  1. Open the Command Palette and select **"View Questions and Answers"**.
  2. A table will appear listing all questions, answers, and associated code snippets.
  3. Questions can be answered by clicking the **"Answer"** button in the table.

### 6. Export Comments and Questions
- **How to Use**:
  1. In the **View Questions and Answers** panel, click the **"Export to CSV"** button.
  2. This will download a CSV file containing all questions, answers, and highlighted code snippets.

---

## **Installation**

1. Open Visual Studio Code.
2. Go to the Extensions Marketplace (`Ctrl+Shift+X` or `Cmd+Shift+X` on Mac).
3. Search for **Code Review Extension**.
4. Click **Install**.

---

## **How It Works**

1. **Data Storage**: Comments and questions are saved as JSON files (`commentsData.json` and `questionsData.json`) in the current project directory. This ensures that your data is project-specific and portable.
2. **Green Highlights**: Any code snippet with comments or questions will be visually highlighted with a green background, making it easy to identify.
3. **Webview Panels**: The extension uses rich Webview panels to display comments, questions, and answers in a user-friendly table format.

---

## **Commands and Shortcuts**
| Command                       | Shortcut            | Context Menu Option              |
|-------------------------------|---------------------|----------------------------------|
| Highlight and Add Comment     | `Ctrl+Shift+P`      | Yes                              |
| Ask Question                  | `Ctrl+Shift+P`      | Yes                              |
| Answer Question               | `Ctrl+Shift+P`      | No                               |
| View All Comments             | `Ctrl+Shift+P`      | No                               |
| View Questions and Answers    | `Ctrl+Shift+P`      | No                               |

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

