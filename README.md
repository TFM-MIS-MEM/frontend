# frontend — panel del cliente

Panel del SaaS de reconocimiento facial **por el canal web**. React + Vite +
Tailwind + shadcn/ui. Habla con la pasarela (`VITE_GATEWAY_URL`, por omisión
`http://localhost:8000`), solo con `Authorization: Bearer <jwt>`.

## Pantallas

| Pantalla | Ruta | Operación |
|---|---|---|
| Registro | `/register` | `register` → muestra la API KEY **una vez** → `login` |
| Inicio de sesión | `/login` | `login`, después `getMe` |
| Credenciales | `/credentials` | `rotateKey` (pide la contraseña) → muestra la clave nueva una vez |
| Galerías | `/galleries` | `listGalleries` y `createGallery` (nombre, descripción, modelo opcional; id copiable) |
| Detalle de galería | `/galleries/:id` | `getGallery` y `listIdentities` |
| Verificación | `/verify` | `verifyPair` con dos imágenes → misma persona o no, confianza, umbral y modelo |
| Pricing | enlace externo | ninguna: abre en otra pestaña la tarifa en SPHERE, `/p/{pricingId}?version={versionId}`, en la versión fijada en `pricing-microservice/pricing/sphere.env` |

Contratos: `auth-microservice/openapi/auth.yaml` y
`fr-commercial-microservice/openapi/fr-commercial.yaml`. Los errores se
muestran con el `code` y el `message` del `ErrorReport`; un `401` con sesión la
cierra.

## Lo que hay que saber antes de tocarlo

**La API KEY nunca se guarda en el navegador.** `auth` solo guarda su hash, así
que el panel la enseña al registrarse y al rotarla y la descarta al cerrar el
diálogo. Va en el backend del cliente, en `X-API-Key`; la pasarela no la admite
en el CORS a propósito. Lo fija `tests/register.test.tsx`.

**El JWT va en `sessionStorage`**: sobrevive a recargar y muere con la pestaña.
Su vigencia la decide `auth` (`JWT_EXPIRES_IN`).

**Sin evaluación de plan.** El plan lo evalúa `fr-commercial` con SPACE (F10,
TFM-MIS-MEM/docs#42): umbral configurable, límites y congelación. El panel no
lo replica; muestra lo que responda la API.

## Ejecutar

```sh
pnpm install
pnpm dev            # http://localhost:5173, contra la pasarela en :8000
pnpm test           # Vitest
pnpm lint && pnpm build
```

Sin `VITE_SPHERE_PRICING_ID` y `VITE_SPHERE_PRICING_VERSION_ID` (los valores de
`pricing-microservice/pricing/sphere.env`), todo funciona salvo el enlace a
Pricing, que no aparece: sin la versión, SPHERE abriría la última.

En contenedor, como lo levanta `scripts/dev-up.sh` del repositorio `docs`. El
compose exige `SPHERE_PRICING_ID` y `SPHERE_PRICING_VERSION_ID` en el entorno, y
no arranca sin ellas; `dev-up.sh` las exporta de `sphere.env`:

```sh
docker compose -f docker-compose.dev.yml up --build -d   # → http://localhost:5173
```

`VITE_GATEWAY_URL` se fija **al construir**: es la dirección de la pasarela
vista desde el navegador, no desde la red de Docker.

Con Node 25 o posterior, Node define su propio `localStorage` global y tapa el
de jsdom; `vite.config.ts` lo desactiva en los procesos de Vitest.
