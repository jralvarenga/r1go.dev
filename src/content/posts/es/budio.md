---
title: >-
  Mi Experiencia Construyendo Budio: Una Inmersión Profunda en Convex con
  Next.js y Polar
description: >-
  Una mirada profunda a construir Budio con Next.js, Convex, Better Auth y
  Polar, qué funcionó, qué no, y por qué los usaría de nuevo.
date: '2026-02-08'
links:
  - label: Budio Website
    url: 'https://budio.r1go.dev'
  - label: Convex
    url: 'https://www.convex.dev'
---
# Mi Experiencia Construyendo Mi Propia App de Presupuesto

Empecé a construir Budio hace unos 3 meses porque necesitaba empezar a rastrear mis finanzas y presupuesto mensual. La mayoría de los rastreadores de gastos y planificadores de presupuesto eran demasiado complicados o caros, así que tomé la decisión de construir mi propia solución. Al mismo tiempo, había estado viendo mucha atención y hype alrededor de Convex y Polar, la gente decía que estas herramientas eran revolucionarias. Spoiler: lo son, al menos para mí. Así que pensé que esta sería la oportunidad perfecta para probarlas en un proyecto real.

Antes de sumergirnos, quiero ser claro: no estoy tratando de venderte el uso de Budio. Esta app es un experimento para mí mismo para probar nuevas herramientas y arreglar un problema que tengo al mismo tiempo. Lo que quiero compartir es mi experiencia y opinión honesta sobre estas herramientas, los desafíos técnicos que enfrenté y cómo los resolví.

## Por Qué Next.js (y Por Qué No Tanstack Start... Todavía)

No hay una razón particular para elegir Next.js inicialmente, lo he estado usando para casi todo lo que construyo. Funciona para mí y es la herramienta que más uso. El ecosistema es maduro, la documentación es sólida, y puedo moverme rápido con él.

Ahora, mientras construía Budio, Tanstack Start fue lanzado, y estaba genuinamente emocionado por ello. Lo probé un poco por mi cuenta, y realmente fue genial. Hay tantas cosas que realmente disfruté de Tanstack Start. El hecho de que el sistema de archivos del router esté completamente tipado es un cambio de juego para mí, no más referencias de rutas basadas en strings, no más errores de runtime por typos en la navegación. La seguridad de tipos en toda la capa de routing se sintió como lo que Next.js debería haber estado haciendo todo el tiempo, y tengo que admitir que estaba celoso de perderme todas las características que tiene sobre Next.js.

Pero aquí está la realidad: todavía disfruto mucho trabajar con Next.js, y soy demasiado perezoso y ocupado para migrar todo el código a Tanstack Start. El paradigma de componentes de servidor de la app, las optimizaciones integradas, y la familiaridad simplemente ganaron para este proyecto. Seguiré usando Next.js para Budio por ahora pero me encantó Tanstack Start y definitivamente lo usaré en el futuro para otro proyecto paralelo o experimento, o incluso migrar esta app.

## Internacionalización y Cambiador de Idioma: Vibe Coding FTW

Para la internacionalización, decidí intentar construir mi propia solución. Seguí la documentación de Next.js y simplemente programé con vibe a través de la implementación. Quería ver qué tan lejos podía llegar sin traer abstracciones extras, y por ahora, el enfoque se siente simple, claro, y hace exactamente lo que necesito.

Aquí está mi enfoque: Creé un proveedor de contexto simple que maneja el cambio de idioma, emparejado con una estructura JSON para traducciones:

