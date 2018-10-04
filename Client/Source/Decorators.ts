import EEBase from "./Particles";
import { MinimalProperty } from "./Particles/PropertyParticle";
import { MinimalQS } from "./Particles/QSParticle";

export function Property(Target: any, Key: string) {
  if(!("PropertySet" in Target)) Target.PropertySet = [];
  (Target as typeof MinimalProperty).PropertySet.push(Key);
}

export function Attribute(Target: any, Key: string) {
  if(!("AttributeSet" in Target)) Target.AttributeSet = [];
  if(!("observedAttributes" in Target)) Target.observedAttributes = [];
  (Target as typeof MinimalProperty).AttributeSet.push(Key);
  (Target as typeof MinimalProperty).observedAttributes.push(Key.toLowerCase());
}

export function Query(Selector: string){  
  return function (Target: any, Key: string) {
    if(!("Queries" in Target)) Target.Queries = {};
    (Target as MinimalQS).Queries[Key] = Selector;
  }
}

export function QueryAll(Selector: string){
  return function (Target: any, Key: string) {
    if(!("AllQueries" in Target)) Target.AllQueries = {};
    (Target as MinimalQS).AllQueries[Key] = Selector;
  }
}

export function Event(Event: string, 
    Host?: (this: EEBase) => EEBase | EEBase | string){
  return function (Target: any, Key: string) {
    if(!("Events" in Target)) Target.Events = [];
    //@ts-ignore
    (Target as typeof EEBase).Events.push({
      Event, Host, Func: Target[Key]
    });
  }
}

export function IEvent(Event: string){
  return function (Target: any, Key: string) {
    if(!("IEvents" in Target)) Target.IEvents = [];
    //@ts-ignore
    (Target as typeof EEBase).IEvents.push({
      Event, Func: Target[Key]
    });
  }
}
