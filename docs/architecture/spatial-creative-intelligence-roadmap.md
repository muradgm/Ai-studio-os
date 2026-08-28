# Spatial Creative Intelligence roadmap

## Locked principle
AI Studio OS should understand not only how things look and move, but the spatial, mathematical and physical logic that makes those behaviors believable and creatively intentional.

Spatial capability is not synonymous with Three.js, WebGL, Blender, shaders, or physics engines. Those are production technologies selected only after creative intent, proof, and feasibility justify them.

## Authority relationship

```text
Creative Thesis
  -> Selected Creative World
    -> Motion Creative Intelligence
    -> Spatial Creative Intelligence
      -> Spatial / physical / material proof
        -> Technical planning
          -> Blender / WebGL / Three.js / shader / runtime implementation
```

Motion and Spatial Creative Intelligence are sibling specialist creative authorities. Motion may emit creative handoff intent to Spatial Intelligence, but may not select the final spatial technology or production pipeline.

## Spatial Creative Intelligence V1 scope

1. Spatial necessity
   - Why does depth or 3D belong?
   - What can spatial treatment achieve that 2D cannot?
   - Is the intended result better expressed as 2D, 2.5D, live 3D, pre-rendered 3D, or no 3D?

2. Spatial creative direction
   - spatial thesis
   - composition in depth
   - object hierarchy
   - negative space
   - scale relationships
   - spatial rhythm
   - relationship between UI, typography, imagery and 3D
   - stillness policy
   - anti-patterns

3. Camera intelligence
   - camera necessity
   - framing
   - projection choice
   - focal behavior
   - camera movement grammar
   - parallax policy
   - continuity vs cuts
   - responsive camera reinterpretation

4. Geometry / mathematical reasoning
   - coordinate spaces and transforms
   - vectors, matrices and quaternions
   - interpolation
   - Bezier / spline paths
   - projection
   - normals / tangents / UVs
   - parametric surfaces
   - signed-distance fields where appropriate
   - procedural sampling / instancing
   - collision and bounding geometry when required

5. Physical behavior intelligence
   Use the cheapest model that produces the intended perceptual behavior.

   Levels:
   - deterministic/keyframed
   - spring / inertia / damping / drag
   - interaction physics: collisions / constraints / impulses / gravity
   - advanced simulation: cloth / particles / soft bodies / fluids / rigid bodies

   Shared perceptual vocabulary with Motion Intelligence:
   - perceived mass
   - friction
   - inertia
   - elasticity
   - damping
   - velocity
   - acceleration
   - drag
   - collision
   - constraint
   - momentum

6. Material / shader intelligence
   - material intent before shader implementation
   - vertex vs fragment behavior
   - lighting response
   - reflection / refraction / Fresnel
   - displacement / normal perturbation
   - procedural noise
   - SDF / raymarching only when justified
   - GPU particles / compute only when justified
   - post-processing restraint
   - anti-generic effects policy

7. Blender production intelligence
   Decide what belongs in Blender versus the live browser:
   - modeling / sculpting
   - procedural geometry / Geometry Nodes
   - materials
   - lighting
   - camera
   - rigging / animation
   - simulation
   - compositing
   - baked/pre-rendered output
   - glTF/browser asset preparation

8. Web runtime intelligence
   - Three.js / raw WebGL / WebGPU / Canvas / CSS / video decision
   - asset loading
   - LOD / instancing
   - shader and draw-call budgets
   - texture budgets
   - memory / GPU constraints
   - mobile adaptation
   - reduced-motion and low-power fallbacks
   - accessibility and input behavior

## Build order

Do not build a giant physics or shader framework up front.

1. Finish Motion Creative Intelligence V1.
2. Prove Motion Creative World authority binding.
3. Build rendered Motion Proof and Motion Critic.
4. Stabilize Motion Direction -> technical planning boundary.
5. Start Spatial Creative Intelligence V1.
6. Add camera + composition reasoning.
7. Add geometry / transform reasoning.
8. Add material / shader reasoning.
9. Add lightweight physical behavior reasoning.
10. Add Blender/browser production strategy.
11. Add advanced simulation only when benchmark or real project evidence requires it.

## Non-goals

- 3D for spectacle alone
- WebGL as a quality score
- Blender as the default production route
- physically accurate simulation when perceptual approximation is sufficient
- shaders/effects without Creative World evidence
- technical sophistication overriding UX, accessibility, performance or project truth

## Core test

Every spatial decision should survive:

> Does this spatial, mathematical, physical or material behavior strengthen the selected Creative World and product experience enough to justify its complexity?

If not, simplify or remove it.