```typescript
// lib/i18n/provider.tsx
"use client";

import { createContext, useContext, useMemo } from "react";
import type { Locale } from "@/lib/i18n/locales";

type Messages = Record<string, unknown>;

type I18nContextValue = {
  locale: Locale;
  messages: Messages;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function getByPath(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, part) => {
    if (
      acc &&
      typeof acc === "object" &&
      part in (acc as Record<string, unknown>)
    ) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

function interpolate(template: string, vars?: Record<string, string | number>) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k: string) =>
    Object.prototype.hasOwnProperty.call(vars, k) ? String(vars[k]) : `{${k}}`,
  );
}

export function I18nProvider({
  locale,
  messages,
  children,
}: {
  locale: Locale;
  messages: Messages;
  children: React.ReactNode;
}) {
  const value = useMemo<I18nContextValue>(() => {
    const t: I18nContextValue["t"] = (key, vars) => {
      const found = getByPath(messages, key);
      if (typeof found !== "string") return key;
      return interpolate(found, vars);
    };
    return { locale, messages, t };
  }, [locale, messages]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within <I18nProvider />");
  }
  return ctx;
}
```

Estoy contento con la solución temporal actual por ahora. Quizás en el futuro, a medida que la app escala, requerirá algo más sofisticado (como reglas adecuadas de pluralización, formato de mensajes ICU, etc.), pero por el momento es lo suficientemente bueno y no agrega complejidad innecesaria.

## Mi Experiencia con Convex

Convex es genial. Realmente creo que es una herramienta revolucionaria para backend-as-a-service. Comparado con servicios similares como Firebase o Supabase, ni siquiera está cerca, Convex es el rey, y probablemente lo usaré para la mayoría de mis proyectos de ahora en adelante.

### Por Qué Convex Sobre Firebase/Supabase

Nunca fui fan de Firebase y Supabase, donde toda la base de datos está esencialmente abierta y dependes fuertemente de reglas de seguridad. He usado ambos, y cuando lo hago, la experiencia es como caminar sobre vidrio, un movimiento en falso y todo se rompe. Las reglas de seguridad son difíciles de probar, difíciles de depurar, y difíciles de razonar a medida que tu app crece.

Convex tiene un enfoque totalmente diferente que resuena conmigo:

**1. API Basada en Funciones**: Creas tus propios endpoints (queries, mutations, actions) explícitamente. Abres solo lo que quieres abrir. Se siente más como una API REST tradicional pero sin los dolores de cabeza de configurar Express, manejar CORS, gestionar deployment, etc.

**2. Real-time por Defecto**: Cada query es reactiva. Cuando los datos cambian, tu UI se actualiza automáticamente. No necesitas configurar suscripciones o gestionar conexiones WebSocket manualmente.

**3. TypeScript Todo el Camino**: La generación de código es fantástica. Tu código del lado del cliente sabe exactamente qué argumentos esperan tus funciones de backend y qué devuelven. Es type-safe de extremo a extremo.

**4. Desarrollo Local**: El servidor de desarrollo es rápido, y puedes probar todo localmente antes de deployar. El dashboard es limpio y realmente útil para depurar.

Amo la experiencia de trabajar con Convex y puedo recomendarlo al 100% a todos los que construyen apps web modernas.

## Convex + Better Auth: Un Comienzo Difícil, Pero Vale la Pena

Amo Better Auth y lo uso para todo lo que construyo en mis proyectos paralelos. Es flexible, open-source, y no te encierra en un proveedor específico. Así que pensé que esta sería una gran oportunidad para probar la integración de Convex + Better Auth.

### La Lucha (Pre-0.10)

Después de usarlo por un tiempo, tengo que ser honesto, no fue genial inicialmente. Estaba realmente frustrado con ello. La autenticación no persistía entre sesiones, a veces las requests no funcionaban como se esperaba, y la integración se sentía rota. El problema principal era verificar si un usuario estaba autenticado en funciones de Convex. Los patrones sugeridos en la documentación no funcionaban de manera confiable, y estaba obteniendo comportamiento inconsistente.

Estaba *a nada de* migrar a Clerk porque ya había tenido suficiente de luchar con la integración. Clerk hubiera sido plug-and-play, pero realmente no quería renunciar a Better Auth.

### El Cambio (Versión 0.10)

Entonces se lanzó la versión 0.10, y vaya, todos los problemas desaparecieron. Introdujeron mejores formas de verificar si el usuario está autenticado, que era mi problema principal. Específicamente, agregaron un patrón más robusto `auth.getUserIdentity()` en Convex que funciona consistentemente:

