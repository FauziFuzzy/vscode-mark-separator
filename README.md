# MARK Separator

Renders a horizontal line above `// MARK:` comments — just like Xcode.

![Demo](https://raw.githubusercontent.com/FauziFuzzy/vscode-mark-separator/main/demo.png)

## Features

- Draws a visual separator line above any `// MARK:` comment
- Line color automatically matches your theme's comment color
- Line width limited to your editor ruler (default: 80 columns)
- Works with all languages — Dart, Swift, Kotlin, JavaScript, TypeScript, and more
- Updates instantly as you type
- Adapts when you switch themes

## Usage

Write a comment with `// MARK:` and a separator line appears above it.

```dart
// MARK: — CONSTRUCTORS
const MyWidget();

// MARK: — METHODS
void build() {}
```

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `markSeparator.lineColor` | *(theme comment color)* | Custom separator color. Leave empty to match your theme. |
| `markSeparator.lineWidth` | `1px` | Thickness of the separator line. |
| `markSeparator.lineStyle` | `solid` | Line style: `solid`, `dashed`, or `dotted`. |
| `markSeparator.enabledLanguages` | `[]` | Restrict to specific languages (e.g. `["dart", "swift"]`). Empty = all. |

## Installation

### From Marketplace

Search for **MARK Separator** in the VS Code Extensions panel.

### From VSIX

```bash
code --install-extension mark-separator-0.0.1.vsix
```

## Inspiration

Xcode draws a horizontal separator above `// MARK:` comments to visually organize code into sections. This extension brings that same behavior to VS Code.

## License

MIT
