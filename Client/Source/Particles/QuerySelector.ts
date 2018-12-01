import EmpatiElement, { ParticleBase, RegisterParticle } from "Lib/Element";

export function QuerySelector(Selector: string){
  return function<T extends EmpatiElement>(Target: T, Key: Extract<keyof T, string>) {
    RegisterParticle(QueryParticle, Target);
    (Target.Particles.QueryParticle as QueryParticle).Queries[Key] = Selector;
  } 
}

export function QuerySelectorAll(Selector: string, Reactive = true){
  return function<T extends EmpatiElement>(Target: T, Key: Extract<keyof T, string>) {
    RegisterParticle(QueryParticle, Target);
    (Target.Particles.QueryParticle as QueryParticle).AllQueries[Key] = [Selector, Reactive];
  } 
}

export class QueryParticle extends ParticleBase {

  Queries: Record<string, string> = {};
  AllQueries: Record<string, [string, boolean]> = {};

  BeforeConstr(Target: EmpatiElement){
    Object.entries(this.Queries).forEach(element => {
      Object.defineProperty(Target, element[0], {
        get(){
          return (Target.Root as ShadowRoot).querySelector(element[1][0]);
        }
      })
    });
    Object.entries(this.AllQueries).forEach(element => {
      Object.defineProperty(Target, element[0], {
        get(){
          return Array.from((Target.Root as ShadowRoot).querySelectorAll(element[1][0]));
        }
      })
    });
  }

}