```typescript
// Antes (no confiable)
import { getTokenNextjs, createAuth } from "@repo/convex/server";
import { CreateAuth } from "@convex-dev/better-auth";
import type { DataModel } from "@repo/convex/generated/dataModel.js";

const getToken = () => {
  return getTokenNextjs(createAuth as CreateAuth<DataModel>);
};

const token = await getToken();

if (!token) {
  redirect("/auth/login");
}

// Después de 0.10 (confiable)
import { convexBetterAuthNextJs } from "@convex-dev/better-auth/nextjs";

export const {
  handler,
  preloadAuthQuery,
  isAuthenticated,
  getToken,
  fetchAuthQuery,
  fetchAuthMutation,
  fetchAuthAction,
} = convexBetterAuthNextJs({
  convexUrl: process.env.NEXT_PUBLIC_CONVEX_URL!,
  convexSiteUrl: process.env.NEXT_PUBLIC_CONVEX_SITE_URL!,
});

const user = await isAuthenticated();
```

Todo empezó a funcionar como se esperaba, y estaba feliz de no tener que migrar. La gestión de sesiones se volvió sólida y el estado de autenticación se sincronizó adecuadamente entre el cliente y las funciones de Convex.

### Mi Recomendación

Puedo recomendar la combinación de Convex + Better Auth, pero con precaución. Mi uso de esta integración no es tan profundo, estoy manejando email/password básico y Google OAuth y gestión de sesiones. No puedo hablar de funciones más complicadas como magic links, o control de acceso basado en roles avanzado. Si estás haciendo algo simple, es genial. Si necesitas flujos de autenticación complejos, investiga primero o considera Clerk.

## ¿Es Polar Tan Genial?

Sí. Realmente disfruté trabajar con Polar. Es una plataforma moderna de pagos y suscripciones que realmente está diseñada para desarrolladores. La API es limpia, la documentación es buena, y es fácil de integrar en cualquier framework.

### La Experiencia de Integración

Fui con la integración de Better Auth, que se conecta al sistema de autenticación de usuarios sin problemas. El SDK de Polar es directo:

### El Desafío: Webhooks en Convex

Pero encontré un obstáculo con mi stack específico. Las integraciones de webhooks de Polar asumen un runtime de Node.js. En Convex, el entorno de Node.js solo está disponible en actions, no en archivos de configuración de base de datos o esquemas donde herramientas como Better Auth y Polar se inicializan comúnmente. Esto crea una discrepancia.

El manejador típico de webhooks de Polar se ve así:

```typescript
// Este patrón no funciona directamente en Convex
const auth = betterAuth({
    // ... Better Auth config
    plugins: [
        polar({
            client: polarClient,
            createCustomerOnSignUp: true,
            use: [
                webhooks({
                    secret: process.env.POLAR_WEBHOOK_SECRET,
                    onCustomerStateChanged: (payload) => // Se activa cuando algo respecto a un cliente cambia
                    onOrderPaid: (payload) => // Se activa cuando un pedido fue pagado (compra, renovación de suscripción, etc.)
                    ...  // Más de 25 manejadores de webhooks granulares
                    onPayload: (payload) => // Atrapa todo para todos los eventos
                })
            ],
        })
    ]
});
```

### Mi Solución

Creé mis propios endpoints para webhooks de Polar usando actions de Convex, que tienen acceso al runtime de Node.js:

