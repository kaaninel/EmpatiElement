import EmpatiElement, { ParticleBase, RegisterParticle } from "Lib/EmpatiElement";

export function QuerySelector(Selector: string, Reactive = true){
  return function<T extends EmpatiElement>(Target: T, Key: Extract<keyof T, string>) {
    RegisterParticle(QueryParticle, Target);
    (Target.Particles.QueryParticle as QueryParticle).Queries[Key] = [Selector, Reactive];
  } 
}

export function QuerySelectorAll(Selector: string, Reactive = true){
  return function<T extends EmpatiElement>(Target: T, Key: Extract<keyof T, string>) {
    RegisterParticle(QueryParticle, Target);
    (Target.Particles.QueryParticle as QueryParticle).AllQueries[Key] = [Selector, Reactive];
  } 
}

export class QueryParticle extends ParticleBase {

  Queries: Record<string, [string, boolean]> = {};
  AllQueries: Record<string, [string, boolean]> = {};

  BeforeConstr(Target: EmpatiElement){
    Object.entries(this.Queries).forEach(element => {
      Object.defineProperty(Target, element[0], {
        get(){
          return (Target.Root as ShadowRoot).querySelector(element[1][0]);
        }
      })
    });
  }

}