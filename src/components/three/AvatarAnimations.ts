import * as THREE from 'three';
import { GLTF } from 'three-stdlib';
import { AnimationClip, AnimationAction } from 'three';

export interface AnimationState {
  posture: number;
  gestures: number;
  eyeContact: number;
  voiceClarity: number;
}

export class AvatarAnimationController {
  private mixer: THREE.AnimationMixer;
  private model: THREE.Group;
  private animations: Map<string, THREE.AnimationAction>;
  private currentState: AnimationState;

  constructor(gltf: GLTF, model: THREE.Group) {
    this.mixer = new THREE.AnimationMixer(model);
    this.model = model;
    this.animations = new Map();
    this.currentState = {
      posture: 85,
      gestures: 75,
      eyeContact: 80,
      voiceClarity: 85
    };

    // Initialize animations from GLTF
    gltf.animations.forEach((clip: AnimationClip) => {
      const action = this.mixer.clipAction(clip);
      this.animations.set(clip.name, action);
    });
  }

  update(delta: number, state: AnimationState) {
    // Update mixer
    this.mixer.update(delta);
    this.currentState = state;

    // Update model based on metrics
    this.updatePosture();
    this.updateGestures();
    this.updateEyeContact();
  }

  private updatePosture() {
    const targetRotation = THREE.MathUtils.degToRad((this.currentState.posture - 85) * 0.2);
    this.model.rotation.x = THREE.MathUtils.lerp(
      this.model.rotation.x,
      targetRotation,
      0.1
    );
  }

  private updateGestures() {
    // Blend between idle and gesture animations based on score
    const gestureWeight = (this.currentState.gestures - 70) / 30;
    const idleAction = this.animations.get('idle');
    const gestureAction = this.animations.get('gesture');
    if (idleAction) idleAction.weight = 1 - gestureWeight;
    if (gestureAction) gestureAction.weight = gestureWeight;
  }

  private updateEyeContact() {
    // Adjust head tracking based on eye contact score
    const lookWeight = this.currentState.eyeContact / 100;
    const lookAction = this.animations.get('look');
    if (lookAction) {
      lookAction.weight = lookWeight;
    }
  }

  playAnimation(name: string) {
    const action = this.animations.get(name);
    if (action) {
      action.reset().play();
    }
  }

  crossFade(from: string, to: string, duration: number = 0.5) {
    const fromAction = this.animations.get(from);
    const toAction = this.animations.get(to);

    if (fromAction && toAction) {
      toAction.reset().play();
      fromAction.crossFadeTo(toAction, duration, true);
    }
  }
}
