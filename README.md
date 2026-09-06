# 3D Apparel Mockup Studio

A web-based 3D apparel mockup generator built with **Three.js** and **Tailwind CSS**. This application renders customizable 3D clothing items in real time with dynamic texture composition, custom graphic uploads, and procedural normal map shaders to simulate authentic fabric weaves like fine cotton and fleece.

---

## Features

* **3D Garment Rendering:** Interactive 3D apparel model with full 360-degree orbit, pan, and zoom controls.
* **Procedural Fabric Shaders:** On-the-fly micro-weave normal map generation that realistically simulates light scattering across fine cotton and plush fleece.
* **Real-Time Texture Mapping:** Upload custom graphic artwork (PNG, JPEG) with dynamic scaling and Y-axis placement controls.
* **Fabric Customization:** Instant fabric color picker and material property adjustments (sheen, roughness).
* **High-Res Snapshot Export:** Render and download crisp PNG previews directly from the browser viewport.

---

## Project Structure

```text
3d-apparel-studio/
│
├── index.html       # Main HTML layout, UI control panel, and import maps
├── app.js           # Three.js scene, lighting, procedural shaders, and event logic
└── README.md        # Documentation and deployment guide
