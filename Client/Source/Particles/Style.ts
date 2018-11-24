import EmpatiElement, { ParticleBase } from "../EmpatiElement";

export class GhostParticle extends ParticleBase {
  AfterConstr(Target: EmpatiElement){
    Target.style.display = "none";
  }
}