```typescript
// convex/polar.ts
export const handlePolarWebhook = httpAction(async (ctx, request) => {
  const secret = process.env.POLAR_WEBHOOK_SECRET;
  if (!secret) {
    console.error("Polar webhook: secret not configured");
    return new Response("Webhook secret not configured", { status: 500 });
  }

  try {
    const body = await request.text();

    // Obtener headers de Standard Webhooks
    const webhookId = request.headers.get("webhook-id");
    const webhookTimestamp = request.headers.get("webhook-timestamp");
    const webhookSignature = request.headers.get("webhook-signature");

    if (!webhookId || !webhookTimestamp || !webhookSignature) {
      console.error("Polar webhook: missing required headers");
      return new Response("Missing required headers", { status: 400 });
    }

    // Standard Webhooks: message = "msg_id.timestamp.body"
    const signedContent = `${webhookId}.${webhookTimestamp}.${body}`;

    // Preparar el secreto - intentar decodificar base64 primero, fallback a string raw
    let secretBytes: Uint8Array;
    const textEncoder = new TextEncoder();
    const secretWithoutPrefix = secret.startsWith("whsec_")
      ? secret.slice(6)
      : secret;

    try {
      secretBytes = base64ToUint8Array(secretWithoutPrefix);
    } catch {
      secretBytes = textEncoder.encode(secretWithoutPrefix);
    }

    // Importar la key para HMAC
    const keyBuffer = new ArrayBuffer(secretBytes.length);
    new Uint8Array(keyBuffer).set(secretBytes);
    const key = await crypto.subtle.importKey(
      "raw",
      keyBuffer,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );

    // Computar la firma
    const encoder = new TextEncoder();
    const signatureBuffer = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(signedContent),
    );
    const computedSignature = uint8ArrayToBase64(
      new Uint8Array(signatureBuffer),
    );

    // Parsear y verificar firmas proporcionadas (formato: "v1,sig1 v1,sig2")
    const providedSignatures = webhookSignature.split(" ");
    let isValid = false;

    for (const sig of providedSignatures) {
      if (sig.startsWith("v1,") && computedSignature === sig.substring(3)) {
        isValid = true;
        break;
      }
    }

    if (!isValid) {
      console.error("Polar webhook: signature verification failed");
      return new Response("Invalid signature", { status: 401 });
    }

    // Parsear y procesar el webhook
    const payload = JSON.parse(body);
    const eventType = payload.type;
    const data = payload.data;

    switch (eventType) {
      case "customer.created":
        // acción aquí
        break;

      case "subscription.created":
      case "subscription.updated":
        // acción aquí
        break;

      case "subscription.canceled":
      case "subscription.revoked":
        // acción aquí
        break;
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Polar webhook error:", error);
    return new Response(
      JSON.stringify({ error: "Webhook processing failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
```

Luego expuse esto a través de la configuración http de Convex:

```typescript
// convex/http.ts
http.route({
  path: "/api/polar/webhooks",
  method: "POST",
  handler: handlePolarWebhook,
});
```

Esta solución funciona bien por ahora, aunque creo que requerirá refactorización más adelante a medida que el manejo de webhooks se vuelva más complejo. Pero para mis necesidades actuales, es sólida.

## Resumen del Stack Técnico

Aquí está el stack completo con el que terminé:

- **Framework**: Next.js 16
- **Backend**: Convex
- **Autenticación**: Better Auth
- **Pagos**: Polar
- **Estilos**: Tailwind CSS ,  shadcn/ui
- **Deployment**: Vercel (frontend), Convex Cloud (backend)

La separación de responsabilidades es limpia: Next.js maneja la UI y el routing, Convex maneja toda la lógica de datos y actualizaciones en tiempo real, Better Auth gestiona las sesiones, y Polar maneja la monetización.

## El Producto Final

He estado usando Budio constantemente por alrededor de un mes ahora, y estoy realmente feliz con ello. Todavía necesito ajustar algunas cosas, y hasta ahora es solo web. En algún momento trabajaré en una app de React Native para probar la integración con Convex y Better Auth en móvil, pero por ahora la app web funciona perfectamente para mis necesidades.

### Qué Hace Budio

Es una app realmente simple con características enfocadas:

**1. Rastreo de Gastos**: Agrega gastos con monto, descripción, categoría y cuenta. Véalos en una vista de lista limpia con filtros.

**2. Transacciones Recurrentes**: Configura ingresos y gastos recurrentes (salario, alquiler, suscripciones). La app proyecta automáticamente estos en meses futuros.

**3. Gestión de Cuentas/Billeteras**: Rastrea múltiples cuentas (cheques, ahorros, tarjetas de crédito). Vea los saldos actualizarse en tiempo real a medida que agregas transacciones.

