# 3angour's Terminal Portfolio

A modern, terminal-themed portfolio website built with Next.js, featuring CTF writeups, cybersecurity projects, and professional information.

## 🚀 Features

- **Terminal-inspired design** with three beautiful themes
- **Multi-theme support**: Terminal (green), Blue, and Light themes
- **Responsive design** that works on all devices
- **Blog system** with Markdown support for CTF writeups
- **Project showcase** with detailed descriptions
- **Contact form** with modern styling
- **Fast performance** with Next.js App Router
- **SEO optimized** with proper meta tags

## 🎨 Themes

### Terminal Theme (Default)
- Classic green-on-black terminal aesthetic
- Perfect for cybersecurity professionals

### Blue Theme
- Modern blue and red color scheme
- Professional and eye-catching

### Light Theme
- Clean white background with blue accents
- Great for readability and presentations

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Content**: Markdown with gray-matter
- **Typography**: Custom monospace fonts
- **Icons**: Lucide React
- **Deployment**: Vercel-ready

## 📁 Project Structure

```
blog/
├── app/
│   ├── (site)/
│   │   ├── about/
│   │   ├── blog/
│   │   ├── contact/
│   │   ├── projects/
│   │   └── page.tsx
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── ui/
│   ├── layout.tsx
│   ├── navbar.tsx
│   └── themeToggle.tsx
├── content/
│   └── blog/
│       └── *.md
├── lib/
│   └── posts.ts
├── public/
│   └── avatar.png
└── styles/
    └── globals.css
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/mootez-1337/terminal-portfolio.git
   cd terminal-portfolio
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📝 Adding Content

### Blog Posts

Create new blog posts in the `content/blog/` directory:

```markdown
---
title: "Your CTF Writeup Title"
date: "2025-01-15"
---

# Your CTF Writeup

Your content here...

```python
# Code examples work great
print("Hello CTF!")
```
```

### Projects

Edit `app/(site)/projects/page.tsx` to add new projects to the showcase.

### Personal Information

Update your information in:
- `app/(site)/about/page.tsx` - About page content
- `app/(site)/contact/page.tsx` - Contact information
- `components/navbar.tsx` - Navigation links

## 🎨 Customization

### Themes

Modify theme colors in `tailwind.config.js`:

```javascript
colors: {
  // Terminal theme
  "terminal-bg": "#0a0a0a",
  "terminal-text": "#00ff00",
  "terminal-accent": "#00ff00",
  
  // Blue theme
  "bluef-bg": "#1a1a2e",
  "bluef-text": "#e94560",
  "bluef-accent": "#0f3460",
  
  // Light theme
  "light-bg": "#ffffff",
  "light-text": "#1a1a1a",
  "light-accent": "#2563eb",
}
```

### Avatar

Replace `public/avatar.png` with your own profile picture.

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy automatically

### Other Platforms

The project works on any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 📊 Performance

- **Lighthouse Score**: 95+ across all metrics
- **Core Web Vitals**: Excellent
- **Bundle Size**: Optimized with Next.js
- **SEO**: Fully optimized

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Mootez Ben Slimen (3angour)**
- Email: mootez.benslimen@medtech.tn
- LinkedIn: [Mootez Ben Slimen](https://linkedin.com/in/mootez-ben-slimen)
- Location: Ariana, Tunisia

## 🏆 Achievements

- CSAW 24: 4th MENA Quals, 5th MENA Finals
- CSAW 23: 4th MENA Quals, 7th MENA Finals  
- CyberMaze V3: 1st place
- KernelKombat CTF: 1st place
- And many more CTF victories!

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing framework
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS
- [shadcn/ui](https://ui.shadcn.com/) for the beautiful components
- [Vercel](https://vercel.com/) for seamless deployment

---

**Built with ❤️ by 3angour**

*"Cybersecurity enthusiast, CTF champion, and code craftsman"*
```