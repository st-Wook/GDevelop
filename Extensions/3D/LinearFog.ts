namespace gdjs {
  gdjs.PixiFiltersTools.registerFilterCreator(
    'Scene3D::LinearFog',
    new (class implements gdjs.PixiFiltersTools.FilterCreator {
      makeFilter(
        target: EffectsTarget,
        effectData: EffectData
      ): gdjs.PixiFiltersTools.Filter {
        return new (class implements gdjs.PixiFiltersTools.Filter {
          fog: THREE.Fog;

          constructor() {
            this.fog = new THREE.Fog(0xffffff);
          }

          isEnabled(target: EffectsTarget): boolean {
            const scene = target.get3DRendererObject() as
              | THREE.Scene
              | null
              | undefined;
            return scene ? scene.fog === this.fog : false;
          }
          setEnabled(target: EffectsTarget, enabled: boolean): boolean {
            if (enabled) {
              return this.applyEffect(target);
            } else {
              return this.removeEffect(target);
            }
          }
          applyEffect(target: EffectsTarget): boolean {
            const scene = target.get3DRendererObject() as
              | THREE.Scene
              | null
              | undefined;
            if (!scene || scene.fog === undefined) {
              return false;
            }
            scene.fog = this.fog;
            return true;
          }
          removeEffect(target: EffectsTarget): boolean {
            const scene = target.get3DRendererObject() as
              | THREE.Scene
              | null
              | undefined;
            if (!scene || scene.fog === undefined) {
              return false;
            }
            scene.fog = null;
            return true;
          }
          updatePreRender(target: gdjs.EffectsTarget): any {}
          updateDoubleParameter(parameterName: string, value: number): void {
            if (parameterName === 'near') {
              this.fog.near = value;
            } else if (parameterName === 'far') {
              this.fog.far = value;
            }
          }
          updateStringParameter(parameterName: string, value: string): void {
            if (parameterName === 'color') {
              this.fog.color = new THREE.Color(
                gdjs.PixiFiltersTools.rgbOrHexToHexNumber(value)
              );
            }
          }
          updateBooleanParameter(parameterName: string, value: boolean): void {}
        })();
      }
    })()
  );
}
