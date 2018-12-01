
import EmpatiElement, { ParticleBase, RegisterParticle } from "../Element";

export function Property(Target: EmpatiElement, Key: string){
  RegisterParticle(PropertyParticle, Target);
  (Target.Particles.PropertyParticle as PropertyParticle).PropertyKeys.push(Key);
}

export class PropertyParticle extends ParticleBase {

  PropertyKeys: string[] = [];
  
  BeforeConstr(Target: EmpatiElement){
    this.PropertyKeys.forEach(Key => Target.DefineProp(Key, undefined, (Super, Value) => {
      const Old = Target.Store[Key];
      if(Old === Value) return Old;
      Super(Value);
      Target.Refresh();
    }));
  }
}