import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

const MARK_PATTERN = /\/\/\s*MARK:\s*(.*)/;

let separatorDecorationType: vscode.TextEditorDecorationType;
let resolvedColor: string;
let resolvedWidth: string;
let resolvedStyle: string;
let rulerColumn: number;

function resolveThemeIncludes(themePath: string): any[] {
	try {
		const raw = fs.readFileSync(themePath, 'utf8');
		const data = JSON.parse(raw);
		let tokenColors: any[] = data.tokenColors || [];

		if (data.include) {
			const parentPath = path.join(path.dirname(themePath), data.include);
			const parentTokens = resolveThemeIncludes(parentPath);
			tokenColors = [...parentTokens, ...tokenColors];
		}

		return tokenColors;
	} catch {
		return [];
	}
}

function getCommentColorFromTheme(): string | undefined {
	const themeName = vscode.workspace.getConfiguration('workbench').get<string>('colorTheme');
	if (!themeName) { return undefined; }

	for (const ext of vscode.extensions.all) {
		const themes = ext.packageJSON?.contributes?.themes as any[] | undefined;
		if (!themes) { continue; }

		const match = themes.find((t: any) => t.label === themeName || t.id === themeName);
		if (!match) { continue; }

		const themePath = path.join(ext.extensionPath, match.path);
		const tokenColors = resolveThemeIncludes(themePath);

		let commentColor: string | undefined;
		for (const rule of tokenColors) {
			const scope = rule.scope;
			if (!scope) { continue; }
			const scopes = Array.isArray(scope) ? scope : typeof scope === 'string' ? scope.split(',').map((s: string) => s.trim()) : [scope];

			for (const s of scopes) {
				if (s === 'comment' || s === 'comment.line' || s === 'comment.block'
					|| s === 'comment.line.double-slash' || s === 'punctuation.definition.comment') {
					commentColor = rule.settings?.foreground;
				}
			}
		}

		if (commentColor) { return commentColor; }
	}
	return undefined;
}

function getRulerColumn(): number {
	const rulers = vscode.workspace.getConfiguration('editor').get<any[]>('rulers') || [];
	if (rulers.length > 0) {
		const first = rulers[0];
		return typeof first === 'number' ? first : first?.column ?? 80;
	}
	return 80;
}

function createDecorationType(): void {
	const config = vscode.workspace.getConfiguration('markSeparator');
	const color = config.get<string>('lineColor') || '';
	resolvedWidth = config.get<string>('lineWidth') || '1px';
	resolvedStyle = config.get<string>('lineStyle') || 'solid';
	resolvedColor = color || getCommentColorFromTheme() || '#6A9955';
	rulerColumn = getRulerColumn();

	separatorDecorationType = vscode.window.createTextEditorDecorationType({
		textDecoration: `none; border-top: ${resolvedWidth} ${resolvedStyle} ${resolvedColor}; padding-top: 0.3em`,
	});
}

function isLanguageEnabled(languageId: string): boolean {
	const config = vscode.workspace.getConfiguration('markSeparator');
	const enabled = config.get<string[]>('enabledLanguages') || [];
	return enabled.length === 0 || enabled.includes(languageId);
}

function updateDecorations(editor: vscode.TextEditor): void {
	if (!isLanguageEnabled(editor.document.languageId)) {
		editor.setDecorations(separatorDecorationType, []);
		return;
	}

	const decorations: vscode.DecorationOptions[] = [];
	const text = editor.document.getText();
	const lines = text.split('\n');
	const tabSize = editor.options.tabSize as number || 4;

	for (let i = 0; i < lines.length; i++) {
		const match = lines[i].match(MARK_PATTERN);
		if (match) {
			const lineText = lines[i];

			let visualLength = 0;
			for (const ch of lineText) {
				visualLength += ch === '\t' ? tabSize - (visualLength % tabSize) : 1;
			}

			const padCount = Math.max(0, rulerColumn - visualLength);
			const range = new vscode.Range(i, 0, i, lineText.length);

			decorations.push({
				range,
				renderOptions: {
					after: {
						contentText: '\u00A0'.repeat(padCount),
						textDecoration: `none; border-top: ${resolvedWidth} ${resolvedStyle} ${resolvedColor}; padding-top: 0.3em`,
					},
				},
			});
		}
	}

	editor.setDecorations(separatorDecorationType, decorations);
}

function updateAllEditors(): void {
	for (const editor of vscode.window.visibleTextEditors) {
		updateDecorations(editor);
	}
}

export function activate(context: vscode.ExtensionContext): void {
	createDecorationType();
	updateAllEditors();

	context.subscriptions.push(
		vscode.window.onDidChangeActiveTextEditor((editor) => {
			if (editor) {
				updateDecorations(editor);
			}
		}),

		vscode.workspace.onDidChangeTextDocument((event) => {
			const editor = vscode.window.activeTextEditor;
			if (editor && event.document === editor.document) {
				updateDecorations(editor);
			}
		}),

		vscode.workspace.onDidChangeConfiguration((event) => {
			if (event.affectsConfiguration('markSeparator') || event.affectsConfiguration('workbench.colorTheme') || event.affectsConfiguration('editor.rulers')) {
				separatorDecorationType.dispose();
				createDecorationType();
				updateAllEditors();
			}
		}),
	);
}

export function deactivate(): void {
	separatorDecorationType?.dispose();
}
