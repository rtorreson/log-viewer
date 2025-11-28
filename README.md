# OpenWatch

Client-side observability suite. Logs, profiles, traces, and network analysis - all in your browser.

![Nuxt](https://img.shields.io/badge/Nuxt-4-00DC82?logo=nuxtdotjs)
![License](https://img.shields.io/badge/license-MIT-blue)
![Docker](https://img.shields.io/badge/docker-ready-2496ED?logo=docker)

## Screenshot

![OpenWatch Screenshot](docs/screenshot.png)

## Features

### Log Viewer
- Upload `.log` and `.txt` files
- Auto-parsing of multiple formats (JSON, Apache, Syslog, Custom)
- Advanced search (contains, exact, regex, starts/ends with)
- Filter by log level (ERROR, WARN, INFO, DEBUG, TRACE)
- Real-time statistics

### Profile Viewer
- Interactive Flame Graph
- Call Tree & Bottom-Up views
- Source View with heat map
- Function categorization (JS, Native, GC)
- Hot Functions list

### Profile Comparison
- Diff between two profiles
- Identify regressions and improvements
- Category comparison
- Delta stats

### Trace Viewer (Coming Soon)
- OpenTelemetry/Jaeger support
- Waterfall timeline
- Service map
- Span details

### Network Inspector (Coming Soon)
- HAR file analysis
- Request waterfall
- Headers, payload, response
- Performance timing

## Quick Start

### Docker (Recommended)

```bash
docker run -d -p 3000:3000 ghcr.io/rtorreson/openwatch:latest
```

Access: http://localhost:3000

### Local Development

```bash
# Install dependencies
npm install

# Dev server
npm run dev

# Build
npm run build

# Preview build
npm run preview
```

## Docker Build

```bash
# Build image
docker build -t openwatch .

# Run container
docker run -d -p 3000:3000 --name openwatch openwatch
```

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `HOST` | `0.0.0.0` | Server host |

## Stack

- [Nuxt 4](https://nuxt.com)
- [Vue 3](https://vuejs.org)
- [Nuxt UI](https://ui.nuxt.com)
- [Tailwind CSS](https://tailwindcss.com)

## Contributing

This project is **open source** and open to improvements.

1. Fork the repository
2. Create a branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'Add feature'`)
4. Push to branch (`git push origin feature/my-feature`)
5. Open a Pull Request

## License

MIT
