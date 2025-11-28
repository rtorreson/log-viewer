# Log Viewer

Visualizador de logs web, simples e rápido. Sem backend, sem persistência, totalmente client-side.

![Nuxt](https://img.shields.io/badge/Nuxt-4-00DC82?logo=nuxtdotjs)
![License](https://img.shields.io/badge/license-MIT-blue)
![Docker](https://img.shields.io/badge/docker-ready-2496ED?logo=docker)

## Screenshot

![Log Viewer Screenshot](docs/screenshot.png)

## Features

- Upload de arquivos `.log` e `.txt`
- Parsing automático de múltiplos formatos (JSON, Apache, Syslog, Custom)
- Busca avançada (contém, exato, regex, começa/termina com)
- Filtro por nível de log (ERROR, WARN, INFO, DEBUG, TRACE)
- Case sensitive toggle
- Estatísticas em tempo real
- Interface dark mode

## Quick Start

### Docker (Recomendado)

```bash
docker run -d -p 3000:3000 ghcr.io/rtorreson/log-viewer:latest
```

Acesse: http://localhost:3000

### Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Dev server
npm run dev

# Build
npm run build

# Preview build
npm run preview
```

## Docker Build Manual

```bash
# Build da imagem
docker build -t log-viewer .

# Rodar container
docker run -d -p 3000:3000 --name log-viewer log-viewer
```

## Configuração

| Variável | Default | Descrição |
|----------|---------|-----------|
| `PORT` | `3000` | Porta do servidor |
| `HOST` | `0.0.0.0` | Host do servidor |

## Stack

- [Nuxt 4](https://nuxt.com)
- [Vue 3](https://vuejs.org)
- [Nuxt UI](https://ui.nuxt.com)
- [Tailwind CSS](https://tailwindcss.com)

## Contribuindo

Este projeto é **open source** e aberto a melhorias.

1. Fork o repositório
2. Crie uma branch (`git checkout -b feature/minha-feature`)
3. Commit suas mudanças (`git commit -m 'Add feature'`)
4. Push para a branch (`git push origin feature/minha-feature`)
5. Abra um Pull Request

## License

MIT

