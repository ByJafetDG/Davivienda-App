# Davivienda SINPE Mobile

Aplicación móvil conceptual construida con React Native y Expo que simula la experiencia completa de la banca digital de Davivienda orientada a transferencias SINPE, recargas móviles, automatizaciones y seguimiento financiero. El proyecto se centra en una interfaz moderna con efectos tipo neón, animaciones fluidas y un flujo de datos local basado en _mock data_ controlado con Zustand.

---

## Características principales

- **Dashboard futurista** con saldo, accesos rápidos y resumen de actividad.
- **Historial filtrable** para transferencias y recargas, con filtros animados y resumen marquee.
- **Transferencias SINPE** con validación de teléfono y monto, confirmación simulada y QR scanner.
- **Recargas móviles** alineadas con la lógica de validación de montos y teléfonos usada en transferencias.
- **Contactos favoritos** con creación, edición, búsqueda inteligente y soporte para números sanitizados.
- **Automatizaciones** que asignan reglas basadas en teléfono a sobres digitales.
- **Gestor de sobres y metas** para organización del presupuesto.
- **Panel de notificaciones** y sección de insights financieros.

---

## Stack tecnológico

| Capa | Herramientas |
| --- | --- |
| **Core** | [React Native 0.81](https://reactnative.dev/), [Expo 54](https://docs.expo.dev/) |
| **Navegación** | [Expo Router 6](https://expo.github.io/router/), [React Navigation Native Stack](https://reactnavigation.org/docs/native-stack-navigator/) |
| **Animaciones** | [Moti](https://moti.fyi/) (basado en Reanimated), [react-native-reanimated](https://docs.swmansion.com/react-native-reanimated/) |
| **Estado global** | [Zustand](https://github.com/pmndrs/zustand) |
| **UI utilitaria** | Expo Linear Gradient, Vector Icons (`@expo/vector-icons`), componentes personalizados (NeonTextField, GlassCard, etc.) |
| **Utilidades** | formateo de moneda con `Intl.NumberFormat`, sanitización de teléfonos, generador de IDs |
| **Calidad** | ESLint (`eslint-config-universe`) |

---

## Estructura del proyecto

```
mobile-app/
├── app/                     # Entradas registradas por expo-router
│   ├── _layout.tsx          # Layout raíz (stack principal)
│   ├── index.tsx            # Splash / redirección inicial
│   └── (app)/               # Rutas principales de la aplicación
│       ├── _layout.tsx      # Layout que define bottom tabs
│       ├── home.tsx         # Home futurista con saldo y acciones rápidas
│       ├── history.tsx      # Historial filtrable
│       ├── transfer.tsx     # Flujo de transferencia
│       ├── confirm-transfer.tsx
│       ├── contacts.tsx
│       ├── automations.tsx
│       ├── envelopes.tsx
│       ├── goals.tsx
│       ├── insights.tsx
│       ├── notifications.tsx
│       ├── mobile-recharge.tsx
│       ├── charges.tsx
│       ├── profile.tsx
│       └── profile-qr.tsx
├── assets/                  # Imágenes, logos operadoras, fuentes
├── src/
│   ├── components/          # UI reutilizable (NeonTextField, GlassCard, etc.)
│   ├── navigation/          # Configuración adicional de navegación
│   ├── screens/             # Versiones "clásicas" de pantallas (antes de migrar a expo-router)
│   ├── store/               # Zustand store con estado completo de banca
│   ├── theme/               # Paleta de colores y ThemeProvider
│   └── utils/               # Helpers (currency, id, phone, amount)
├── android/                 # Proyecto nativo Android (Gradle)
├── app.json                 # Configuración Expo
├── tsconfig.json            # Configuración TypeScript
├── babel.config.js          # Alias y plugins de compilación
└── README.md                # Este documento
```

> **Nota:** Existe una doble fuente para pantallas (`app/(app)/` vs `src/screens/`). La carpeta `app` es el origen activo para navegación con expo-router. Los archivos en `src/screens` se mantienen como demostración alternativa/referencia y comparten componentes y estado.

---

## Navegación y layout

- **Tab inferior personalizado:** definido en `app/(app)/_layout.tsx`, agrega animaciones y un _BottomNavigationBar_ futurista.
- **Stack superior:** el layout raíz (`app/_layout.tsx`) envuelve la navegación en un `ThemeProvider` y maneja el `StatusBar`.
- **Rutas dinámicas:** se aprovechan segmentos de expo-router para manejar modales (ej. confirmación de transferencia).

---

## Estado y datos simulados

El estado global reside en `src/store/useBankStore.ts`:

- Maneja **usuario**, **saldo**, **contactos**, **transferencias**, **recargas**, **sobres**, **automations** y **notificaciones**.
- Contiene acciones como `sendTransfer`, `makeRecharge`, `createAutomationRule`, `allocateToEnvelope` y utilidades para mantener la coherencia (ej. normalización de teléfonos, generación de notificaciones).
- Incluye funciones de simulación (`simulateIncomingTransfer`) para probar flujos.

Zustand permite actualizar el estado con mutaciones inmutables internas y facilita el consumo directo mediante hooks en componentes.

---

## Componentes destacados

- `FuturisticBackground`: provee gradientes, partículas y brillo de fondo previo a cada pantalla.
- `GlassCard`: tarjetas translúcidas con borde brillante.
- `NeonTextField`: campo de texto con filtrado opcional de caracteres, íconos y animaciones de foco.
- `PrimaryButton`: botón con gradiente e indicador de carga.
- `ProfileAvatarButton`: avatar circular con color dinámico.
- `MarqueeText`: texto deslizante reutilizable para resúmenes largos.

Cada componente está optimizado para reusabilidad y mantiene estilos consistentes mediante la paleta en `src/theme/colors.ts`.

---

## Pantallas y flujos

### Home (`home.tsx`)
Resumen del saldo, tarjetas de acceso rápido y sugerencias contextuales.

### History (`history.tsx`)
Listado cronológico de transferencias y recargas con filtros por mes, categoría y estado. Incluye panel plegable, calendario por mes y resumen animado con `MarqueeText`.

### Transfer (`transfer.tsx`) y Confirm Transfer (`confirm-transfer.tsx`)
Flujo en dos pasos:
- Selección de destinatario manual, desde contactos o escaneo QR.
- Validación avanzada de teléfono (`sanitizePhoneInput`, `formatPhoneNumber`) y monto (`sanitizeAmountInput`, `formatAmountDisplay`).
- Confirmación visual con posibilidad de navegar al historial desde el modal de éxito.

### Contacts (`contacts.tsx`)
Gestión de contactos:
- Buscador que soporta coincidencias por nombre y dígitos sanitizados.
- Creación/edición en modal con cierre táctil fuera del formulario.
- Manejo de favoritos y orden por uso reciente.

### Mobile Recharge (`mobile-recharge.tsx`)
Seleccione operador, ingrese número y monto. Usa los mismos helpers de validación de transferencias para garantizar formatos coherentes.

### Automations, Envelopes, Goals, Insights, Notifications
Secciones para administración de reglas automáticas, sobres presupuestarios, metas de ahorro, analítica mensual y notificaciones clasificadas. Cada vista se apoya en el estado central y comparte los componentes visuales neon.

### Profile / Profile QR
Muestra datos del usuario, métricas de uso y acceso a un QR para compartir su información.

---

## Utilidades comunes

- `src/utils/phone.ts`: sanitiza y formatea números (longitud estándar de 8 dígitos, formato `0000-0000`).
- `src/utils/amount.ts`: creado para unificar sanitización, display y parseo de montos con separadores regionales.
- `src/utils/currency.ts`: formatea montos en colones costarricenses (`es-CR`).
- `src/utils/id.ts`: genera identificadores pseudoúnicos legibles.

---

## Scripts disponibles

```bash
# Iniciar el bundler interactivo de Expo en modo actual
npm run start

# Iniciar en modo Classic (útil para Expo Go sin nuevas arquitecturas)
npm run start:classic

# Ejecutar nativo en Android (requiere entorno Android configurado)
npm run android

# Ejecutar nativo en iOS (necesita macOS + Xcode)
npm run ios

# Ejecutar en web (React Native Web)
npm run web

# Ejecutar ESLint sobre todo el proyecto
npm run lint
```

> Para un entorno óptimo, instala Expo CLI (`npm install -g expo-cli`) y asegúrate de tener configurado el SDK correspondiente si compilarás apps nativas.

---

## Convenciones y buenas prácticas

- **Imports con alias `@/...`** definidos en `babel.config.js` y `tsconfig.json` para rutas limpias.
- **Componentes auto-documentados**: se agregan comentarios mínimos solo cuando la lógica no es evidente.
- **ASCII por defecto**: se evita introducir caracteres no ASCII en código fuente salvo que el archivo ya los utilice (por ejemplo, strings en español con acentos cuando corresponde).
- **Estado local vs global**: se privilegia el store central cuando los datos impactan múltiples vistas; se recurre a `useState` para estados efímeros de UI.

---

## Próximos pasos sugeridos

1. **Internacionalización**: integrar i18n para soportar múltiples idiomas.
2. **Persistencia**: añadir almacenamiento local (AsyncStorage/SQLite) o backend real.
3. **Testing**: incorporar pruebas unitarias con Jest/React Native Testing Library.
4. **Accesibilidad**: revisar contrastes y etiquetas `accessibilityLabel` en todos los componentes interactivos.
5. **CI/CD**: automatizar linting y builds con GitHub Actions.

---

## Recursos adicionales

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [Expo Router Guide](https://expo.github.io/router/docs)
- [Zustand Patterns](https://docs.pmnd.rs/zustand/guides)

---

¿Tienes preguntas o deseas profundizar en alguna sección? Abre un issue o contacta al equipo responsable del proyecto.
