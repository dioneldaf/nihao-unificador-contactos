# Unificador de contactos · Nihao53

Dashboard interno (React + Vite) para que el equipo de Nihao53 revise y **fusione
contactos duplicados** que un proceso de IA marca para revisión humana.

La IA agrupa contactos sospechosos en "bloques". Cuando no puede confirmar la fusión
de forma automática, delega la decisión a una persona: el revisor ve los contactos del
bloque, construye **un único contacto unificado** (arrastrando valores o editándolos),
elige cuál es el **principal** (el que sobrevive) y confirma.

![Identidad](public/favicon-192x192.png)

## Características

- **Vista de lista** de bloques: incompletos primero (de mayor a menor confianza) y los
  completos al final. Badges de confianza y estado, con los pendientes destacados.
- **Vista de detalle** con:
  - Panel de contexto de la IA (`reason` + `confidence`).
  - Tarjetas de contacto con los campos de negocio y badges de ayuda: **rank**
    (`customer_rank + supplier_rank`) y **cuenta de usuario activa** (con último acceso).
  - Tarjeta **Contacto unificado** como zona de *drag & drop* (arrastrar valores o
    escribirlos a mano), con atajo "rellenar con el principal".
  - Marcar **principal**, **excluir** contactos y aviso suave si el principal elegido no
    tiene cuenta de usuario pero otro del grupo sí.
- Navegación **Anterior/Siguiente** entre pendientes y barra de progreso.
- Acciones **Listo** (fusionar) y **No son duplicados / Descartar**.

## Stack

- [React 18](https://react.dev/) + [Vite 5](https://vitejs.dev/)
- [@dnd-kit/core](https://dndkit.com/) para el *drag & drop*
- CSS plano con tokens de marca (sin librería de UI). Tipografías: Sora (títulos) y
  Manrope (cuerpo), vía Google Fonts.

## Puesta en marcha

Requisitos: Node.js 18+.

```bash
npm install
npm run dev      # http://localhost:5173
```

Otros scripts:

```bash
npm run build    # build de producción en dist/
npm run preview  # sirve el build localmente
```

## Integración con los webhooks

La app consume dos webhooks de `automatizaciones.nihao53.com`:

| Acción | Método | Endpoint |
| --- | --- | --- |
| Cargar bloques | `GET` | `/webhook/get-blocks-human` |
| Enviar resolución | `POST` | `/webhook/human_response` |

### CORS / proxy

Los webhooks **no devuelven cabeceras CORS**, por lo que el navegador no puede llamarlos
directamente. En desarrollo se resuelve con un **proxy de Vite** (ver
[`vite.config.js`](vite.config.js)): el front llama a `/api/*` y Vite lo reenvía a
`https://…/webhook/*`. Toda la lógica de red vive en [`src/api/blocks.js`](src/api/blocks.js).

> Para un despliegue en servidor habría que replicar este proxy (o añadir CORS al webhook
> en n8n). Ver _Despliegue_.

### Forma del POST a `human_response`

Se envía una **lista** con una entrada por contacto del bloque. Cada entrada incluye
`row_number` (del bloque), `id`, `action` y reenvía `user_ids` / `user_login_date` tal
cual vienen del `GET`:

- `update` → el contacto **principal** (incluye `merged_fields` con los valores finales).
- `archive` → contactos fusionados que **no** son el principal (se eliminan).
- `keep` → contactos excluidos (no se les hace nada). En "Descartar", **todos** van como `keep`.

```jsonc
[
  { "row_number": 5, "id": 999,  "action": "update",  "merged_fields": { /* … */ },
    "user_ids": [5198], "user_login_date": "2025-05-23 02:50:50" },
  { "row_number": 5, "id": 1493, "action": "archive", "user_ids": [], "user_login_date": null },
  { "row_number": 5, "id": 445,  "action": "keep",    "user_ids": [], "user_login_date": null }
]
```

En `merged_fields` los valores se **normalizan**: booleanos como `true`/`false` y vacíos
como `null`.

## Estructura

```
public/                 # favicons e identidad de marca
src/
  api/blocks.js         # fetchBlocks() y submitResolution() (POST)
  config/fields.js      # mapeo ESTRICTO de los 12 campos de negocio (etiquetas ES)
  lib/merge.js          # helpers puros (rank, normalización, formateo de fecha)
  components/            # BlockList, BlockReview, ContactCard, MergedContactCard, …
  styles/app.css        # tokens de marca, tipografía y estilos
  App.jsx               # estado, orden de bloques, navegación y resoluciones
vite.config.js          # proxy /api → /webhook (CORS en dev)
```

> El **mapeo de campos** (`config/fields.js`) es la única fuente de verdad de qué se
> muestra y se puede editar. `has_user`, `user_login_date`, `rank`, etc. son metadatos
> informativos: se muestran como ayuda pero no son campos editables de negocio.

## Despliegue

El proyecto está pensado para uso interno. Para producción:

1. `npm run build` y servir `dist/` (cualquier hosting estático o Nginx).
2. Hacer que `/api/*` llegue a `https://automatizaciones.nihao53.com/webhook/*`
   (proxy inverso en el servidor) **o** habilitar CORS en el webhook de n8n.

No requiere autenticación ni variables de entorno.
