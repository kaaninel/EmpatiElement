
import EmpatiElement, { ParticleBase, RegisterParticle } from "../EmpatiElement";

export function Property(Target: EmpatiElement, Key: string){
  RegisterParticle(PropertyParticle, Target);
  (Target.Particles.PropertyParticle as PropertyParticle).PropertyKeys.push(Key);
}

export class PropertyParticle extends ParticleBase {

  PropertyKeys: string[] = [];

  Properties: Record<string, any> = {};
  
  BeforeConstr(Target: EmpatiElement){
    this.PropertyKeys.forEach(this.DefineProperty.bind(this, Target));
  }

  private DefineProperty(this: PropertyParticle, Target: EmpatiElement, Key: string){
    Object.defineProperty(Target, Key, {
      get: () => this.Properties[Key],
      set: (Value: any) => {
        const Old = this.Properties[Key];
        if(Old === Value) return Old;
        this.Properties[Key] = Value;
        Target.Refresh();
      }
    })
  }
}