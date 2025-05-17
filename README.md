# Mind Map Creator

A clean, modern web application for creating intuitive mind maps with an iOS-inspired design. This tool allows users to visually organize their thoughts and ideas with a simple, user-friendly interface.


## Features

- **Intuitive Node Management**
  - Add, edit, and delete nodes with ease
  - Connect nodes with simple drag-and-drop
  - Organize your mind map visually by dragging nodes
  
- **Rich Customization Options**
  - Change font family for individual nodes
  - Customize text color for each node
  - Adjust background color of the entire mind map
  
- **Export Capabilities**
  - Export as high-quality PNG image
  - Export as PDF document with proper scaling
  - Clean exports with only the mind map content (no UI elements)
  
- **Powerful Editing Tools**
  - Undo/Redo functionality with keyboard shortcuts
  - Clear canvas option
  - Responsive design that works on various screen sizes


## Usage

### Creating Nodes

1. Enter text in the input field in the top-left corner
2. Click "Add" or press Enter to create a new node
3. Drag nodes to position them anywhere on the canvas

### Connecting Nodes

1. Click and drag from the bottom handle of a node (source)
2. Drop onto the top handle of another node (target)
3. A directional arrow will connect the two nodes

### Editing Nodes

1. Click on any node to select it
2. Use the sidebar panel to:
   - Edit the node text
   - Change the font family
   - Customize the text color
   - Delete the node

### Exporting Your Mind Map

1. Click the "Export" button in the header
2. Choose between PNG or PDF format
3. The exported file will contain only your mind map (no UI elements)

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Undo   | Ctrl+Z (Cmd+Z on Mac) |
| Redo   | Ctrl+Y or Ctrl+Shift+Z (Cmd+Y or Cmd+Shift+Z on Mac) |
| Add Node (when input is focused) | Enter |

## Technologies Used

- **React** - UI library
- **Next.js** - React framework
- **React Flow** - Interactive node-based UI
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **html-to-image** - Export functionality
- **jsPDF** - PDF generation

## Future Enhancements

- [ ] Auto-layout feature for automatic node arrangement
- [ ] Node templates for different types of information
- [ ] Local storage to save mind maps between sessions
- [ ] Collaboration features for real-time editing
- [ ] Node search functionality
- [ ] Additional export formats (SVG, JSON)
- [ ] Themes and presets

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by iOS design principles
- Built with [React Flow](https://reactflow.dev/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
