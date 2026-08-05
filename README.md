# ¿Hay Paro Hoy? 🇦🇷

[![Sitio en vivo](https://img.shields.io/badge/sitio-en%20vivo-6b46c1)](https://hayparo.net.ar)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

**¿Hay paro de colectivos, subte o trenes hoy en Buenos Aires?** Sitio
web gratuito que responde SÍ/NO al instante, con el detalle de qué
servicios y líneas están afectados cuando se sabe. El estado se detecta
**solo, automáticamente**, a partir de noticias — no depende de que
alguien lo actualice a mano.

## Usarlo

No hay que instalar nada — es una página web. Entrá directo a:

### 👉 [hayparo.net.ar](https://hayparo.net.ar)

Funciona igual en el celular que en la computadora.

## Preguntas frecuentes

**¿Cómo sabe si hay paro?**
El sitio revisa noticias de medios argentinos varias veces al día y usa
inteligencia artificial para decidir si hay evidencia de un paro
confirmado para hoy específicamente (no uno de la semana que viene, ni
uno ya terminado).

**¿Necesito crear una cuenta?**
No, no hay cuentas, ni login, ni nada parecido.

**¿Manda mis datos a algún lado?**
No. El sitio no pide ni guarda ningún dato tuyo — ni siquiera sabe que
entraste.

**¿Es gratis?**
Sí, y no tiene publicidad ni ningún costo oculto.

**¿Puede equivocarse?**
Puede pasar — depende de qué tan clara sea la cobertura de noticias ese
día. Ante la duda, el sistema prefiere decir que no hay paro antes que
alarmar sin evidencia clara.

## Para desarrolladores

Requisitos: [Node.js](https://nodejs.org/) 20+, cuenta gratuita en
[Supabase](https://supabase.com) y una API key de
[Google AI Studio](https://aistudio.google.com/apikey) (Gemini).

```bash
git clone https://github.com/malenitaa/hayparo.git
cd hayparo
npm install
cp .env.example .env.local   # completar con tus propias credenciales
npm run dev
```

## ¿Te sirvió?

Si te resultó útil y querés bancar el proyecto:

- [Cafecito](https://cafecito.app/rezamalena)
- [Ko-fi](https://ko-fi.com/malenitaa)

## Licencia

MIT — ver [LICENSE](LICENSE).
