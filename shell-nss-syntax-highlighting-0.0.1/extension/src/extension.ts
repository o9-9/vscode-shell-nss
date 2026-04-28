import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

interface CompletionInfo {
  kind: vscode.CompletionItemKind;
  insertType: "curly" | "round" | "curly+round" | "space";
}

const keywords: Record<string, CompletionInfo> = {
  settings: { kind: vscode.CompletionItemKind.Keyword, insertType: "curly" },
  theme: { kind: vscode.CompletionItemKind.Keyword, insertType: "curly" },
  modify: { kind: vscode.CompletionItemKind.Keyword, insertType: "round" },
  remove: { kind: vscode.CompletionItemKind.Keyword, insertType: "round" },
  item: { kind: vscode.CompletionItemKind.Keyword, insertType: "round" },
  separator: { kind: vscode.CompletionItemKind.Keyword, insertType: "round" },
  menu: { kind: vscode.CompletionItemKind.Keyword, insertType: "curly+round" },
  import: { kind: vscode.CompletionItemKind.Keyword, insertType: "space" },
};

export function activate(context: vscode.ExtensionContext) {
  const hoverFile = path.join(
    context.extensionPath,
    "syntaxes",
    "hoverDescriptions.json"
  );

  const hoverData: Record<string, string> = JSON.parse(
    fs.readFileSync(hoverFile, "utf8")
  );

  context.subscriptions.push(
    vscode.languages.registerHoverProvider("shell-nss", {
      provideHover(document, position) {
        const wordRange = document.getWordRangeAtPosition(position);
        if (!wordRange) {
          return;
        }

        const startPos = wordRange.start;
        if (startPos.character > 0) {
          const charBefore = document.getText(
            new vscode.Range(
              startPos.line,
              startPos.character - 1,
              startPos.line,
              startPos.character
            )
          );

          if (charBefore === ".") {
            return;
          }
        }

        const word = document.getText(wordRange);
        const description = hoverData[word];

        if (description) {
          const md = new vscode.MarkdownString(description);
          md.isTrusted = true;

          return new vscode.Hover(md);
        }
        return undefined;
      },
    })
  );

  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      "shell-nss",
      {
        provideCompletionItems(document, position) {
          const line = document.lineAt(position).text;
          const before = line.slice(0, position.character);

          if (before.endsWith(".")) {
            return undefined;
          }

          const completionItems: vscode.CompletionItem[] = [];
          for (const key in keywords) {
            const info = keywords[key];
            const item = new vscode.CompletionItem(key, info.kind);

            switch (info.insertType) {
              case "space": {
                item.insertText = key + " ";
                break;
              }
              case "round": {
                item.insertText = new vscode.SnippetString(key + "(${0})");
                break;
              }
              case "curly": {
                item.insertText = new vscode.SnippetString(key + " {${0}}");
                break;
              }
              case "curly+round": {
                item.insertText = new vscode.SnippetString(
                  key + "(${0}) {${1}}"
                );
                break;
              }
            }

            completionItems.push(item);
          }

          return completionItems;
        },
      },
      ""
    )
  );
}

export function deactivate() {}
