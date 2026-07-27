import { createPlacedNailComponent, getPlacedNailComponents, deletePlacedNailComponent } from '../../../../services/nailDesign.service';

export function normalizeLookupValue(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function buildColorJsonFromTryOn(config) {
  const nails = Array.isArray(config?.nails) ? config.nails : [];
  const fingers = nails.map((nail, index) => ({
    fingerIndex: index + 1,
    color: nail?.color || '#FF4081',
    gradient: nail?.gradient ?? null,
  }));
  const firstFinger = fingers[0];

  if (!firstFinger) {
    return JSON.stringify({ mode: 'solid', color: '#FF4081', gradient: null });
  }

  const hasSameAppearance = fingers.every(
    (finger) =>
      finger.color === firstFinger.color
      && JSON.stringify(finger.gradient) === JSON.stringify(firstFinger.gradient),
  );

  if (hasSameAppearance) {
    return JSON.stringify({
      mode: firstFinger.gradient ? 'gradient' : 'solid',
      color: firstFinger.color,
      gradient: firstFinger.gradient,
    });
  }

  return JSON.stringify({
    mode: 'perFinger',
    fingers,
  });
}

export function buildPlacedNailComponentValues(nailVariantId, config) {
  const groupedDecorations = new Map();
  const nails = Array.isArray(config?.nails) ? config.nails : [];

  nails.forEach((nail, nailIndex) => {
    const decorations = Array.isArray(nail?.decorations) ? nail.decorations : [];

    decorations.forEach((decoration) => {
      const componentId = String(decoration?.componentId || '').trim();
      if (!componentId) {
        return;
      }

      const decorationId = String(decoration?.id || `${componentId}-${nailIndex}`);
      const existing = groupedDecorations.get(decorationId);

      if (existing) {
        existing.nailIndexes.push(nailIndex);
        return;
      }

      groupedDecorations.set(decorationId, {
        decoration,
        nailIndexes: [nailIndex],
      });
    });
  });

  return [...groupedDecorations.values()].map(({ decoration, nailIndexes }) => ({
    componentId: decoration.componentId,
    nailVariantId,
    posX: Number(decoration.x || 0),
    posY: Number(decoration.y || 0),
    fingerIndex: nailIndexes.length === 5 ? -1 : nailIndexes[0] + 1,
    configJson: JSON.stringify({
      scale: Number(decoration.scale || 0),
      rotation: Number(decoration.rotation || 0),
    }),
  }));
}

export async function createVariantNailComponents(nailVariantId, config) {
  const placedComponents = buildPlacedNailComponentValues(nailVariantId, config);

  try {
    const existingComponents = await getPlacedNailComponents(nailVariantId);
    if (existingComponents && existingComponents.length > 0) {
      await Promise.all(
        existingComponents.map((comp) => deletePlacedNailComponent(comp.id))
      );
    }
  } catch (err) {
    console.error("Failed to delete existing components", err);
  }

  if (!placedComponents.length) {
    return;
  }

  await Promise.all(placedComponents.map((component) => createPlacedNailComponent(component)));
}

export function findShapeId(shapes, config) {
  const shapeName = normalizeLookupValue(config?.shape);
  const matchedShape = shapes.find((shape) => normalizeLookupValue(shape.name) === shapeName);

  return matchedShape?.nailShapeId ?? shapes[0]?.nailShapeId ?? 0;
}

export function findSurfaceId(surfaces, config) {
  const materialName = normalizeLookupValue(config?.material);
  const matchedSurface = surfaces.find((surface) => {
    const surfaceName = normalizeLookupValue(surface.name);
    const shaderName = normalizeLookupValue(surface.shaderParam);

    return surfaceName === materialName || shaderName === materialName;
  });

  return matchedSurface?.nailSurfaceId ?? surfaces[0]?.nailSurfaceId ?? 0;
}
