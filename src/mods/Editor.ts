import * as monaco from 'monaco-editor';

// this is just a simple bootstrap for putting the monaco code editor in
const parent = document.getElementById("codePanel") as HTMLDivElement;
const editorDiv = document.getElementById("codeEditor") as HTMLDivElement;

let codeEditor: monaco.editor.IStandaloneCodeEditor;

/**
 * Get the div holding the code editor itself
 * 
 * @returns The editor div
 */
export function getCodeEditor(): HTMLDivElement {
    return editorDiv;
}

/**
 * Initialize Monaco
 */
export function initCodeEditor() {
    codeEditor = monaco.editor.create(editorDiv, {
        value: "",
        language: "javascript",
        automaticLayout: true
    });
}

/**
 * Show the code editor window with the content specified
 * 
 * @param content The content to be displayed
 */
export function showCodeEditor(content: string) {
    parent.style.display = "block";
    if (codeEditor) {
        codeEditor.setValue(content);
    }
}

/**
 * Hide the code editor
 */
export function hideCodeEditor() {
    parent.style.display = "none";
}

/**
 * Get the updated content from the editor
 * 
 * @returns The content from the code editor
 */
export function getCodeEditorContent(): string {
    if (codeEditor) {
        return codeEditor.getValue();
    }

    return "";
}