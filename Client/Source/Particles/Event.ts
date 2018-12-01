import EmpatiElement, { ParticleBase, RegisterParticle } from "../Element";

const EventTransform = function<T extends EmpatiElement>(Target: T, Key: Extract<keyof T, string>, PD: PropertyDescriptor){
  RegisterParticle(EventParticle, Target);
  (Target.Particles.EventParticle as EventParticle).Definitions.push([Key, this as string, PD.value]);
}

export const Event = new Proxy(EventTransform, {
  get(Target, Key: string) {
    return EventTransform.bind(Key);
  }
}) as typeof EventTransform & Record<string, typeof EventTransform>;

export class EventParticle extends ParticleBase {
  Definitions: [string, string | undefined, Function][] = [];

  BeforeConstr(Target: EmpatiElement){
    this.Definitions.forEach(Def => {
      (Target as any)[Def[0]] = function(this: HTMLElement, Event: CustomEvent){
        return Def[2].call(Target, Event, this);
      }
      if(Def[1]) Target.addEventListener(Def[1], (Target as any)[Def[0]]);
    });
  }
}