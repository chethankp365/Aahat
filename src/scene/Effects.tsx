import React from 'react';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { useSimStore } from '../state/simStore';

export function SceneEffects() {
  const enablePostProcessing = useSimStore((s) => s.enablePostProcessing);

  if (!enablePostProcessing) {
    return null;
  }

  return (
    <EffectComposer enableNormalPass={false}>
      <Bloom intensity={1.0} luminanceThreshold={0.6} mipmapBlur />
      <Vignette offset={0.2} darkness={0.5} />
    </EffectComposer>
  );
}