**4. Insights Basados en Categorías**: Organiza gastos por categoría (comida, transporte, entretenimiento). Desglose visual de patrones de gasto.

**5. Planificación de Presupuesto**: Planifica presupuestos mensuales basados en transacciones recurrentes y datos históricos. Recibe alertas cuando estás cerca de los límites del presupuesto.

### La Propuesta de Valor

¿Funciona para mí? Absolutamente. Reemplacé completamente mi hoja de cálculo de Excel para la planificación de presupuesto. Las actualizaciones en tiempo real, la simplicidad, y el hecho de que lo construí para resolver mi problema exacto lo hace perfecto para mi caso de uso.

Por supuesto, hay muchas apps sobre finanzas, e incluso mejores que se conectan directamente con tu cuenta bancaria (como Mint, YNAB, o Copilot). No estoy apuntando a ese nivel de complejidad. Quiero algo más simple para rastrear manualmente mis cosas. La integración de Plaid también es bastante cara ($200+/mes después del tier sandbox) y no tiene sentido para mí en este momento para un proyecto personal.

### La Característica Clave: Rastreo de Gastos en Equipo

Creo que una característica clave es la capacidad de rastrear gastos con tu equipo. Esto puede ser una familia, una pareja, o tal vez tu propio equipo de trabajo. Múltiples personas pueden agregar transacciones, y todos ven los mismos datos en tiempo real. Aquí es donde entra el tier de pago en la app.

Cuando alguien en el equipo agrega un gasto, todos lo ven instantáneamente gracias a las suscripciones en tiempo real de Convex. No hay polling, no se necesita refrescar. Esto es enorme para presupuestos compartidos del hogar o rastreo de gastos de pequeñas empresas.

## Lo Que Aprendí

Construir Budio me enseñó mucho:

**1. No sobreingenieres**: Mi solución simple de i18n funciona mejor de lo que lo haría una librería compleja para este caso de uso.

**2. Convex es increíble**: Convex específicamente cambió cómo pienso sobre construir backends. La ganancia de productividad es real.

**3. Los webhooks de pago necesitan cuidado**: El requisito de runtime de Node.js para la validación de webhooks es una consideración real al elegir tu backend.

**5. Construye para ti mismo primero**: Porque soy el usuario principal, puedo iterar rápido sin preocuparme por casos edge que no me afectan todavía.

## Qué Sigue

Todavía hay más por hacer:

- **App móvil**: React Native con el mismo backend de Convex
- **Funcionalidad de exportación**: Exportación CSV para usuarios avanzados que quieren analizar datos en otro lugar
- **Presupuesto avanzado**: Presupuestos con rollover, metas de ahorro, seguimiento de pago de deudas
- **Escaneo de recibos**: Usar OCR para extraer datos de imágenes de recibos
- **Mejores analytics**: Insights y tendencias de gasto más detalladas

Pero no me estoy apurando. La app funciona para mis necesidades hoy, y agregaré características a medida que las necesite.

## Pensamientos Finales

Si estás considerando construir un SaaS o herramienta y te preguntas sobre el stack:

- **Convex**: Absolutamente pruébalo. El DX es fantástico.
- **Better Auth**: Genial si quieres flexibilidad, pero ten paciencia con las peculiaridades de integración.
- **Polar**: Excelente para suscripciones, solo planifica tu arquitectura de webhooks cuidadosamente.
- **Next.js**: Todavía sólido, pero mantén un ojo en Tanstack Start para proyectos futuros.

Budio no va a reemplazar la app de tu banco, y no está intentando hacerlo. Es una herramienta enfocada para personas que quieren control manual sobre su rastreo de presupuesto sin la hinchazón. Y construirla me enseñó más sobre desarrollo web moderno que cualquier tutorial podría.

Si quieres verlo o ver el código, contáctame. Y si tienes preguntas sobre Convex, Polar, o Better Auth, estoy feliz de compartir más detalles sobre la implementación.

Gracias por leer:)
