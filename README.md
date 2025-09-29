# CPGS Document Watermarking System

A professional document watermarking application designed for Babcock University's College of Postgraduate School (CPGS). This system provides a streamlined workflow for adding institutional watermarks to academic documents, ensuring proper attribution and review readiness.

## Features

- **Multi-format Support**: Process PDF and Word documents (DOC, DOCX)
- **Customizable Watermarks**: Configure text, opacity, font size, and color
- **Batch Processing**: Handle multiple documents simultaneously
- **Real-time Progress**: Live processing updates with pause/resume functionality
- **Professional UI**: Modern, accessible interface with university branding
- **Secure Processing**: Client-side validation and error handling

## Technology Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **UI Components**: Shadcn/ui + Radix UI
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **State Management**: TanStack Query + React Hook Form

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd cpgs-watermark-craft
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:8080`

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run build:dev` - Build in development mode
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint code analysis

## Usage

### Document Processing Workflow

1. **Dashboard**: View processing statistics and start new batches
2. **Upload**: Select PDF and Word documents (up to 50MB each)
3. **Configure**: Customize watermark appearance and settings
4. **Processing**: Monitor real-time progress with pause/resume options
5. **Results**: Download individual files or bulk ZIP archives

### Watermark Customization

- **Text**: Default "College of Postgraduate School, BU" or custom text
- **Opacity**: Adjustable from 10% to 70%
- **Font Size**: Small, Medium, or Large options
- **Color**: University Blue, Dark Gray, Black, or Red
- **Positioning**: Diagonal overlay across document pages

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Shadcn/ui component library
│   └── [features]/     # Feature-specific components
├── pages/              # Route-level page components
├── hooks/              # Custom React hooks
├── lib/                # Utility functions
└── assets/             # Static assets
```

## Configuration

The application uses a university-branded design system with:

- **Primary Color**: University Blue (#1e40af)
- **Professional Gradients**: Custom CSS gradients
- **Responsive Breakpoints**: Mobile-first design approach
- **Accessibility**: WCAG compliant components

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Open a Pull Request

## License

Copyright © 2024 Babcock University. All rights reserved.

## Contact

**College of Postgraduate School**  
Babcock University  
Ilishan-Remo, Ogun State, Nigeria

- Email: cpgs@babcock.edu.ng
- Phone: +234 (0) 803-761-3333

---

*CPGS Document Watermarking System - Professional document processing for academic excellence.*
